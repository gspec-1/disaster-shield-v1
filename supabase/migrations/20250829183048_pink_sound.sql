/*
# DisasterShield Core Schema

Creates the foundational database schema for the disaster recovery platform.

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
   - `id` (uuid, primary key)
   - `user_id` (uuid, references profiles) - Claim owner
   - `status` (text) - Project workflow status
   - `address` (text) - Property street address
   - `city`, `state`, `zip` (text) - Property location
   - `peril` (text) - Type of damage/disaster
   - `incident_at` (timestamptz) - When damage occurred
   - `description` (text) - Damage description
   - `policy_number`, `carrier_name` (text) - Insurance details
   - `assigned_contractor_id` (uuid) - Matched contractor
   - `packet_url` (text) - Generated claim packet location
   - `payment_status` (text) - Payment tracking
   - Contact and scheduling fields
   - `metadata` (jsonb) - Additional claim data
   - Timestamp fields

4. **media** - Project documentation files
   - `id` (uuid, primary key)
   - `project_id` (uuid, references projects, cascade delete)
   - `type` (text) - photo or video
   - `room_tag` (text) - Location within property
   - `storage_path` (text) - File location in storage
   - `caption` (text) - User description
   - `created_at` (timestamptz) - Upload timestamp

5. **match_requests** - Contractor job invitations
   - `id` (uuid, primary key)
   - `project_id` (uuid, references projects, cascade delete)
   - `contractor_id` (uuid, references contractors, cascade delete)
   - `status` (text) - sent, accepted, declined
   - `created_at` (timestamptz) - Invitation sent time
   - `responded_at` (timestamptz) - Response timestamp

6. **payments** - Transaction records
   - `id` (uuid, primary key)
   - `project_id` (uuid, references projects, cascade delete)
   - `stripe_session_id` (text) - Stripe reference
   - `amount` (integer) - Amount in cents
   - `status` (text) - Payment status
   - `created_at` (timestamptz) - Transaction timestamp

## Security

- Row Level Security (RLS) enabled on all tables
- Basic policies for authenticated access
- Proper foreign key constraints for data integrity

## Notes

- All tables use UUID primary keys for security
- Timestamps use timestamptz for proper timezone handling
- JSON columns for flexible metadata storage
- Cascade deletes for proper cleanup
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

-- Create basic RLS policies

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Contractors: Can read/update their own contractor record
CREATE POLICY "Contractors can read own data" ON contractors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Contractors can update own data" ON contractors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Projects: Users can read/update their own projects, contractors can read assigned projects
CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Contractors can read assigned projects" ON projects
  FOR SELECT TO authenticated
  USING (
    assigned_contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- Media: Users can read media for their projects, contractors can read media for assigned projects
CREATE POLICY "Users can read own project media" ON media
  FOR SELECT TO authenticated
  USING (
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

-- Match requests: Contractors can read their own requests
CREATE POLICY "Contractors can read own match requests" ON match_requests
  FOR SELECT TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractors WHERE user_id = auth.uid()
    )
  );

-- Payments: Users can read payments for their projects
CREATE POLICY "Users can read own project payments" ON payments
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_contractor ON projects(assigned_contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractors_user_id ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_capacity ON contractors(capacity);
CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_project_id ON match_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_contractor_id ON match_requests(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);