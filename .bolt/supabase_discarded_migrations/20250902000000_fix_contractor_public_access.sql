/*
  # Fix contractors RLS policy for public browsing

  The current RLS policy only allows contractors to read their own data,
  but the BrowseContractors page needs to read ALL contractors for public browsing.
  
  This migration adds a policy to allow public read access to contractors
  while maintaining security for updates and inserts.
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Contractors can read own data" ON contractors;

-- Create new policy that allows public read access to contractors
CREATE POLICY "Allow public read access to contractors" ON contractors
  FOR SELECT TO public
  USING (true);

-- Keep the existing update and insert policies for security
-- (These should already exist from previous migrations)
