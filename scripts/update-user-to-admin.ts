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

async function updateUserToAdmin() {
  try {
    console.log('Updating user to admin role...')

    const adminEmail = 'admin@disastershield.com'

    // Find the user by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching users:', authError)
      return
    }

    const adminUser = authData.users.find(user => user.email === adminEmail)

    if (!adminUser) {
      console.error('Admin user not found')
      return
    }

    console.log('✅ Found admin user:', adminUser.id)

    // Update profile to admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUser.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return
    }

    console.log('✅ Profile updated to admin role:', profileData.id)
    console.log('\n🎉 User updated to admin successfully!')
    console.log('📧 Email:', adminEmail)
    console.log('👤 Role: admin')
    console.log('\nYou can now log in to the admin portal at /admin')

  } catch (error) {
    console.error('Error updating user to admin:', error)
  }
}

// Run the script
updateUserToAdmin()
