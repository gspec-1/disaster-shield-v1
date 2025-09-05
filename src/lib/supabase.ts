import { createClient } from '@supabase/supabase-js'
import { env } from './env'

const supabaseUrl = env.SUPABASE_URL
const supabaseAnonKey = env.SUPABASE_ANON_KEY

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key' &&
  String(supabaseUrl).startsWith('https://') &&
  String(supabaseUrl).includes('.supabase.co')
)

// Debug logging
console.log('Supabase configuration check:', {
  supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
  supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Not set',
  isConfigured: isSupabaseConfigured
})

// Create client with error handling
export const supabase = isSupabaseConfigured 
  ? (() => {
      try {
        const client = createClient(String(supabaseUrl), String(supabaseAnonKey), {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          global: {
            headers: {
              'X-Client-Info': 'disastershield-web'
            }
          }
        })
        console.log('✅ Supabase client created successfully')
        return client
      } catch (error) {
        console.error('❌ Failed to create Supabase client:', error)
        return null
      }
    })()
  : (() => {
      console.error('❌ Supabase not configured properly. Check your environment variables.')
      console.error('Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set.')
      return null
    })()

// Export configuration status
export const isConfigured = isSupabaseConfigured

// Create a safe wrapper to prevent null access errors
export const safeSupabase = {
  auth: supabase?.auth || {
    signIn: () => Promise.reject(new Error('Supabase not configured')),
    signUp: () => Promise.reject(new Error('Supabase not configured')),
    signOut: () => Promise.reject(new Error('Supabase not configured')),
    getUser: () => Promise.reject(new Error('Supabase not configured')),
    getSession: () => Promise.reject(new Error('Supabase not configured')),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: (table: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }
    return supabase.from(table)
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'homeowner' | 'business_owner' | 'contractor' | 'admin'
          full_name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'homeowner' | 'business_owner' | 'contractor' | 'admin'
          full_name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'homeowner' | 'business_owner' | 'contractor' | 'admin'
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      contractors: {
        Row: {
          id: string
          user_id: string | null
          company_name: string
          contact_name: string
          email: string
          phone: string
          service_areas: string[]
          trades: string[]
          capacity: 'active' | 'paused'
          calendly_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name: string
          contact_name: string
          email: string
          phone: string
          service_areas?: string[]
          trades?: string[]
          capacity?: 'active' | 'paused'
          calendly_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string
          contact_name?: string
          email?: string
          phone?: string
          service_areas?: string[]
          trades?: string[]
          capacity?: 'active' | 'paused'
          calendly_url?: string | null
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string | null
          status: 'submitted' | 'matched' | 'scheduled' | 'onsite' | 'packet_sent' | 'paid' | 'completed'
          address: string
          city: string
          state: string
          zip: string
          peril: 'flood' | 'water' | 'wind' | 'fire' | 'mold' | 'other'
          incident_at: string
          description: string
          policy_number: string | null
          carrier_name: string | null
          assigned_contractor_id: string | null
          packet_url: string | null
          payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded'
          contact_name: string
          contact_phone: string
          contact_email: string
          preferred_date: string
          preferred_window: '8-10' | '10-12' | '12-2' | '2-4' | '4-6'
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: 'submitted' | 'matched' | 'scheduled' | 'onsite' | 'packet_sent' | 'paid' | 'completed'
          address: string
          city: string
          state: string
          zip: string
          peril: 'flood' | 'water' | 'wind' | 'fire' | 'mold' | 'other'
          incident_at: string
          description: string
          policy_number?: string | null
          carrier_name?: string | null
          assigned_contractor_id?: string | null
          packet_url?: string | null
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded'
          contact_name: string
          contact_phone: string
          contact_email: string
          preferred_date: string
          preferred_window: '8-10' | '10-12' | '12-2' | '2-4' | '4-6'
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: 'submitted' | 'matched' | 'scheduled' | 'onsite' | 'packet_sent' | 'paid' | 'completed'
          address?: string
          city?: string
          state?: string
          zip?: string
          peril?: 'flood' | 'water' | 'wind' | 'fire' | 'mold' | 'other'
          incident_at?: string
          description?: string
          policy_number?: string | null
          carrier_name?: string | null
          assigned_contractor_id?: string | null
          packet_url?: string | null
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded'
          contact_name?: string
          contact_phone?: string
          contact_email?: string
          preferred_date?: string
          preferred_window?: '8-10' | '10-12' | '12-2' | '2-4' | '4-6'
          metadata?: any
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          project_id: string
          type: 'photo' | 'video'
          room_tag: string | null
          storage_path: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: 'photo' | 'video'
          room_tag?: string | null
          storage_path: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          type?: 'photo' | 'video'
          room_tag?: string | null
          storage_path?: string
          caption?: string | null
          created_at?: string
        }
      }
    }
  }
}