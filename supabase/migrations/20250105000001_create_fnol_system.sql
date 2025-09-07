-- Create insurance companies table for API integrations
CREATE TABLE IF NOT EXISTS insurance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  api_endpoint text,
  api_key_encrypted text,
  api_headers jsonb DEFAULT '{}',
  supported_perils text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  requires_manual_submission boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create FNOL (First Notice of Loss) records table
CREATE TABLE IF NOT EXISTS fnol_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insurance_company_id uuid REFERENCES insurance_companies(id),
  submission_method text NOT NULL CHECK (submission_method IN ('api', 'manual', 'email', 'fax')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'acknowledged', 'rejected', 'failed')),
  
  -- FNOL specific data
  fnol_number text, -- Claim number from insurance company
  submission_date timestamptz,
  acknowledgment_date timestamptz,
  acknowledgment_reference text,
  
  -- Submission details
  submitted_by uuid REFERENCES profiles(id),
  submission_notes text,
  api_response jsonb,
  error_message text,
  
  -- Document references
  fnol_document_url text,
  supporting_documents jsonb DEFAULT '[]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create FNOL templates table for different insurance companies
CREATE TABLE IF NOT EXISTS fnol_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_company_id uuid REFERENCES insurance_companies(id),
  template_name text NOT NULL,
  template_type text DEFAULT 'standard' CHECK (template_type IN ('standard', 'custom', 'api_mapping')),
  template_content jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FNOL status to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fnol_status text DEFAULT 'not_filed' CHECK (fnol_status IN ('not_filed', 'pending', 'submitted', 'acknowledged', 'rejected'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fnol_records_project_id ON fnol_records(project_id);
CREATE INDEX IF NOT EXISTS idx_fnol_records_insurance_company_id ON fnol_records(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_fnol_records_status ON fnol_records(status);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_active ON insurance_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_fnol_status ON projects(fnol_status);

-- Insert default insurance companies
INSERT INTO insurance_companies (name, display_name, requires_manual_submission, supported_perils) VALUES
('liberty_mutual', 'Liberty Mutual', false, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('state_farm', 'State Farm', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('allstate', 'Allstate', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('farmers', 'Farmers Insurance', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('progressive', 'Progressive', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('usaa', 'USAA', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('travelers', 'Travelers', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('nationwide', 'Nationwide', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('geico', 'GEICO', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('american_family', 'American Family', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']),
('other', 'Other Insurance Company', true, ARRAY['water', 'flood', 'wind', 'fire', 'mold']);

-- Create default FNOL template
INSERT INTO fnol_templates (insurance_company_id, template_name, template_type, template_content) 
SELECT 
  id,
  'Standard FNOL Template',
  'standard',
  '{
    "title": "First Notice of Loss (FNOL)",
    "sections": [
      {
        "name": "Policyholder Information",
        "fields": [
          {"name": "full_name", "label": "Full Name", "required": true, "type": "text"},
          {"name": "phone", "label": "Phone Number", "required": true, "type": "phone"},
          {"name": "email", "label": "Email Address", "required": true, "type": "email"},
          {"name": "policy_number", "label": "Policy Number", "required": true, "type": "text"}
        ]
      },
      {
        "name": "Property Information",
        "fields": [
          {"name": "property_address", "label": "Property Address", "required": true, "type": "text"},
          {"name": "city", "label": "City", "required": true, "type": "text"},
          {"name": "state", "label": "State", "required": true, "type": "text"},
          {"name": "zip", "label": "ZIP Code", "required": true, "type": "text"}
        ]
      },
      {
        "name": "Loss Information",
        "fields": [
          {"name": "loss_date", "label": "Date of Loss", "required": true, "type": "date"},
          {"name": "loss_time", "label": "Time of Loss (if known)", "required": false, "type": "time"},
          {"name": "peril_type", "label": "Type of Loss", "required": true, "type": "select", "options": ["Water Damage", "Flood", "Wind/Storm", "Fire", "Mold", "Other"]},
          {"name": "loss_description", "label": "Description of Loss", "required": true, "type": "textarea"},
          {"name": "cause_of_loss", "label": "Cause of Loss", "required": false, "type": "text"},
          {"name": "areas_affected", "label": "Areas Affected", "required": false, "type": "text"},
          {"name": "estimated_damage", "label": "Estimated Damage Amount", "required": false, "type": "currency"}
        ]
      },
      {
        "name": "Emergency Actions",
        "fields": [
          {"name": "emergency_repairs", "label": "Emergency Repairs Taken", "required": false, "type": "textarea"},
          {"name": "prevented_further_damage", "label": "Actions to Prevent Further Damage", "required": false, "type": "textarea"},
          {"name": "police_report", "label": "Police Report Filed", "required": false, "type": "boolean"},
          {"name": "police_report_number", "label": "Police Report Number", "required": false, "type": "text"}
        ]
      },
      {
        "name": "Additional Information",
        "fields": [
          {"name": "witnesses", "label": "Witnesses", "required": false, "type": "textarea"},
          {"name": "additional_notes", "label": "Additional Notes", "required": false, "type": "textarea"}
        ]
      }
    ]
  }'::jsonb
FROM insurance_companies 
WHERE name = 'other';

-- Create RLS policies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnol_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnol_templates ENABLE ROW LEVEL SECURITY;

-- Insurance companies are readable by all authenticated users
CREATE POLICY "Insurance companies are viewable by authenticated users" ON insurance_companies
  FOR SELECT USING (auth.role() = 'authenticated');

-- FNOL records are accessible by project owner and admins
CREATE POLICY "Users can view their own FNOL records" ON fnol_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = fnol_records.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create FNOL records for their projects" ON fnol_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = fnol_records.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own FNOL records" ON fnol_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = fnol_records.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- FNOL templates are readable by all authenticated users
CREATE POLICY "FNOL templates are viewable by authenticated users" ON fnol_templates
  FOR SELECT USING (auth.role() = 'authenticated');
