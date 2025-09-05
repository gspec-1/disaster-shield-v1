import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, XCircle, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { verifyAcceptToken } from '@/lib/tokens/secure'
import NotificationBell from '@/src/components/NotificationBell'

export default function DeclineJobPage() {
  const { token } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Load user session
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    loadUser()
  }, [])

  useEffect(() => {
    const processDecline = async () => {
      console.log('Processing decline with token:', token)
      
      if (!token) {
        console.error('No token provided')
        setStatus('error')
        setMessage('Invalid token')
        return
      }

      try {
        // Verify the token
        console.log('Verifying token...')
        const payload = verifyAcceptToken(token)
        console.log('Token verification result:', payload)
        
        if (!payload) {
          console.error('Token verification failed')
          setStatus('expired')
          setMessage('This invitation has expired or is invalid')
          return
        }

        // Update match request status to declined
        console.log('Updating match request:', {
          projectId: payload.projectId,
          contractorId: payload.contractorId
        })
        
        const { error } = await supabase
          .from('match_requests')
          .update({ 
            status: 'declined',
            responded_at: new Date().toISOString()
          })
          .eq('project_id', payload.projectId)
          .eq('contractor_id', payload.contractorId)

        if (error) {
          console.error('Database update error:', error)
          setStatus('error')
          setMessage('Failed to process your response. Please try again.')
          return
        }

        console.log('Successfully declined job')
        setStatus('success')
        setMessage('You have successfully declined this job opportunity.')

      } catch (error) {
        console.error('Error processing decline:', error)
        setStatus('error')
        setMessage('Failed to process your response. Please try again.')
      }
    }

    processDecline()
  }, [token])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h3>
              <p className="text-gray-600">Recording your response</p>
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Declined</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">
                Thank you for your response. We'll keep you in mind for future opportunities that better match your availability and expertise.
              </p>
              <div className="space-y-3">
                <Link to="/contractor/browse-jobs">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Browse Other Jobs
                  </Button>
                </Link>
                <Link to="/contractor/dashboard">
                  <Button variant="outline" className="w-full">
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )

      case 'expired':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link to="/contractor/dashboard">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )

      case 'error':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link to="/contractor/dashboard">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            {user && <NotificationBell userId={user.id} />}
            <div></div>
          </div>
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
          </Link>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}