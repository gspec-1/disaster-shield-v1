/*
  # Populate contractors table with dummy data

  1. Data Population
    - Insert 12 dummy contractors across multiple states
    - Cover all trade types: water_mitigation, mold, rebuild, roofing, smoke_restoration
    - Include diverse service areas and contact information
    - Mix of active and paused contractors for testing

  2. Coverage Areas
    - Florida: Tampa, Miami, Fort Lauderdale, Sarasota areas
    - Texas: Dallas area
    - California: San Francisco area
    - New York: NYC area
    - Georgia: Atlanta area
    - North Carolina: Coastal area

  3. Testing Purpose
    - Provides realistic data for testing matching algorithm
    - Covers different geographical regions
    - Includes all available trade specializations
*/

-- Insert dummy contractors for testing
INSERT INTO contractors (
  company_name,
  contact_name,
  email,
  phone,
  service_areas,
  trades,
  capacity
) VALUES
  (
    'Tampa Bay Water Restoration',
    'Mike Johnson',
    'mike@tampabaywater.com',
    '(813) 555-0101',
    '["Tampa", "St. Petersburg", "Clearwater", "Brandon", "Riverview"]'::jsonb,
    '["water_mitigation", "mold"]'::jsonb,
    'active'
  ),
  (
    'Sunshine State Rebuild',
    'Sarah Martinez',
    'sarah@sunshinerebuild.com',
    '(305) 555-0102',
    '["Miami", "Homestead", "Coral Gables", "Aventura", "Doral"]'::jsonb,
    '["rebuild", "roofing"]'::jsonb,
    'active'
  ),
  (
    'Florida Fire & Smoke Pros',
    'David Chen',
    'david@flfirepros.com',
    '(954) 555-0103',
    '["Fort Lauderdale", "Hollywood", "Pompano Beach", "Coral Springs"]'::jsonb,
    '["smoke_restoration", "rebuild"]'::jsonb,
    'active'
  ),
  (
    'Gulf Coast Contractors',
    'Lisa Thompson',
    'lisa@gulfcoastcontractors.com',
    '(941) 555-0104',
    '["Sarasota", "Bradenton", "Venice", "Port Charlotte"]'::jsonb,
    '["water_mitigation", "roofing", "rebuild"]'::jsonb,
    'active'
  ),
  (
    'Orlando Emergency Services',
    'Robert Wilson',
    'robert@orlandoemergency.com',
    '(407) 555-0105',
    '["Orlando", "Winter Park", "Kissimmee", "Sanford"]'::jsonb,
    '["water_mitigation", "mold", "smoke_restoration"]'::jsonb,
    'paused'
  ),
  (
    'Panhandle Restoration',
    'Jennifer Davis',
    'jennifer@panhandlerest.com',
    '(850) 555-0106',
    '["Tallahassee", "Panama City", "Pensacola", "Destin"]'::jsonb,
    '["water_mitigation", "rebuild"]'::jsonb,
    'active'
  ),
  (
    'Lone Star Water Damage',
    'Carlos Rodriguez',
    'carlos@lonestarwater.com',
    '(214) 555-0201',
    '["Dallas", "Plano", "Irving", "Garland", "Mesquite"]'::jsonb,
    '["water_mitigation", "mold"]'::jsonb,
    'active'
  ),
  (
    'Golden State Restoration',
    'Amanda Lee',
    'amanda@goldenstaterest.com',
    '(415) 555-0301',
    '["San Francisco", "Oakland", "San Jose", "Fremont", "Hayward"]'::jsonb,
    '["water_mitigation", "smoke_restoration", "rebuild"]'::jsonb,
    'active'
  ),
  (
    'Empire State Emergency',
    'Michael Brown',
    'michael@empirestateemerg.com',
    '(212) 555-0401',
    '["New York", "Brooklyn", "Queens", "Bronx", "Staten Island"]'::jsonb,
    '["water_mitigation", "mold", "roofing"]'::jsonb,
    'active'
  ),
  (
    'Peach State Contractors',
    'Ashley Garcia',
    'ashley@peachstatecontractors.com',
    '(404) 555-0501',
    '["Atlanta", "Marietta", "Alpharetta", "Roswell", "Sandy Springs"]'::jsonb,
    '["rebuild", "roofing", "smoke_restoration"]'::jsonb,
    'active'
  ),
  (
    'Tar Heel Restoration',
    'James Miller',
    'james@tarheelrest.com',
    '(919) 555-0601',
    '["Raleigh", "Durham", "Chapel Hill", "Cary", "Wake Forest"]'::jsonb,
    '["water_mitigation", "mold"]'::jsonb,
    'active'
  ),
  (
    'Coastal Carolina Services',
    'Maria Gonzalez',
    'maria@coastalcarolina.com',
    '(910) 555-0602',
    '["Wilmington", "Jacksonville", "New Bern", "Morehead City"]'::jsonb,
    '["water_mitigation", "rebuild", "roofing"]'::jsonb,
    'active'
  );