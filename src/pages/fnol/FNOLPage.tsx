import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Building2, 
  ChevronLeft,
  Shield,
  ExternalLink,
  Upload,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { createCheckoutSession, redirectToCheckout, getUserOrders } from '@/src/lib/stripe'
import { STRIPE_PRODUCTS, formatPrice } from '@/src/stripe-config'
import { isPaymentCompleted } from '@/src/lib/payment-config'
import { toast } from 'sonner'

interface Project {
  id: string
  contact_name: string
  contact_phone: string
  contact_email: string
  address: string
  city: string
  state: string
  zip: string
  peril: string
  incident_at: string
  description: string
  carrier_name?: string
  policy_number?: string
  fnol_status: string
}

interface InsuranceCompany {
  id: string
  name: string
  display_name: string
  requires_manual_submission: boolean
  supported_perils: string[]
  api_endpoint?: string
}

interface FNOLRecord {
  id: string
  project_id: string
  insurance_company_id: string
  submission_method: string
  status: string
  fnol_number?: string
  submission_date?: string
  acknowledgment_date?: string
  acknowledgment_reference?: string
  submitted_by?: string
  submission_notes?: string
  error_message?: string
  fnol_document_url?: string
  created_at: string
  updated_at: string
}

interface FNOLFormData {
  insurance_company_id: string
  submission_method: 'api' | 'manual' | 'email' | 'fax'
  policy_number: string
  loss_date: string
  loss_time: string
  cause_of_loss: string
  areas_affected: string
  estimated_damage: string
  emergency_repairs: string
  prevented_further_damage: string
  police_report: boolean
  police_report_number: string
  witnesses: string
  additional_notes: string
  submission_notes: string
}

