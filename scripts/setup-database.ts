import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env') })

// Use service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('⚠️  Supabase environment variables not configured yet.')
  console.log('Please click "Connect to Supabase" in the top right to set up your database connection.')
  console.log('After connecting, the database schema will be automatically set up.')
  process.exit(0)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('Setting up database schema...')

  try {
    // Create profiles table
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          role text NOT NULL CHECK (role IN ('homeowner', 'business_owner', 'contractor', 'admin')),
          full_name text NOT NULL,
          phone text,
          created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        
        CREATE POLICY "Users can read own profile" ON profiles
          FOR SELECT TO authenticated
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE TO authenticated
          USING (auth.uid() = id);
          
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT TO public
          WITH CHECK (true);
      `
    })

    if (profilesError) {
      console.error('Error creating profiles table:', profilesError)
    } else {
      console.log('✓ Profiles table created')
    }

    // Create contractors table
    const { error: contractorsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS contractors (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
          company_name text NOT NULL,
          contact_name text NOT NULL,
          email text NOT NULL,
          phone text NOT NULL,
          service_areas jsonb DEFAULT '[]'::jsonb,
          trades jsonb DEFAULT '[]'::jsonb,
          capacity text DEFAULT 'active' CHECK (capacity IN ('active', 'paused')),
          calendly_url text,
          created_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Contractors can read own data" ON contractors;
        DROP POLICY IF EXISTS "Contractors can update own data" ON contractors;
        DROP POLICY IF EXISTS "Users can create contractor profile" ON contractors;
        
        CREATE POLICY "Contractors can read own data" ON contractors
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
          
        CREATE POLICY "Contractors can update own data" ON contractors
          FOR UPDATE TO authenticated
          USING (user_id = auth.uid());
          
        CREATE POLICY "Users can create contractor profile" ON contractors
          FOR INSERT TO public
          WITH CHECK (user_id = auth.uid());
      `
    })

    if (contractorsError) {
      console.error('Error creating contractors table:', contractorsError)
    } else {
      console.log('✓ Contractors table created')
    }

    // Create projects table with RLS policies
    const { error: projectsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS projects (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES profiles(id),
          status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'matched', 'scheduled', 'onsite', 'packet_sent', 'paid', 'completed')),
          address text NOT NULL,
          city text NOT NULL,
          state text NOT NULL,
          zip text NOT NULL,
          peril text NOT NULL CHECK (peril IN ('flood', 'water', 'wind', 'fire', 'mold', 'other')),
          incident_at timestamptz NOT NULL,
          description text NOT NULL,
          policy_number text,
          carrier_name text,
          assigned_contractor_id uuid REFERENCES contractors(id),
          packet_url text,
          payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
          contact_name text NOT NULL,
          contact_phone text NOT NULL,
          contact_email text NOT NULL,
          preferred_date date NOT NULL,
          preferred_window text NOT NULL CHECK (preferred_window IN ('8-10', '10-12', '12-2', '2-4', '4-6')),
          metadata jsonb DEFAULT '{}'::jsonb,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
        
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can read own projects" ON projects;
        DROP POLICY IF EXISTS "Users can update own projects" ON projects;
        DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
        DROP POLICY IF EXISTS "Allow project creation" ON projects;
        DROP POLICY IF EXISTS "Contractors can read assigned projects" ON projects;
        
        CREATE POLICY "Users can read own projects" ON projects
          FOR SELECT TO public
          USING (user_id = auth.uid() OR auth.uid() IS NULL);
          
        CREATE POLICY "Users can update own projects" ON projects
          FOR UPDATE TO authenticated
          USING (user_id = auth.uid());
          
        CREATE POLICY "Users can delete own projects" ON projects
          FOR DELETE TO authenticated
          USING (user_id = auth.uid());
          
        CREATE POLICY "Allow project creation" ON projects
          FOR INSERT TO public
          WITH CHECK (true);
          
        CREATE POLICY "Contractors can read assigned projects" ON projects
          FOR SELECT TO public
          USING (assigned_contractor_id IN (
            SELECT contractors.id FROM contractors 
            WHERE contractors.user_id = auth.uid()
          ) OR auth.uid() IS NULL);
      `
    })

    if (projectsError) {
      console.error('Error creating projects table:', projectsError)
    } else {
      console.log('✓ Projects table created with RLS policies')
    }

    // Fix profiles RLS policy for insertion
    const { error: fixProfilesError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
        
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT TO public
          WITH CHECK (true);
      `
    })

    if (fixProfilesError) {
      console.error('Error fixing profiles policy:', fixProfilesError)
    } else {
      console.log('✓ Profiles insert policy fixed')
    }

    console.log('Database setup completed!')
    
  } catch (error) {
    console.error('Database setup failed:', error)
  }
}

// Run the setup
setupDatabase()