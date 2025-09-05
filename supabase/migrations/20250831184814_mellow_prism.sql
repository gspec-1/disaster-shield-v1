/*
# Fix Profiles Insert Policy for Signup

Fixes the RLS policy for the profiles table to allow newly signed-up users to insert their profile record.

## Changes

1. **profiles table**
   - Update INSERT policy to allow public access during signup
   - Maintains security with WITH CHECK clause ensuring users can only insert their own profile
   - Resolves foreign key constraint violation during user registration

## Security

- Users can only insert profile records with their own auth.uid()
- Prevents unauthorized profile creation while enabling signup flow
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a public insert policy that allows signup while maintaining security
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT TO public
  WITH CHECK (auth.uid() = id);