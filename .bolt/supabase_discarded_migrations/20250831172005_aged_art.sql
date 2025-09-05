/*
# Fix Profile Insert RLS Policy

Fixes the RLS policy for inserting profiles to allow newly signed-up users to create their profile record.

## Changes
1. Drop existing insert policy for profiles
2. Create new policy that allows users to insert their own profile using `TO public`
3. This allows newly authenticated users to create their profile record immediately after signup

## Security
- Still maintains security by checking that auth.uid() = id
- Only allows users to create their own profile record
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new policy that allows users to insert their own profile
-- Using TO public instead of TO authenticated to allow newly signed up users
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);