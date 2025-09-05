/*
# Add Sample Projects for Testing

Creates sample projects that contractors can browse and express interest in.
This helps test the contractor job browsing functionality.

## New Data

1. **Sample Projects**
   - Various damage types (water, fire, wind, mold)
   - Different locations across multiple states
   - Realistic incident descriptions
   - Proper scheduling preferences
   - Mix of insurance and non-insurance claims

## Purpose

- Enables testing of contractor job browsing
- Provides realistic data for development
- Demonstrates the matching algorithm
*/

-- Insert sample projects for contractor browsing
INSERT INTO projects (
  id,
  user_id,
  status,
  address,
  city,
  state,
  zip,
  peril,
  incident_at,
  description,
  policy_number,
  carrier_name,
  assigned_contractor_id,
  packet_url,
  payment_status,
  contact_name,
  contact_phone,
  contact_email,
  preferred_date,
  preferred_window,
  metadata,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  NULL, -- No user_id for sample data
  'submitted',
  '123 Oak Street',
  'Tampa',
  'FL',
  '33602',
  'water',
  NOW() - INTERVAL '2 days',
  'Burst pipe in kitchen caused significant water damage to hardwood floors and drywall. Water has been shut off but need immediate mitigation to prevent mold growth.',
  'POL-123456789',
  'State Farm',
  NULL, -- Available for assignment
  NULL,
  'unpaid',
  'Sarah Johnson',
  '+18135551234',
  'sarah.johnson@email.com',
  CURRENT_DATE + INTERVAL '1 day',
  '10-12',
  '{"will_file_insurance": "yes", "emergency": true}',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  NULL,
  'submitted',
  '456 Pine Avenue',
  'Orlando',
  'FL',
  '32801',
  'fire',
  NOW() - INTERVAL '5 days',
  'Kitchen fire caused smoke damage throughout the house. Need smoke restoration and kitchen rebuild. Insurance adjuster already visited.',
  'POL-987654321',
  'Allstate',
  NULL,
  NULL,
  'unpaid',
  'Michael Chen',
  '+14075559876',
  'michael.chen@email.com',
  CURRENT_DATE + INTERVAL '2 days',
  '8-10',
  '{"will_file_insurance": "yes", "adjuster_visited": true}',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
),
(
  gen_random_uuid(),
  NULL,
  'submitted',
  '789 Maple Drive',
  'Jacksonville',
  'FL',
  '32205',
  'wind',
  NOW() - INTERVAL '1 day',
  'Hurricane damage to roof and siding. Multiple shingles missing, water intrusion in master bedroom. Tarp installed temporarily.',
  NULL,
  NULL,
  NULL,
  NULL,
  'unpaid',
  'Lisa Rodriguez',
  '+19045552468',
  'lisa.rodriguez@email.com',
  CURRENT_DATE + INTERVAL '1 day',
  '2-4',
  '{"will_file_insurance": "unsure", "emergency": true, "tarp_installed": true}',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),
(
  gen_random_uuid(),
  NULL,
  'submitted',
  '321 Cedar Lane',
  'Miami',
  'FL',
  '33101',
  'mold',
  NOW() - INTERVAL '10 days',
  'Discovered mold growth in bathroom and adjacent bedroom after slow leak. Need professional mold remediation and affected drywall replacement.',
  'POL-456789123',
  'Progressive',
  NULL,
  NULL,
  'unpaid',
  'David Thompson',
  '+13055553691',
  'david.thompson@email.com',
  CURRENT_DATE + INTERVAL '3 days',
  '12-2',
  '{"will_file_insurance": "yes", "mold_testing_done": false}',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  NULL,
  'submitted',
  '654 Birch Street',
  'Sarasota',
  'FL',
  '34236',
  'water',
  NOW() - INTERVAL '1 day',
  'AC unit leaked overnight causing water damage to living room carpet and baseboards. Need water extraction and drying services immediately.',
  NULL,
  NULL,
  NULL,
  NULL,
  'unpaid',
  'Jennifer Martinez',
  '+19415554827',
  'jennifer.martinez@email.com',
  CURRENT_DATE,
  '4-6',
  '{"will_file_insurance": "no", "emergency": true, "ac_repaired": true}',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
),
(
  gen_random_uuid(),
  NULL,
  'submitted',
  '987 Elm Court',
  'Atlanta',
  'GA',
  '30309',
  'wind',
  NOW() - INTERVAL '3 days',
  'Storm damage to exterior siding and windows. One window broken, siding panels damaged on north side of house. Need board-up and repair.',
  'POL-789123456',
  'USAA',
  NULL,
  NULL,
  'unpaid',
  'Robert Wilson',
  '+14045557392',
  'robert.wilson@email.com',
  CURRENT_DATE + INTERVAL '2 days',
  '10-12',
  '{"will_file_insurance": "yes", "board_up_needed": true}',
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '8 hours'
);