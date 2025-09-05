/*
# Fix Authentication RLS Policies

Fixes the RLS policies to allow proper authentication flow for newly signed-up users.

## Changes
1. Drop existing restrictive policies
2. Create new policies that allow public access for profile creation
3. Maintain security while enabling proper signup flow

## Security
- Users can only create their own profile record
- All other operations remain properly secured
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new policy that allows newly signed-up users to create their profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

-- Ensure all other necessary policies exist
CREATE POLICY IF NOT EXISTS "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Fix contractors policies
DROP POLICY IF EXISTS "Users can create contractor profile" ON contractors;

CREATE POLICY "Users can create contractor profile" ON contractors
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

-- Fix projects policies  
DROP POLICY IF EXISTS "Users can create projects" ON projects;

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT TO public
  WITH CHECK (user_id = auth.uid());

-- Fix media policies
DROP POLICY IF EXISTS "Users can create project media" ON media;

CREATE POLICY "Users can create project media" ON media
  FOR INSERT TO public
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Fix payments policies
DROP POLICY IF EXISTS "Users can create project payments" ON payments;

CREATE POLICY "Users can create project payments" ON payments
  FOR INSERT TO public
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );