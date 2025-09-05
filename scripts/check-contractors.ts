import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env') })

const url = process.env.VITE_SUPABASE_URL || ''
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

async function main() {
  const { data, error } = await admin
    .from('contractors')
    .select('id, company_name, user_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Query error:', error)
    process.exit(1)
  }

  console.log('Contractors count:', data?.length || 0)
  console.log(data?.slice(0, 10))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


