/*
  # Populate contractors table with dummy data (corrected state abbreviations)

  1. Data Population
    - Inserts 12 dummy contractors across multiple states
    - Uses proper state abbreviations (FL, TX, CA, NY, GA, NC)
    - Covers all trade types and service areas
    - Mix of active/paused contractors for testing

  2. Coverage
    - Florida: 6 contractors (Tampa, Miami, Fort Lauderdale areas)
    - Texas: 1 contractor (Dallas area)
    - California: 1 contractor (San Francisco area)
    - New York: 1 contractor (NYC area)
    - Georgia: 1 contractor (Atlanta area)
    - North Carolina: 1 contractor (coastal area)

  3. Trades Covered
    - Water mitigation
    - Mold remediation
    - General contracting/rebuild
    - Roofing
    - Fire/smoke restoration
*/

-- Clear existing dummy data first (optional)
DELETE FROM contractors WHERE email LIKE '%@%' AND company_name IN (
  'Gulf Rapid Restore',
  'Sunshine Restoration', 
  'Storm Shield Contractors',
  'Fire & Water Solutions',
  'Elite Mold Remediation',
  'Texas Storm Recovery',
  'Golden State Restoration',
  'Empire State Contractors',
  'Peach State Recovery',
  'Coastal Cleanup Crew',
  'Rapid Response Restoration',
  'All-Pro Contractors'
);

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
    'Rapid Response Restoration',
    'Lisa Wang',
    'lisa@rapidresponsefl.com',
    '+18635551234',
    '["FL", "Lakeland", "Winter Haven", "Bartow"]'::jsonb,
    '["water_mitigation", "rebuild"]'::jsonb,
    'paused',
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
    'Golden State Restoration',
    'Jennifer Lee',
    'jennifer@goldenstaterestore.com',
    '+14155557890',
    '["CA", "San Francisco", "Oakland", "San Jose"]'::jsonb,
    '["water_mitigation", "rebuild", "smoke_restoration"]'::jsonb,
    'active',
    NULL
  ),
  (
    'Empire State Contractors',
    'Anthony Russo',
    'anthony@empirestatecontractors.com',
    '+12125558901',
    '["NY", "New York", "Brooklyn", "Queens"]'::jsonb,
    '["rebuild", "water_mitigation", "mold"]'::jsonb,
    'active',
    'https://calendly.com/empire-state-contractors'
  ),
  (
    'Peach State Recovery',
    'Amanda Davis',
    'amanda@peachstaterecovery.com',
    '+14045559012',
    '["GA", "Atlanta", "Marietta", "Alpharetta"]'::jsonb,
    '["water_mitigation", "rebuild"]'::jsonb,
    'active',
    NULL
  ),
  (
    'Coastal Cleanup Crew',
    'Brian Martinez',
    'brian@coastalcleanup.com',
    '+19105550123',
    '["NC", "Wilmington", "Jacksonville", "Myrtle Beach"]'::jsonb,
    '["water_mitigation", "mold"]'::jsonb,
    'active',
    'https://calendly.com/coastal-cleanup'
  ),
  (
    'All-Pro Contractors',
    'Kevin Brown',
    'kevin@allprocontractors.com',
    '+17865552345',
    '["FL", "Miami", "Homestead", "Kendall"]'::jsonb,
    '["rebuild", "roofing"]'::jsonb,
    'active',
    'https://calendly.com/allpro-contractors'
  );