/*
  # Populate contractors table with dummy data

  1. Data Insertion
    - Adds 12 diverse contractors across multiple states
    - Covers all major trade types (water mitigation, mold, rebuild, roofing, fire restoration)
    - Includes contractors in FL, TX, CA, NY, GA, NC
    - Mix of active and paused contractors for testing

  2. Coverage Areas
    - Florida: Tampa, Miami, Fort Lauderdale, Sarasota regions
    - Texas: Dallas/Fort Worth area
    - California: San Francisco Bay area
    - New York: NYC area
    - Georgia: Atlanta area
    - North Carolina: Coastal area

  3. Trade Specializations
    - Water mitigation specialists
    - Mold remediation experts
    - General contractors/rebuild
    - Roofing specialists
    - Fire/smoke restoration
*/

-- Insert dummy contractors for testing
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
    'Golden State Restoration',
    'Jennifer Lee',
    'jennifer@goldenstaterestore.com',
    '+14155557890',
    '["CA", "San Francisco", "Oakland", "San Jose"]'::jsonb,
    '["water_mitigation", "rebuild"]'::jsonb,
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
    '["NC", "Wilmington", "Jacksonville"]'::jsonb,
    '["water_mitigation", "mold"]'::jsonb,
    'active',
    'https://calendly.com/coastal-cleanup'
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
    'All-Pro Contractors',
    'Kevin Brown',
    'kevin@allprocontractors.com',
    '+17865552345',
    '["FL", "Miami", "Homestead", "Kendall"]'::jsonb,
    '["rebuild", "roofing"]'::jsonb,
    'active',
    'https://calendly.com/allpro-contractors'
  )
ON CONFLICT (email) DO NOTHING;