/*
# Complete DisasterShield Database Setup with Lenient RLS

Creates all required tables for the DisasterShield platform with lenient RLS policies
that allow proper user registration and authentication flow.

## New Tables

1. **profiles** - User profile information
   - `id` (uuid, primary key, references auth.users)
   - `role` (text) - homeowner, business_owner, contractor, admin
   - `full_name` (text) - User's full name
   - `phone` (text) - Contact phone number
   - `created_at` (timestamptz) - Account creation timestamp

2. **contractors** - Contractor business information
   - `id` (uuid, primary key)
   - `user_id` (uuid, references profiles) - Links to user account
   - `company_name` (text) - Business name
   - `contact_name` (text) - Primary contact person
   - `email` (text) - Business email
   - `phone` (text) - Business phone
   - `service_areas` (jsonb) - Geographic service areas
   - `trades` (jsonb) - Specialized services offered
   - `capacity` (text) - active or paused
   - `calendly_url` (text) - Online scheduling link
   - `created_at` (timestamptz) - Registration timestamp

3. **projects** - Insurance claim projects
   - Complete project tracking with all necessary fields
   - Status workflow management
   - Contact and scheduling information
   - Insurance details and metadata

4. **media** - Project documentation files
5. **match_requests** - Contractor job invitations
6. **payments** - Transaction records

## Security

- Row Level Security (RLS) enabled on all tables
- LENIENT policies that allow new user registration
- Users can create their own records without authentication barriers
- Proper foreign key constraints for data integrity
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('homeowner', 'business_owner', 'contractor', 'admin')),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create contractors table
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

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
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

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  room_tag text,
  storage_path text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Create match_requests table
CREATE TABLE IF NOT EXISTS match_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(project_id, contractor_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stripe_session_id text,
  amount integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Contractors can read own data" ON contractors;
DROP POLICY IF EXISTS "Contractors can update own data" ON contractors;
DROP POLICY IF EXISTS "Users can create contractor profile" ON contractors;
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Contractors can read assigned projects" ON projects;
DROP POLICY IF EXISTS "Users can read own project media" ON media;
DROP POLICY IF EXISTS "Users can create project media" ON media;
DROP POLICY IF EXISTS "Contractors can read assigned project media" ON media;
DROP POLICY IF EXISTS "Contractors can read own match requests" ON match_requests;
DROP POLICY IF EXISTS "System can create match requests" ON match_requests;
DROP POLICY IF EXISTS "Users can read own project payments" ON payments;
DROP POLICY IF EXISTS "Users can create project payments" ON payments;

-- LENIENT RLS POLICIES FOR NEW USER REGISTRATION

-- Profiles: LENIENT policies for new user registration
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- CRITICAL: Use TO public for INSERT to allow new user registration
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

-- Contractors: LENIENT policies for contractor registration
CREATE POLICY "Contractors can read own data" ON contractors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Contractors can update own data" ON contractors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- CRITICAL: Use TO public for INSERT to allow contractor profile creation
CREATE POLICY "Users can create contractor profile" ON contractors
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

-- Projects: LENIENT policies for project creation
CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- CRITICAL: Use TO public for INSERT to allow project creation
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Contractors can read assigned projects" ON projects
  FOR SELECT TO authenticated
  USING (
    assigned_contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- Media: LENIENT policies for media uploads
CREATE POLICY "Users can read own project media" ON media
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- CRITICAL: Use TO public for INSERT to allow media uploads
CREATE POLICY "Users can create project media" ON media
  FOR INSERT TO public
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can read assigned project media" ON media
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE assigned_contractor_id IN (
        SELECT id FROM contractors WHERE user_id = auth.uid()
      )
    )
  );

-- Match requests: LENIENT policies for job matching
CREATE POLICY "Contractors can read own match requests" ON match_requests
  FOR SELECT TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- CRITICAL: Use TO public for system operations
CREATE POLICY "System can create match requests" ON match_requests
  FOR INSERT TO public
  WITH CHECK (true);

-- Payments: LENIENT policies for payment processing
CREATE POLICY "Users can read own project payments" ON payments
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- CRITICAL: Use TO public for INSERT to allow payment creation
CREATE POLICY "Users can create project payments" ON payments
  FOR INSERT TO public
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_contractor ON projects(assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_capacity ON contractors(capacity);
CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_project_id ON match_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_contractor_id ON match_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);