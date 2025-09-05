import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, XCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'

export default function PaymentDeclinedPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason') || 'cancelled'
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadProject = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!projectId) return

      try {
        const { data: projectData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (!error && projectData) {
          setProject(projectData)
        }
      } catch (error) {
        console.error('Error loading project:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Different messages based on the reason
  const getTitle = () => {
    switch (reason) {
      case 'declined':
        return 'Payment Declined'
      case 'failed':
        return 'Payment Failed'
      case 'cancelled':
        return 'Payment Cancelled'
      default:
        return 'Payment Unsuccessful'
    }
  }

  const getMessage = () => {
    switch (reason) {
      case 'declined':
        return 'Your payment was declined by your payment provider. Please check your payment details and try again.'
      case 'failed':
        return 'We encountered an issue processing your payment. Please try again or use a different payment method.'
      case 'cancelled':
        return "You cancelled the payment process. You can try again when you're ready."
      default:
        return 'Your payment was not completed. Please try again or contact support if you continue to experience issues.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTitle()}</h2>
            <p className="text-gray-600 mb-6">
              {getMessage()}
            </p>
            
            {project && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-2">Project Details:</h4>
                <p className="text-sm text-gray-800 mb-1">
                  <strong>Location:</strong> {project.address}, {project.city}, {project.state}
                </p>
                <p className="text-sm text-gray-800 mb-1">
                  <strong>Damage Type:</strong> {project.peril.charAt(0).toUpperCase() + project.peril.slice(1)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                If you continue to experience issues with payment, please contact our support team for assistance.
              </p>
              
              <div className="space-y-3">
                <Link to={`/payment/${projectId}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Try Payment Again
                  </Button>
                </Link>
                <Link to={`/portal/${projectId}`}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Return to Project
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
