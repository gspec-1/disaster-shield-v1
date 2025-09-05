/*
# Fix Profiles Insert Policy

Fixes the RLS policy for the profiles table to allow authenticated users to insert their own profile record during signup.

## Changes

1. **profiles table**
   - Update INSERT policy to allow users to insert records with their own auth.uid()
   - Ensures proper security while enabling user registration flow

## Security

- Users can only insert profile records with their own user ID
- Maintains data integrity and prevents unauthorized profile creation
*/

-- Drop the existing overly permissive insert policy
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;

-- Create a proper insert policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);