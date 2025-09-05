import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function PaymentSuccessPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
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
          
          // Update project payment status to paid
          const { error: updateError } = await supabase
            .from('projects')
            .update({ payment_status: 'paid' })
            .eq('id', projectId)
          
          if (updateError) {
            console.error('Error updating payment status:', updateError)
          } else {
            console.log('Payment status updated to paid for project:', projectId)
            // Update local state
            setProject(prev => ({ ...prev, payment_status: 'paid' }))
          }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <NotificationBell userId={user?.id} />
          </div>
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. Your contractor can now begin work on your project.
            </p>
            
            {project && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-green-900 mb-2">Project Details:</h4>
                <p className="text-sm text-green-800 mb-1">
                  <strong>Location:</strong> {project.address}, {project.city}, {project.state}
                </p>
                <p className="text-sm text-green-800 mb-1">
                  <strong>Damage Type:</strong> {project.peril.charAt(0).toUpperCase() + project.peril.slice(1)}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Status:</strong> Payment completed - work can begin
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                You'll receive email confirmation shortly. Your contractor will contact you within 24 hours to coordinate the work.
              </p>
              
              <div className="space-y-3">
                <Link to={`/portal/${projectId}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View Project Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/client/dashboard">
                  <Button variant="outline" className="w-full">
                    Return to Dashboard
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