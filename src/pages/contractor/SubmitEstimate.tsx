import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Shield, DollarSign, FileText, Clock, MapPin, User, Phone, Mail } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'sonner'

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

interface Contractor {
  id: string
  contact_name: string
  company_name: string
  email: string
  phone: string
}

export default function SubmitEstimate() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingEstimate, setExistingEstimate] = useState<any>(null)

  const [estimateData, setEstimateData] = useState({
    amount: '',
    breakdown: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    if (!projectId) return

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to submit estimates')
        navigate('/contractor/login')
        return
      }

      // Get contractor profile
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (contractorError || !contractorData) {
        toast.error('Contractor profile not found')
        navigate('/contractor/dashboard')
        return
      }

      setContractor(contractorData)

      // Get project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !projectData) {
        toast.error('Project not found')
        navigate('/contractor/dashboard')
        return
      }

      setProject(projectData)

      // Check if estimate already exists
      const { data: estimateData, error: estimateError } = await supabase
        .from('contractor_estimates')
        .select('*')
        .eq('project_id', projectId)
        .eq('contractor_id', contractorData.id)
        .single()

      if (!estimateError && estimateData) {
        setExistingEstimate(estimateData)
        setEstimateData({
          amount: (estimateData.estimate_amount / 100).toString(),
          breakdown: estimateData.estimate_breakdown || '',
          notes: estimateData.notes || ''
        })
      }

    } catch (error) {
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!project || !contractor) return

    // Validate input
    const amount = parseFloat(estimateData.amount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid estimate amount')
      return
    }

    if (amount < 100) {
      toast.error('Minimum estimate amount is $100')
      return
    }

    setSubmitting(true)
    try {
      const estimatePayload = {
        project_id: project.id,
        contractor_id: contractor.id,
        estimate_amount: Math.round(amount * 100), // Convert to cents
        estimate_breakdown: estimateData.breakdown,
        notes: estimateData.notes,
        status: 'pending'
      }

      if (existingEstimate) {
        // Update existing estimate
        const { error } = await supabase
          .from('contractor_estimates')
          .update(estimatePayload)
          .eq('id', existingEstimate.id)

        if (error) throw error
        toast.success('Estimate updated successfully!')
      } else {
        // Create new estimate
        const { error } = await supabase
          .from('contractor_estimates')
          .insert(estimatePayload)

        if (error) throw error
        toast.success('Estimate submitted successfully!')
      }

      // Send notification to project owner
      try {
        const { data: projectOwner } = await supabase
          .from('projects')
          .select('user_id, contact_name')
          .eq('id', project.id)
          .single()

        if (projectOwner?.user_id) {
          await supabase.from('notifications').insert({
            user_id: projectOwner.user_id,
            type: 'estimate_received',
            title: '💰 New Estimate Received!',
            message: `${contractor.company_name} has submitted an estimate of $${amount.toFixed(2)} for your project.`,
            data: {
              projectId: project.id,
              contractorId: contractor.id,
              estimateAmount: amount,
              estimateId: existingEstimate?.id || 'new'
            }
          })
        }
      } catch (notificationError) {
        // Don't fail the whole process for notification errors
      }

      navigate('/contractor/dashboard')

    } catch (error: any) {
      toast.error(error.message || 'Failed to submit estimate')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project || !contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Project or contractor data not found</p>
          <Link to="/contractor/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/contractor/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {existingEstimate ? 'Update Estimate' : 'Submit Estimate'}
              </h1>
              <p className="text-gray-600">Provide your estimate for this project</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Description</p>
                <p className="text-gray-600 text-sm">{project.description}</p>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{project.contact_name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {project.contact_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {project.contact_email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Preferred Date</p>
                  <p className="text-gray-600 text-sm">
                    {new Date(project.preferred_date).toLocaleDateString()} - {project.preferred_window}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimate Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Your Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {existingEstimate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Status:</strong> {existingEstimate.status.charAt(0).toUpperCase() + existingEstimate.status.slice(1)}
                  </p>
                  {existingEstimate.expires_at && (
                    <p className="text-sm text-blue-800">
                      <strong>Expires:</strong> {new Date(existingEstimate.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="amount">Estimate Amount *</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="100"
                    step="0.01"
                    placeholder="0.00"
                    value={estimateData.amount}
                    onChange={(e) => setEstimateData(prev => ({ ...prev, amount: e.target.value }))}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum amount: $100</p>
              </div>

              <div>
                <Label htmlFor="breakdown">Cost Breakdown</Label>
                <Textarea
                  id="breakdown"
                  placeholder="Provide a detailed breakdown of your estimate (e.g., Labor: $500, Materials: $300, etc.)"
                  value={estimateData.breakdown}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, breakdown: e.target.value }))}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information, timeline, or special considerations..."
                  value={estimateData.notes}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : (existingEstimate ? 'Update Estimate' : 'Submit Estimate')}
                </Button>
                <Link to="/contractor/dashboard">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
