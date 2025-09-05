import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

type SeedContractor = {
  id?: string
  user_id: string | null
  company_name: string
  contact_name: string
  email: string
  phone: string
  service_areas: string[] | string
  trades: string[] | string
  capacity: 'active' | 'paused'
  calendly_url: string | null
}

// Helper to normalize arrays to jsonb arrays (not plain text)
function toJsonbArray(value: string[] | string): any {
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Only state abbreviations per requirement
const contractorSeeds: SeedContractor[] = [
  {
    id: 'd7ea246f-47eb-489b-95fd-8dc27eacc4db',
    user_id: 'ba651943-ab53-48b0-9540-8dd9a2f64d8f',
    company_name: 'G Spec Tech',
    contact_name: 'Affan',
    email: 'gspectech@gmail.com',
    phone: '1111111111',
    service_areas: ['FL','TX','CA','NY','GA','NC','ME','NH','DE','LA','RI','SC','CT','AL','MD'],
    trades: ['water_mitigation','mold','roofing','rebuild','smoke_restoration'],
    capacity: 'active',
    calendly_url: ''
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1001',
    user_id: null,
    company_name: 'Suncoast Mitigation',
    contact_name: 'Maria Lopez',
    email: 'ops@suncoastmitigation.com',
    phone: '+18135550001',
    service_areas: ['FL','GA','AL'],
    trades: ['water_mitigation','mold','rebuild'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1002',
    user_id: null,
    company_name: 'Lone Star Roofing',
    contact_name: 'Caleb Wright',
    email: 'contact@lonestarroofing.us',
    phone: '+12145550002',
    service_areas: ['TX','OK','LA','NM'],
    trades: ['roofing','rebuild','smoke_restoration'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1003',
    user_id: null,
    company_name: 'Golden State Restorers',
    contact_name: 'Jennifer Lee',
    email: 'hello@goldenstaterestorers.com',
    phone: '+14155550003',
    service_areas: ['CA','NV','OR'],
    trades: ['water_mitigation','rebuild','mold'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1004',
    user_id: null,
    company_name: 'Empire Response Team',
    contact_name: 'Anthony Russo',
    email: 'dispatch@empireresponse.com',
    phone: '+12125550004',
    service_areas: ['NY','NJ','CT'],
    trades: ['rebuild','water_mitigation','mold'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1005',
    user_id: null,
    company_name: 'Peach State Rebuilders',
    contact_name: 'Amanda Davis',
    email: 'team@peachstaterebuilders.com',
    phone: '+14045550005',
    service_areas: ['GA','SC','NC'],
    trades: ['rebuild','water_mitigation','roofing'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1006',
    user_id: null,
    company_name: 'Great Lakes Dry-Out',
    contact_name: 'Michael Chen',
    email: 'support@greatlakesdryout.com',
    phone: '+13125550006',
    service_areas: ['MI','OH','IN','IL'],
    trades: ['water_mitigation','mold'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1007',
    user_id: null,
    company_name: 'Mountain View Restoration',
    contact_name: 'Sarah Johnson',
    email: 'care@mountainviewrestore.com',
    phone: '+17205550007',
    service_areas: ['CO','UT','WY'],
    trades: ['smoke_restoration','rebuild','water_mitigation'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1008',
    user_id: null,
    company_name: 'Bayou Recovery Group',
    contact_name: 'Robert Wilson',
    email: 'info@bayourecovery.com',
    phone: '+15045550008',
    service_areas: ['LA','MS','TX'],
    trades: ['water_mitigation','rebuild','roofing'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1009',
    user_id: null,
    company_name: 'Northwest Remediation',
    contact_name: 'Lisa Wang',
    email: 'contact@northwestremediation.com',
    phone: '+15035550009',
    service_areas: ['WA','OR','ID'],
    trades: ['mold','water_mitigation','rebuild'],
    capacity: 'active',
    calendly_url: null
  },
  {
    id: '4b2a6f23-9b9b-47c7-8c8f-5d1d7e8b1010',
    user_id: null,
    company_name: 'Desert Storm Services',
    contact_name: 'Kevin Brown',
    email: 'hello@desertstormsvc.com',
    phone: '+16025550010',
    service_areas: ['AZ','NV','CA','NM'],
    trades: ['roofing','rebuild','smoke_restoration'],
    capacity: 'active',
    calendly_url: null
  }
]

// Minimal profiles to link contractors. If profiles has different schema, adapt below
type SeedProfile = {
  id: string
  role: 'homeowner' | 'business_owner' | 'contractor' | 'admin'
  full_name: string
  email?: string
  phone?: string | null
}

function contractorsToProfiles(seeds: SeedContractor[]): SeedProfile[] {
  const profiles: SeedProfile[] = []
  for (const c of seeds) {
    if (!c.user_id) continue
    profiles.push({
      id: c.user_id,
      role: 'contractor',
      full_name: c.contact_name,
      email: c.email,
      phone: c.phone
    })
  }
  return profiles
}

async function upsertProfiles(profiles: SeedProfile[]) {
  if (profiles.length === 0) return
  const { error } = await admin.from('profiles').upsert(profiles, { onConflict: 'id' })
  if (error) throw error
}

async function upsertContractors(seeds: SeedContractor[]) {
  const rows = seeds.map((c) => ({
    id: c.id,
    user_id: c.user_id,
    company_name: c.company_name,
    contact_name: c.contact_name,
    email: c.email,
    phone: c.phone,
    service_areas: toJsonbArray(c.service_areas),
    trades: toJsonbArray(c.trades),
    capacity: c.capacity,
    calendly_url: c.calendly_url && c.calendly_url.length > 0 ? c.calendly_url : null
  }))

  const { error } = await admin.from('contractors')
    .upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

async function main() {
  console.log('Seeding profiles and contractors...')
  // Ensure each contractor has an auth user; create one if needed
  for (const c of contractorSeeds) {
    if (!c.user_id) {
      const password = Math.random().toString(36).slice(2) + 'A1!'
      const res = await admin.auth.admin.createUser({
        email: c.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: c.contact_name, role: 'contractor' }
      })
      if (res.error) throw res.error
      c.user_id = res.data.user.id
    }
  }

  const profiles = contractorsToProfiles(contractorSeeds)
  await upsertProfiles(profiles)
  await upsertContractors(contractorSeeds)
  console.log('✅ Seed complete.')
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})


