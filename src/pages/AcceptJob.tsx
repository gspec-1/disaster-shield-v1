import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import NotificationBell from '@/src/components/NotificationBell'

export default function AcceptJob() {
  const { token } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processToken = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid token')
        return
      }

      try {
        // In a real implementation, this would verify the token and update the database
        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Simulate token validation
        if (token.length < 10) {
          setStatus('expired')
          setMessage('This invitation has expired or is invalid')
        } else {
          setStatus('success')
          setMessage('You have successfully accepted this job opportunity!')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Failed to process your response. Please try again.')
      }
    }

    processToken()
  }, [token])

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h3>
              <p className="text-gray-600">Verifying your response</p>
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Accepted!</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  You'll receive contact information and project details shortly.
                </p>
                <Link to="/contractor/dashboard">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Go to Dashboard
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
            <NotificationBell userId={user?.id} />
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