export default function FNOLPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('payment')
  const [project, setProject] = useState<Project | null>(null)
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([])
  const [existingFNOL, setExistingFNOL] = useState<FNOLRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<InsuranceCompany | null>(null)
  const [completedOrders, setCompletedOrders] = useState<any[]>([])
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FNOLFormData>({
    insurance_company_id: '',
    submission_method: 'manual',
    policy_number: '',
    loss_date: '',
    loss_time: '',
    cause_of_loss: '',
    areas_affected: '',
    estimated_damage: '',
    emergency_repairs: '',
    prevented_further_damage: '',
    police_report: false,
    police_report_number: '',
    witnesses: '',
    additional_notes: '',
    submission_notes: ''
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  // Load completed orders when project is available
  useEffect(() => {
    if (project) {
      loadCompletedOrders()
    }
  }, [project])

  // Handle payment success/cancellation
  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Payment successful! You can now submit your FNOL.')
      // Reload completed orders to update payment status with a delay
      if (project) {
        setTimeout(() => {
          loadCompletedOrders()
        }, 1000) // Wait 1 second for webhook to process
      }
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. Please try again if you want to submit your FNOL.')
    }
  }, [paymentStatus, project])

  // Periodic refresh of payment status (every 30 seconds) when payment is pending
  useEffect(() => {
    if (!project || !existingFNOL || existingFNOL.status !== 'pending') return

    const interval = setInterval(() => {
      if (!isFNOLPaymentCompleted()) {
        loadCompletedOrders()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [project, existingFNOL])

  const loadData = async () => {
    try {
      // Check user role first
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(profileData?.role || null)
        
        // If user is contractor or admin, redirect them away
        if (profileData?.role === 'contractor') {
          navigate('/contractor/dashboard')
          return
        }
        if (profileData?.role === 'admin') {
          navigate('/admin')
          return
        }
      }

      // Load project data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Load insurance companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (companiesError) throw companiesError
      setInsuranceCompanies(companiesData)

      // Load existing FNOL record
      const { data: fnolData, error: fnolError } = await supabase
        .from('fnol_records')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fnolError) throw fnolError
      setExistingFNOL(fnolData)

      // Pre-fill form data
      if (projectData) {
        setFormData(prev => ({
          ...prev,
          policy_number: projectData.policy_number || '',
          loss_date: projectData.incident_at ? projectData.incident_at.split('T')[0] : '',
          areas_affected: projectData.description || ''
        }))

        // Auto-select insurance company if carrier name matches
        if (projectData.carrier_name && companiesData) {
          const matchingCompany = companiesData.find(company => 
            company.name.toLowerCase() === projectData.carrier_name.toLowerCase()
          )
          if (matchingCompany) {
            const submissionMethod = matchingCompany.requires_manual_submission ? 'manual' : 'api'
            setSelectedCompany(matchingCompany)
            setFormData(prev => ({
              ...prev,
              insurance_company_id: matchingCompany.id,
              submission_method: submissionMethod
            }))
          }
        }
      }

    } catch (error) {
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    const company = insuranceCompanies.find(c => c.id === companyId)
    setSelectedCompany(company || null)
    
    const submissionMethod = company?.requires_manual_submission ? 'manual' : 'api'
    
    setFormData(prev => ({
      ...prev,
      insurance_company_id: companyId,
      submission_method: submissionMethod
    }))
  }

  const generateFNOLDocument = async () => {
    if (!project || !selectedCompany) return

    // Ensure submission_method is set
    if (!formData.submission_method) {
      setFormData(prev => ({
        ...prev,
        submission_method: selectedCompany.requires_manual_submission ? 'manual' : 'api'
      }))
    }

    try {
      // Generate FNOL document content
      const fnolContent = {
        title: 'First Notice of Loss (FNOL)',
        insurance_company: selectedCompany.display_name,
        policyholder: {
          name: project.contact_name,
          phone: project.contact_phone,
          email: project.contact_email,
          policy_number: formData.policy_number
        },
        property: {
          address: project.address,
          city: project.city,
          state: project.state,
          zip: project.zip
        },
        loss: {
          date: formData.loss_date,
          time: formData.loss_time,
          type: project.peril,
          description: project.description,
          cause: formData.cause_of_loss,
          areas_affected: formData.areas_affected,
          estimated_damage: formData.estimated_damage
        },
        emergency_actions: {
          repairs: formData.emergency_repairs,
          prevention: formData.prevented_further_damage,
          police_report: formData.police_report,
          police_report_number: formData.police_report_number
        },
        additional: {
          witnesses: formData.witnesses,
          notes: formData.additional_notes
        },
        submission: {
          method: formData.submission_method,
          notes: formData.submission_notes,
          date: new Date().toISOString()
        }
      }

      // Create FNOL record
      
      const { data: fnolRecord, error: fnolError } = await supabase
        .from('fnol_records')
        .insert({
          project_id: project.id,
          insurance_company_id: selectedCompany.id,
          submission_method: formData.submission_method,
          status: 'pending',
          submission_notes: formData.submission_notes
        })
        .select()
        .single()

      if (fnolError) throw fnolError

      // Update project FNOL status
      await supabase
        .from('projects')
        .update({ fnol_status: 'pending' })
        .eq('id', project.id)

      toast.success('FNOL document generated successfully!')
      setExistingFNOL(fnolRecord)

    } catch (error) {
      toast.error('Failed to generate FNOL document')
    }
  }

  const submitFNOL = async () => {
    if (!existingFNOL) return

    // Check if FNOL Generation Fee has been paid
    if (!isFNOLPaymentCompleted()) {
      toast.error('Please complete the FNOL Generation Fee payment before submitting.')
      return
    }

    setSubmitting(true)
    try {
      // Update FNOL record status
      const { error: updateError } = await supabase
        .from('fnol_records')
        .update({
          status: 'submitted',
          submission_date: new Date().toISOString(),
          submission_notes: formData.submission_notes
        })
        .eq('id', existingFNOL.id)

      if (updateError) throw updateError

      // Update project FNOL status
      await supabase
        .from('projects')
        .update({ fnol_status: 'submitted' })
        .eq('id', project.id)

      toast.success('FNOL submitted successfully!')
      await loadData()

    } catch (error) {
      toast.error('Failed to submit FNOL')
    } finally {
      setSubmitting(false)
    }
  }

  // Check if FNOL Generation Fee has been paid
  const isFNOLPaymentCompleted = () => {
    const isCompleted = isPaymentCompleted('FNOL_GENERATION_FEE', completedOrders)
    return isCompleted
  }

  // Handle FNOL Generation Fee payment
  const handleFNOLPayment = async () => {
    if (!project) return

    setCheckingPayment(true)
    try {
      const successUrl = `${window.location.origin}/fnol/${project.id}?payment=success`
      const cancelUrl = `${window.location.origin}/fnol/${project.id}?payment=cancelled`

      const { url } = await createCheckoutSession({
        productKey: 'FNOL_GENERATION_FEE',
        successUrl,
        cancelUrl,
        projectId: project.id
      })

      await redirectToCheckout(url)
    } catch (error) {
      toast.error('Failed to initiate payment')
    } finally {
      setCheckingPayment(false)
    }
  }

  // Load completed orders for payment checking
  const loadCompletedOrders = async () => {
    if (!project) return

    try {
      const orders = await getUserOrders(project.id)
      const completed = orders.filter(order => order.status === 'completed')
      setCompletedOrders(completed)
    } catch (error) {
    }
  }

  // Manual refresh function for payment status
  const refreshPaymentStatus = async () => {
    if (project) {
      await loadCompletedOrders()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Send },
      acknowledged: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading FNOL information...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Project not found</p>
          <Button asChild className="mt-4">
            <Link to="/client/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/client/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              Notice of Loss
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            First Notice of Loss (FNOL)
          </h1>
          <p className="text-gray-600">
            Generate and submit your insurance claim notification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Property Address</label>
                  <p className="text-sm">{project.address}</p>
                  <p className="text-sm">{project.city}, {project.state} {project.zip}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Information</label>
                  <p className="text-sm">{project.contact_name}</p>
                  <p className="text-sm">{project.contact_phone}</p>
                  <p className="text-sm">{project.contact_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loss Details</label>
                  <p className="text-sm capitalize">{project.peril} damage</p>
                  <p className="text-sm">{new Date(project.incident_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current FNOL Status</label>
                  <div className="mt-1">
                    {getStatusBadge(project.fnol_status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FNOL Form */}
          <div className="lg:col-span-2">
            {existingFNOL ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    FNOL Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status: {getStatusBadge(existingFNOL.status)}</p>
                      <p className="text-sm text-gray-600">Created: {new Date(existingFNOL.created_at).toLocaleString()}</p>
                      {existingFNOL.fnol_number && (
                        <p className="text-sm text-gray-600">Claim Number: {existingFNOL.fnol_number}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          FNOL Generation Fee: {isFNOLPaymentCompleted() ? (
                            <span className="text-green-600 font-medium">✓ Paid</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Not Paid</span>
                          )}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={refreshPaymentStatus}
                          className="h-6 w-6 p-0"
                          title="Refresh payment status"
                        >
                          🔄
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {existingFNOL.status === 'pending' && (
                        <>
                          {!isFNOLPaymentCompleted() ? (
                            <Button 
                              onClick={handleFNOLPayment} 
                              disabled={checkingPayment}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {checkingPayment ? 'Processing...' : `Pay ${formatPrice(STRIPE_PRODUCTS.FNOL_GENERATION_FEE.amount)} - FNOL Generation Fee`}
                            </Button>
                          ) : (
                            <Button onClick={submitFNOL} disabled={submitting}>
                              <Upload className="h-4 w-4 mr-2" />
                              {submitting ? 'Submitting...' : 'Submit FNOL'}
                            </Button>
                          )}
                        </>
                      )}
                      {existingFNOL.fnol_document_url && (
                        <Button variant="outline" asChild>
                          <a href={existingFNOL.fnol_document_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download Document
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {existingFNOL.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-800">Error: {existingFNOL.error_message}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate FNOL Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Insurance Company Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Insurance Company *</label>
                    <Select value={formData.insurance_company_id} onValueChange={handleCompanyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your insurance company" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{company.display_name}</span>
                              {!company.requires_manual_submission && (
                                <Badge variant="secondary" className="ml-2">API</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCompany && (
                    <>
                      {/* Policy Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Policy Number *</label>
                          <Input
                            value={formData.policy_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
                            placeholder="Enter policy number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Loss Date *</label>
                          <Input
                            type="date"
                            value={formData.loss_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, loss_date: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Loss Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Time of Loss (if known)</label>
                          <Input
                            type="time"
                            value={formData.loss_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, loss_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Estimated Damage Amount</label>
                          <Input
                            value={formData.estimated_damage}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimated_damage: e.target.value }))}
                            placeholder="$0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Cause of Loss</label>
                        <Input
                          value={formData.cause_of_loss}
                          onChange={(e) => setFormData(prev => ({ ...prev, cause_of_loss: e.target.value }))}
                          placeholder="e.g., Burst pipe, storm damage, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Areas Affected</label>
                        <Textarea
                          value={formData.areas_affected}
                          onChange={(e) => setFormData(prev => ({ ...prev, areas_affected: e.target.value }))}
                          placeholder="Describe which areas of the property were affected"
                          rows={3}
                        />
                      </div>

                      {/* Emergency Actions */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Emergency Repairs Taken</label>
                        <Textarea
                          value={formData.emergency_repairs}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergency_repairs: e.target.value }))}
                          placeholder="Describe any emergency repairs or mitigation actions taken"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Actions to Prevent Further Damage</label>
                        <Textarea
                          value={formData.prevented_further_damage}
                          onChange={(e) => setFormData(prev => ({ ...prev, prevented_further_damage: e.target.value }))}
                          placeholder="Describe steps taken to prevent additional damage"
                          rows={3}
                        />
                      </div>

                      {/* Police Report */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="police_report"
                            checked={formData.police_report}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, police_report: !!checked }))}
                          />
                          <label htmlFor="police_report" className="text-sm font-medium">
                            Police report was filed
                          </label>
                        </div>
                        {formData.police_report && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Police Report Number</label>
                            <Input
                              value={formData.police_report_number}
                              onChange={(e) => setFormData(prev => ({ ...prev, police_report_number: e.target.value }))}
                              placeholder="Enter police report number"
                            />
                          </div>
                        )}
                      </div>

                      {/* Additional Information */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Witnesses</label>
                        <Textarea
                          value={formData.witnesses}
                          onChange={(e) => setFormData(prev => ({ ...prev, witnesses: e.target.value }))}
                          placeholder="List any witnesses to the incident"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Additional Notes</label>
                        <Textarea
                          value={formData.additional_notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                          placeholder="Any additional information relevant to the claim"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Submission Notes</label>
                        <Textarea
                          value={formData.submission_notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, submission_notes: e.target.value }))}
                          placeholder="Notes about how this FNOL will be submitted"
                          rows={2}
                        />
                      </div>

                      {/* Generate Button */}
                      <div className="flex justify-end">
                        <Button 
                          onClick={generateFNOLDocument}
                          disabled={!formData.insurance_company_id || !formData.policy_number || !formData.loss_date}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate FNOL Document
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
