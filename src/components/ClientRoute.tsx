import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/src/lib/supabase'
import { Shield } from 'lucide-react'

interface ClientRouteProps {
  children: React.ReactNode
}

export default function ClientRoute({ children }: ClientRouteProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    checkClientAccess()
  }, [])

  const checkClientAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        navigate('/auth/login')
        return
      }

      // Check if user has client role (not contractor or admin)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // Default to client dashboard on error
        navigate('/client/dashboard')
        return
      }

      // If user is contractor or admin, redirect them away
      if (profile?.role === 'contractor') {
        navigate('/contractor/dashboard')
        return
      }

      if (profile?.role === 'admin') {
        navigate('/admin')
        return
      }

      // Allow access for clients (role is null, undefined, or 'client')
      setIsClient(true)
    } catch (error) {
      console.error('Client access check error:', error)
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
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return null
  }

  return <>{children}</>
}
