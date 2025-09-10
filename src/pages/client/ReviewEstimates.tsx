import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, DollarSign, FileText, Clock, MapPin, User, Phone, Mail, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'sonner'
import { formatPrice } from '@/src/stripe-config'

interface Project {
  id: string
  address: string
  city: string
  state: string
  zip: string
  peril: string
  description: string
  contact_name: string
  contact_phone: string
  contact_email: string
  preferred_date: string
  preferred_window: string
  created_at: string
}

interface Estimate {
  id: string
  estimate_amount: number
  estimate_breakdown: string
  notes: string
  status: string
  created_at: string
  expires_at: string
  contractors: {
    id: string
    contact_name: string
    company_name: string
    email: string
    phone: string
    service_areas: string[]
    trades: string[]
    capacity: number
  }
}

export default function ReviewEstimates() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to review estimates')
        navigate('/auth/login')
        return
      }

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id) // Ensure user owns this project
        .single()

      if (projectError || !projectData) {
        toast.error('Project not found or access denied')
        navigate('/client/dashboard')
        return
      }

      setProject(projectData)

      // Get estimates for this project
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('contractor_estimates')
        .select(`
          *,
          contractors (
            id,
            contact_name,
            company_name,
            email,
            phone,
            service_areas,
            trades,
            capacity
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (estimatesError) {
        toast.error('Failed to load estimates')
        return
      }

      setEstimates(estimatesData || [])

    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptEstimate = async (estimateId: string, contractorId: string) => {
    if (!project) return

    setProcessing(estimateId)
    try {
      // Accept the estimate
      const { error: acceptError } = await supabase
        .from('contractor_estimates')
        .update({ status: 'accepted' })
        .eq('id', estimateId)

      if (acceptError) throw acceptError

      // Create dynamic Stripe product for the accepted estimate
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-dynamic-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            estimateId,
            projectId: project.id
          })
        })

        if (!response.ok) {
          console.error('Failed to create dynamic Stripe product')
          // Don't fail the whole process, but log the error
        }
      } catch (stripeError) {
        console.error('Error creating dynamic Stripe product:', stripeError)
        // Don't fail the whole process, but log the error
      }

      // Reject all other estimates
      const { error: rejectError } = await supabase
        .from('contractor_estimates')
        .update({ status: 'rejected' })
        .eq('project_id', project.id)
        .neq('id', estimateId)

      if (rejectError) throw rejectError

      // Assign contractor to project
      const { error: assignError } = await supabase
        .from('projects')
        .update({ 
          assigned_contractor_id: contractorId,
          status: 'matched'
        })
        .eq('id', project.id)

      if (assignError) throw assignError

      // Update match request status
      await supabase
        .from('match_requests')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('project_id', project.id)
        .eq('contractor_id', contractorId)

      // Mark other match requests as declined
      await supabase
        .from('match_requests')
        .update({ 
          status: 'declined',
          responded_at: new Date().toISOString()
        })
        .eq('project_id', project.id)
        .neq('contractor_id', contractorId)

      toast.success('Estimate accepted! Contractor has been assigned to your project.')

      // Send notification to contractor
      try {
        const { data: contractorProfile } = await supabase
          .from('contractors')
          .select('user_id')
          .eq('id', contractorId)
          .single()

        if (contractorProfile?.user_id) {
          await supabase.from('notifications').insert({
            user_id: contractorProfile.user_id,
            type: 'estimate_accepted',
            title: '🎉 Estimate Accepted!',
            message: `Your estimate has been accepted for the project at ${project.address}. You can now begin work!`,
            data: {
              projectId: project.id,
              contactName: project.contact_name,
              contactPhone: project.contact_phone
            }
          })
        }
      } catch (notificationError) {
        // Don't fail the whole process for notification errors
      }

      navigate('/client/dashboard')

    } catch (error: any) {
      toast.error(error.message || 'Failed to accept estimate')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectEstimate = async (estimateId: string) => {
    setProcessing(estimateId)
    try {
      const { error } = await supabase
        .from('contractor_estimates')
        .update({ status: 'rejected' })
        .eq('id', estimateId)

      if (error) throw error

      toast.success('Estimate rejected')
      await loadData() // Reload to update the list

    } catch (error: any) {
      toast.error(error.message || 'Failed to reject estimate')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimates...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Project not found</p>
          <Link to="/client/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/client/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Estimates</h1>
              <p className="text-gray-600">Compare contractor estimates for your project</p>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{project.address}</p>
                  <p className="text-gray-600">{project.city}, {project.state} {project.zip}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{project.peril}</Badge>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-900 mb-1">Description</p>
                <p className="text-gray-600 text-sm">{project.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estimates */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Contractor Estimates ({estimates.length})
            </h2>
            {estimates.length === 0 && (
              <p className="text-gray-500">No estimates received yet</p>
            )}
          </div>

          {estimates.map((estimate) => (
            <Card key={estimate.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{estimate.contractors.company_name}</CardTitle>
                    <p className="text-gray-600 text-sm">Contact: {estimate.contractors.contact_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(estimate.estimate_amount)}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      Capacity: {estimate.contractors.capacity} jobs
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contractor Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{estimate.contractors.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{estimate.contractors.email}</span>
                      </div>
                      {estimate.contractors.trades && estimate.contractors.trades.length > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>Trades: {estimate.contractors.trades.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Estimate Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Submitted: {new Date(estimate.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Expires: {new Date(estimate.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {estimate.estimate_breakdown && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      {estimate.estimate_breakdown}
                    </div>
                  </div>
                )}

                {estimate.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                      {estimate.notes}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleAcceptEstimate(estimate.id, estimate.contractors.id)}
                    disabled={processing === estimate.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === estimate.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Estimate
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRejectEstimate(estimate.id)}
                    disabled={processing === estimate.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {processing === estimate.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
