/*
# Fix Profile Insert Policy

The current RLS policy for inserting profiles is too restrictive for newly signed-up users.
This migration updates the policy to allow users to create their own profile after signup.

## Changes
1. Drop existing insert policy for profiles
2. Create new policy that allows users to insert their own profile using `TO public`
3. This allows newly authenticated users to create their profile record
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows users to insert their own profile
-- Using TO public instead of TO authenticated to allow newly signed up users
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);