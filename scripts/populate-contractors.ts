import { supabase } from '@/src/lib/supabase'

const dummyContractors = [
  {
    company_name: 'Gulf Rapid Restore',
    contact_name: 'James Miller',
    email: 'james@gulfrapid.com',
    phone: '+19415551212',
    service_areas: ['FL', 'Tampa', 'Sarasota', 'St. Petersburg'],
    trades: ['water_mitigation', 'mold'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/gulfrapid/inspection'
  },
  {
    company_name: 'Sunshine Restoration',
    contact_name: 'Maria Rodriguez',
    email: 'maria@sunshinerestoration.com',
    phone: '+13055552345',
    service_areas: ['FL', 'Miami', 'Fort Lauderdale', 'West Palm Beach'],
    trades: ['water_mitigation', 'rebuild', 'mold'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/sunshine-restoration'
  },
  {
    company_name: 'Storm Shield Contractors',
    contact_name: 'David Thompson',
    email: 'david@stormshield.com',
    phone: '+17275553456',
    service_areas: ['FL', 'Tampa', 'Clearwater', 'Largo'],
    trades: ['roofing', 'rebuild', 'wind_damage'],
    capacity: 'active',
    calendly_url: null
  },
  {
    company_name: 'Fire & Water Solutions',
    contact_name: 'Sarah Johnson',
    email: 'sarah@firewaterfl.com',
    phone: '+18135554567',
    service_areas: ['FL', 'Tampa', 'Brandon', 'Riverview'],
    trades: ['water_mitigation', 'smoke_restoration', 'rebuild'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/firewater-solutions'
  },
  {
    company_name: 'Elite Mold Remediation',
    contact_name: 'Michael Chen',
    email: 'michael@elitemold.com',
    phone: '+19545555678',
    service_areas: ['FL', 'Fort Lauderdale', 'Hollywood', 'Pembroke Pines'],
    trades: ['mold', 'water_mitigation'],
    capacity: 'active',
    calendly_url: null
  },
  {
    company_name: 'Texas Storm Recovery',
    contact_name: 'Robert Wilson',
    email: 'robert@txstormrecovery.com',
    phone: '+14695556789',
    service_areas: ['TX', 'Dallas', 'Fort Worth', 'Plano'],
    trades: ['roofing', 'rebuild', 'wind_damage'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/tx-storm-recovery'
  },
  {
    company_name: 'Golden State Restoration',
    contact_name: 'Jennifer Lee',
    email: 'jennifer@goldenstaterestore.com',
    phone: '+14155557890',
    service_areas: ['CA', 'San Francisco', 'Oakland', 'San Jose'],
    trades: ['water_mitigation', 'rebuild', 'fire_restoration'],
    capacity: 'active',
    calendly_url: null
  },
  {
    company_name: 'Empire State Contractors',
    contact_name: 'Anthony Russo',
    email: 'anthony@empirestatecontractors.com',
    phone: '+12125558901',
    service_areas: ['NY', 'New York', 'Brooklyn', 'Queens'],
    trades: ['rebuild', 'water_mitigation', 'mold'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/empire-state-contractors'
  },
  {
    company_name: 'Peach State Recovery',
    contact_name: 'Amanda Davis',
    email: 'amanda@peachstaterecovery.com',
    phone: '+14045559012',
    service_areas: ['GA', 'Atlanta', 'Marietta', 'Alpharetta'],
    trades: ['water_mitigation', 'rebuild', 'storm_damage'],
    capacity: 'active',
    calendly_url: null
  },
  {
    company_name: 'Coastal Cleanup Crew',
    contact_name: 'Brian Martinez',
    email: 'brian@coastalcleanup.com',
    phone: '+19105550123',
    service_areas: ['NC', 'Wilmington', 'Jacksonville', 'Myrtle Beach'],
    trades: ['water_mitigation', 'mold', 'flood_restoration'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/coastal-cleanup'
  },
  {
    company_name: 'Rapid Response Restoration',
    contact_name: 'Lisa Wang',
    email: 'lisa@rapidresponsefl.com',
    phone: '+18635551234',
    service_areas: ['FL', 'Lakeland', 'Winter Haven', 'Bartow'],
    trades: ['water_mitigation', 'rebuild'],
    capacity: 'paused',
    calendly_url: null
  },
  {
    company_name: 'All-Pro Contractors',
    contact_name: 'Kevin Brown',
    email: 'kevin@allprocontractors.com',
    phone: '+17865552345',
    service_areas: ['FL', 'Miami', 'Homestead', 'Kendall'],
    trades: ['rebuild', 'roofing', 'general_contracting'],
    capacity: 'active',
    calendly_url: 'https://calendly.com/allpro-contractors'
  }
]

async function populateContractors() {
  console.log('Populating contractors table with dummy data...')

  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.error('Supabase is not configured. Please set up your environment variables.')
      return
    }

    // Clear existing contractors (optional - remove this if you want to keep existing data)
    console.log('Clearing existing contractors...')
    const { error: clearError } = await supabase
      .from('contractors')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (clearError) {
      console.error('Error clearing contractors:', clearError)
    }

    // Insert dummy contractors
    console.log(`Inserting ${dummyContractors.length} dummy contractors...`)
    const { data, error } = await supabase
      .from('contractors')
      .insert(dummyContractors)
      .select()

    if (error) {
      console.error('Error inserting contractors:', error)
      throw error
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} contractors`)
    
    // Show summary
    const activeCount = dummyContractors.filter(c => c.capacity === 'active').length
    const pausedCount = dummyContractors.filter(c => c.capacity === 'paused').length
    
    console.log(`📊 Summary:`)
    console.log(`   - Active contractors: ${activeCount}`)
    console.log(`   - Paused contractors: ${pausedCount}`)
    console.log(`   - States covered: FL, TX, CA, NY, GA, NC`)
    console.log(`   - Trades available: water_mitigation, mold, rebuild, roofing, smoke_restoration`)

    return data
  } catch (error) {
    console.error('Failed to populate contractors:', error)
    throw error
  }
}

// Run the population script
populateContractors()
  .then(() => {
    console.log('✅ Contractor population completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Contractor population failed:', error)
    process.exit(1)
  })