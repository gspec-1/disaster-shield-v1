import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/src/lib/supabase'
import { Shield } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        navigate('/auth/login')
        return
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // Redirect to appropriate dashboard based on role
        if (profile?.role === 'contractor') {
          navigate('/contractor/dashboard')
        } else {
          navigate('/client/dashboard')
        }
        return
      }

      if (profile?.role !== 'admin') {
        // Redirect to appropriate dashboard based on role
        if (profile?.role === 'contractor') {
          navigate('/contractor/dashboard')
        } else {
          navigate('/client/dashboard')
        }
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Admin access check error:', error)
      // Default to client dashboard on error
      navigate('/client/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
