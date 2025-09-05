import { supabase } from '@/src/lib/supabase'

const contractorsData = [
  {
    user_id: null, // Will be set to null since we don't have actual user accounts for these
    company_name: 'Gulf Rapid Restore',
    contact_name: 'James Miller',
    email: 'james@gulfrapid.com',
    phone: '+19415551212',
    service_areas: JSON.stringify(['FL', 'Tampa', 'Sarasota', 'St. Petersburg']),
    trades: JSON.stringify(['water_mitigation', 'mold']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/gulfrapid/inspection'
  },
  {
    user_id: null,
    company_name: 'Sunshine Restoration',
    contact_name: 'Maria Rodriguez',
    email: 'maria@sunshinerestoration.com',
    phone: '+13055552345',
    service_areas: JSON.stringify(['FL', 'Miami', 'Fort Lauderdale', 'West Palm Beach']),
    trades: JSON.stringify(['water_mitigation', 'rebuild', 'mold']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/sunshine-restoration'
  },
  {
    user_id: null,
    company_name: 'Storm Shield Contractors',
    contact_name: 'David Thompson',
    email: 'david@stormshield.com',
    phone: '+17275553456',
    service_areas: JSON.stringify(['FL', 'Tampa', 'Clearwater', 'Largo']),
    trades: JSON.stringify(['roofing', 'rebuild']),
    capacity: 'active',
    calendly_url: null
  },
  {
    user_id: null,
    company_name: 'Fire & Water Solutions',
    contact_name: 'Sarah Johnson',
    email: 'sarah@firewaterfl.com',
    phone: '+18135554567',
    service_areas: JSON.stringify(['FL', 'Tampa', 'Brandon', 'Riverview']),
    trades: JSON.stringify(['water_mitigation', 'smoke_restoration', 'rebuild']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/firewater-solutions'
  },
  {
    user_id: null,
    company_name: 'Elite Mold Remediation',
    contact_name: 'Michael Chen',
    email: 'michael@elitemold.com',
    phone: '+19545555678',
    service_areas: JSON.stringify(['FL', 'Fort Lauderdale', 'Hollywood', 'Pembroke Pines']),
    trades: JSON.stringify(['mold', 'water_mitigation']),
    capacity: 'active',
    calendly_url: null
  },
  {
    user_id: null,
    company_name: 'Texas Storm Recovery',
    contact_name: 'Robert Wilson',
    email: 'robert@txstormrecovery.com',
    phone: '+14695556789',
    service_areas: JSON.stringify(['TX', 'Dallas', 'Fort Worth', 'Plano']),
    trades: JSON.stringify(['roofing', 'rebuild']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/tx-storm-recovery'
  },
  {
    user_id: null,
    company_name: 'Golden State Restoration',
    contact_name: 'Jennifer Lee',
    email: 'jennifer@goldenstaterestore.com',
    phone: '+14155557890',
    service_areas: JSON.stringify(['CA', 'San Francisco', 'Oakland', 'San Jose']),
    trades: JSON.stringify(['water_mitigation', 'rebuild']),
    capacity: 'active',
    calendly_url: null
  },
  {
    user_id: null,
    company_name: 'Empire State Contractors',
    contact_name: 'Anthony Russo',
    email: 'anthony@empirestatecontractors.com',
    phone: '+12125558901',
    service_areas: JSON.stringify(['NY', 'New York', 'Brooklyn', 'Queens']),
    trades: JSON.stringify(['rebuild', 'water_mitigation', 'mold']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/empire-state-contractors'
  },
  {
    user_id: null,
    company_name: 'Peach State Recovery',
    contact_name: 'Amanda Davis',
    email: 'amanda@peachstaterecovery.com',
    phone: '+14045559012',
    service_areas: JSON.stringify(['GA', 'Atlanta', 'Marietta', 'Alpharetta']),
    trades: JSON.stringify(['water_mitigation', 'rebuild']),
    capacity: 'active',
    calendly_url: null
  },
  {
    user_id: null,
    company_name: 'Coastal Cleanup Crew',
    contact_name: 'Brian Martinez',
    email: 'brian@coastalcleanup.com',
    phone: '+19105550123',
    service_areas: JSON.stringify(['NC', 'Wilmington', 'Jacksonville', 'Myrtle Beach']),
    trades: JSON.stringify(['water_mitigation', 'mold']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/coastal-cleanup'
  },
  {
    user_id: null,
    company_name: 'Rapid Response Restoration',
    contact_name: 'Lisa Wang',
    email: 'lisa@rapidresponsefl.com',
    phone: '+18635551234',
    service_areas: JSON.stringify(['FL', 'Lakeland', 'Winter Haven', 'Bartow']),
    trades: JSON.stringify(['water_mitigation', 'rebuild']),
    capacity: 'paused',
    calendly_url: null
  },
  {
    user_id: null,
    company_name: 'All-Pro Contractors',
    contact_name: 'Kevin Brown',
    email: 'kevin@allprocontractors.com',
    phone: '+17865552345',
    service_areas: JSON.stringify(['FL', 'Miami', 'Homestead', 'Kendall']),
    trades: JSON.stringify(['rebuild', 'roofing']),
    capacity: 'active',
    calendly_url: 'https://calendly.com/allpro-contractors'
  },
  {
    user_id: null,
    company_name: 'G Spec Tech',
    contact_name: 'Affan',
    email: 'gspectech@gmail.com',
    phone: '1111111111',
    service_areas: JSON.stringify(['FL', 'TX', 'CA', 'NY', 'GA', 'NC', 'ME', 'NH', 'DE', 'LA', 'RI', 'SC', 'CT', 'AL', 'MD']),
    trades: JSON.stringify(['water_mitigation', 'mold', 'roofing', 'rebuild', 'smoke_restoration']),
    capacity: 'active',
    calendly_url: ''
  }
]

async function populateContractorsFixed() {
  console.log('Populating contractors table with correct data structure...')

  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase is not configured. Please set up your environment variables.')
      return
    }

    // Clear existing contractors
    console.log('Clearing existing contractors...')
    const { error: clearError } = await supabase
      .from('contractors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (clearError) {
      console.error('Error clearing contractors:', clearError)
    }

    // Insert contractors with correct data structure
    console.log(`Inserting ${contractorsData.length} contractors with JSON string format...`)
    const { data, error } = await supabase
      .from('contractors')
      .insert(contractorsData)
      .select()

    if (error) {
      console.error('Error inserting contractors:', error)
      throw error
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} contractors`)
    
    // Show summary
    const activeCount = contractorsData.filter(c => c.capacity === 'active').length
    const pausedCount = contractorsData.filter(c => c.capacity === 'paused').length
    
    console.log(`📊 Summary:`)
    console.log(`   - Active contractors: ${activeCount}`)
    console.log(`   - Paused contractors: ${pausedCount}`)
    console.log(`   - Data format: JSON strings for service_areas and trades`)

    return data
  } catch (error) {
    console.error('Failed to populate contractors:', error)
    throw error
  }
}

// Run the population script
populateContractorsFixed()
  .then(() => {
    console.log('✅ Contractor population completed successfully!')
  })
  .catch((error) => {
    console.error('❌ Contractor population failed:', error)
  })