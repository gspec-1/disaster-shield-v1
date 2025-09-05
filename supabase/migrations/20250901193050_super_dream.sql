/*
  # Populate contractors table with dummy data using state abbreviations

  This migration adds 12 dummy contractors to test the matching algorithm.
  
  1. Contractors Added
    - 12 contractors across multiple states (FL, TX, CA, NY, GA, NC)
    - Various trades: water_mitigation, mold, rebuild, roofing, smoke_restoration
    - Mix of active (11) and paused (1) contractors
    - Some with Calendly URLs for online scheduling
  
  2. Service Areas
    - Uses state abbreviations: FL, TX, CA, NY, GA, NC
    - Includes major cities within each state
    - Covers different geographic regions for testing
  
  3. Testing Coverage
    - Water damage specialists in FL
    - Storm/wind contractors in TX
    - Fire restoration in CA
    - General contractors in NY
    - Mixed specialties in GA and NC
*/

-- Clear existing contractors first (optional)
DELETE FROM contractors WHERE email LIKE '%@%';

-- Insert dummy contractors with state abbreviations
INSERT INTO contractors (
  company_name,
  contact_name,
  email,
  phone,
  service_areas,
  trades,
  capacity,
  calendly_url
) VALUES
(
  'Gulf Rapid Restore',
  'James Miller',
  'james@gulfrapid.com',
  '+19415551212',
  '["FL", "Tampa", "Sarasota", "St. Petersburg"]'::jsonb,
  '["water_mitigation", "mold"]'::jsonb,
  'active',
  'https://calendly.com/gulfrapid/inspection'
),
(
  'Sunshine Restoration',
  'Maria Rodriguez',
  'maria@sunshinerestoration.com',
  '+13055552345',
  '["FL", "Miami", "Fort Lauderdale", "West Palm Beach"]'::jsonb,
  '["water_mitigation", "rebuild", "mold"]'::jsonb,
  'active',
  'https://calendly.com/sunshine-restoration'
),
(
  'Storm Shield Contractors',
  'David Thompson',
  'david@stormshield.com',
  '+17275553456',
  '["FL", "Tampa", "Clearwater", "Largo"]'::jsonb,
  '["roofing", "rebuild"]'::jsonb,
  'active',
  NULL
),
(
  'Fire & Water Solutions',
  'Sarah Johnson',
  'sarah@firewaterfl.com',
  '+18135554567',
  '["FL", "Tampa", "Brandon", "Riverview"]'::jsonb,
  '["water_mitigation", "smoke_restoration", "rebuild"]'::jsonb,
  'active',
  'https://calendly.com/firewater-solutions'
),
(
  'Elite Mold Remediation',
  'Michael Chen',
  'michael@elitemold.com',
  '+19545555678',
  '["FL", "Fort Lauderdale", "Hollywood", "Pembroke Pines"]'::jsonb,
  '["mold", "water_mitigation"]'::jsonb,
  'active',
  NULL
),
(
  'Texas Storm Recovery',
  'Robert Wilson',
  'robert@txstormrecovery.com',
  '+14695556789',
  '["TX", "Dallas", "Fort Worth", "Plano"]'::jsonb,
  '["roofing", "rebuild"]'::jsonb,
  'active',
  'https://calendly.com/tx-storm-recovery'
),
(
  'Lone Star Restoration',
  'Patricia Garcia',
  'patricia@lonestarrestore.com',
  '+17135557890',
  '["TX", "Houston", "Sugar Land", "Katy"]'::jsonb,
  '["water_mitigation", "mold", "rebuild"]'::jsonb,
  'active',
  NULL
),
(
  'Golden State Restoration',
  'Jennifer Lee',
  'jennifer@goldenstaterestore.com',
  '+14155558901',
  '["CA", "San Francisco", "Oakland", "San Jose"]'::jsonb,
  '["water_mitigation", "rebuild", "smoke_restoration"]'::jsonb,
  'active',
  NULL
),
(
  'Empire State Contractors',
  'Anthony Russo',
  'anthony@empirestatecontractors.com',
  '+12125559012',
  '["NY", "New York", "Brooklyn", "Queens"]'::jsonb,
  '["rebuild", "water_mitigation", "mold"]'::jsonb,
  'active',
  'https://calendly.com/empire-state-contractors'
),
(
  'Peach State Recovery',
  'Amanda Davis',
  'amanda@peachstaterecovery.com',
  '+14045550123',
  '["GA", "Atlanta", "Marietta", "Alpharetta"]'::jsonb,
  '["water_mitigation", "rebuild"]'::jsonb,
  'active',
  NULL
),
(
  'Coastal Cleanup Crew',
  'Brian Martinez',
  'brian@coastalcleanup.com',
  '+19105551234',
  '["NC", "Wilmington", "Jacksonville", "Myrtle Beach"]'::jsonb,
  '["water_mitigation", "mold"]'::jsonb,
  'active',
  'https://calendly.com/coastal-cleanup'
),
(
  'Rapid Response Restoration',
  'Lisa Wang',
  'lisa@rapidresponsefl.com',
  '+18635552345',
  '["FL", "Lakeland", "Winter Haven", "Bartow"]'::jsonb,
  '["water_mitigation", "rebuild"]'::jsonb,
  'paused',
  NULL
);