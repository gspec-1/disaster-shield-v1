import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { verifyAcceptToken } from '@/lib/tokens/secure'
import { resendEmailService } from '@/lib/email/resend-service'
import NotificationBell from '@/src/components/NotificationBell'

export default function AcceptJobPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'declined' | 'error' | 'expired' | 'already_filled'>('loading')
  const [message, setMessage] = useState('')
  const [projectDetails, setProjectDetails] = useState<any>(null)

  // Log token immediately on component render
  console.log('Accept Job Page - Token from URL params:', token);

  useEffect(() => {
    const processToken = async () => {
      console.log('Processing token:', token);
      if (!token) {
        setStatus('error')
        setMessage('Invalid token')
        return
      }

      try {
        // Verify the token
        const payload = verifyAcceptToken(token)
        console.log('Token payload:', payload);
        if (!payload) {
          setStatus('expired')
          setMessage('This invitation has expired or is invalid')
          return
        }

        // Get project details
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*, contractors(*)')
          .eq('id', payload.projectId)
          .single()

        if (projectError || !project) {
          setStatus('error')
          setMessage('Project not found')
          return
        }

        setProjectDetails(project)

        // Check if project is already assigned
        if (project.assigned_contractor_id) {
          setStatus('already_filled')
          setMessage('This job has already been assigned to another contractor')
          return
        }

        if (payload.action === 'accept') {
          // Redirect to estimate submission page instead of directly accepting
          navigate(`/contractor/submit-estimate/${payload.projectId}`)
          return

        } else if (payload.action === 'decline') {
          // Decline the job
          await supabase
            .from('match_requests')
            .update({ 
              status: 'declined',
              responded_at: new Date().toISOString()
            })
            .eq('project_id', payload.projectId)
            .eq('contractor_id', payload.contractorId)

          setStatus('declined')
          setMessage('You have declined this job opportunity.')

          // Create notification for decline
          try {
            if (project.user_id) {
              await supabase.from('notifications').insert({
                user_id: project.user_id,
                type: 'job_declined',
                title: 'Contractor Response',
                message: `A contractor declined your job. We're finding other qualified contractors for you.`,
                data: {
                  projectId: project.id
                }
              })
            }
          } catch (notificationError) {
            console.error('Error creating decline notification:', notificationError)
          }
        }

      } catch (error) {
        console.error('Error processing token:', error)
        // Provide more detailed error information for debugging
        let errorMessage = 'Failed to process your response. Please try again.';
        if (error instanceof Error) {
          errorMessage += ` Error: ${error.message}`;
        }
        setStatus('error')
        setMessage(errorMessage)
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
              <Clock className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h3>
              <p className="text-gray-600">Verifying your response</p>
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Job Accepted! 🎉</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {projectDetails && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-green-900 mb-2">Project Details:</h4>
                  <p className="text-sm text-green-800 mb-1">
                    <strong>Location:</strong> {projectDetails.address}, {projectDetails.city}, {projectDetails.state}
                  </p>
                  <p className="text-sm text-green-800 mb-1">
                    <strong>Contact:</strong> {projectDetails.contact_name} - {projectDetails.contact_phone}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Preferred Date:</strong> {new Date(projectDetails.preferred_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  You'll receive the homeowner's contact information shortly. Please reach out within 24 hours to schedule the inspection.
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

      case 'declined':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Declined</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">
                Thank you for your response. We'll keep you in mind for future opportunities that match your expertise.
              </p>
              <Link to="/contractor/dashboard">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )

      case 'already_filled':
        return (
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Already Filled</h3>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">
                Another contractor was faster this time, but don't worry - more opportunities are coming your way!
              </p>
              <Link to="/contractor/browse-jobs">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Browse Available Jobs
                </Button>
              </Link>
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
              <p className="text-sm text-gray-500 mb-6">
                This invitation was only valid for 48 hours. Check your dashboard for new opportunities.
              </p>
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