import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    console.log('Creating admin user...')

    const adminEmail = 'admin@disastershield.com'
    const adminPassword = 'Admin123!'
    const adminName = 'System Administrator'
    const adminPhone = '+15551234567'

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        phone: adminPhone,
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('✅ Auth user created:', authData.user?.id)

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user!.id,
        role: 'admin',
        full_name: adminName,
        email: adminEmail,
        phone: adminPhone
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('✅ Profile created:', profileData.id)

    console.log('\n🎉 Admin user created successfully!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 Role: admin')
    console.log('\nYou can now log in to the admin portal at /admin')

  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

// Run the script
createAdminUser()
