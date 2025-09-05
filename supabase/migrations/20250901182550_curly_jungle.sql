/*
  # Add RLS policies for projects table

  1. Security
    - Enable RLS on projects table
    - Add policy for users to read their own projects
    - Add policy for users to update their own projects
    - Add policy for users to delete their own projects
    - Add policy for users to insert projects
    - Add policy for contractors to read assigned projects
*/

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Contractors can read assigned projects" ON projects;
DROP POLICY IF EXISTS "Allow project creation" ON projects;

-- Create RLS policies for projects
CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert projects" ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Contractors can read assigned projects" ON projects
  FOR SELECT
  TO authenticated
  USING (assigned_contractor_id IN (
    SELECT contractors.id FROM contractors 
    WHERE contractors.user_id = auth.uid()
  ));

-- Also allow public read for unauthenticated access (for contractor job browsing)
CREATE POLICY "Allow public read for job browsing" ON projects
  FOR SELECT
  TO public
  USING (true);