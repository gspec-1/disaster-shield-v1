import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Building, Save, ChevronLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { ContractorOnboardingSchema, type ContractorOnboardingData } from '@/src/lib/validation'
import NotificationBell from '@/src/components/NotificationBell'

const TRADE_OPTIONS = [
  { value: 'water_mitigation', label: 'Water Mitigation' },
  { value: 'mold', label: 'Mold Remediation' },
  { value: 'rebuild', label: 'General Contracting/Rebuild' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'smoke_restoration', label: 'Smoke/Fire Restoration' },
]

const STATE_OPTIONS = [
  'FL', 'TX', 'CA', 'NY', 'GA', 'NC', 'SC', 'AL', 'LA', 'MS', 'TN', 'KY', 'VA', 'WV', 'MD', 'DE', 'NJ', 'PA', 'CT', 'RI', 'MA', 'VT', 'NH', 'ME'
]

export default function ContractorProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [existingContractor, setExistingContractor] = useState<any>(null)
  
  const [formData, setFormData] = useState<Partial<ContractorOnboardingData>>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    service_areas: [],
    trades: [],
    capacity: 'active',
    calendly_url: '',
  })

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // No user session found, redirect to login
        navigate('/auth/login')
        return
      }
      
      setUser(user)

      // Ensure profile exists for this user
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            role: 'contractor'
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          setError('Failed to create user profile')
          return
        }
      }

      // Check if contractor profile already exists
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (contractor) {
        setExistingContractor(contractor)
        setFormData({
          company_name: contractor.company_name,
          contact_name: contractor.contact_name,
          email: contractor.email,
          phone: contractor.phone,
          service_areas: contractor.service_areas || [],
          trades: contractor.trades || [],
          capacity: contractor.capacity,
          calendly_url: contractor.calendly_url || '',
        })
      }
    }

    loadData()
  }, [navigate])

  const handleTradeChange = (trade: string, checked: boolean) => {
    const currentTrades = formData.trades || []
    if (checked) {
      setFormData({
        ...formData,
        trades: [...currentTrades, trade]
      })
    } else {
      setFormData({
        ...formData,
        trades: currentTrades.filter(t => t !== trade)
      })
    }
  }

  const handleServiceAreaChange = (area: string, checked: boolean) => {
    const currentAreas = formData.service_areas || []
    if (checked) {
      setFormData({
        ...formData,
        service_areas: [...currentAreas, area]
      })
    } else {
      setFormData({
        ...formData,
        service_areas: currentAreas.filter(a => a !== area)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!user) throw new Error('Not authenticated')

      console.log('Submitting contractor profile:', formData)
      const validatedData = ContractorOnboardingSchema.parse({
        ...formData,
      })

      const contractorData = {
        ...validatedData,
        user_id: user.id
      }

      console.log('Validated contractor data:', contractorData)
      if (existingContractor) {
        // Update existing contractor
        const { data: updateData, error: updateError } = await supabase
          .from('contractors')
          .update(contractorData)
          .eq('id', existingContractor.id)
          .select()

        console.log('Update result:', { updateData, updateError })
        if (updateError) throw updateError
      } else {
        // Create new contractor
        const { data: insertData, error: insertError } = await supabase
          .from('contractors')
          .insert(contractorData)
          .select()

        console.log('Insert result:', { insertData, insertError })
        if (insertError) throw insertError
      }

      console.log('Profile saved successfully, redirecting...')
      navigate('/contractor/dashboard')
    } catch (error: any) {
      console.error('Profile save error:', error)
      setError(error.message || 'Failed to save contractor profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/contractor/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell userId={user?.id} />
              <Button 
                variant="outline" 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/');
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Building className="h-8 w-8" />
            {existingContractor ? 'Update' : 'Complete'} Your Contractor Profile
          </h1>
          <p className="text-gray-600">
            {existingContractor 
              ? 'Update your business information and service capabilities'
              : 'Set up your business profile to start receiving job opportunities'
            }
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Your Company LLC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name *
                  </label>
                  <Input
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Phone *
                  </label>
                  <Input
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Areas * (Select all states you serve)
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {STATE_OPTIONS.map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state}`}
                        checked={formData.service_areas?.includes(state) || false}
                        onCheckedChange={(checked) => handleServiceAreaChange(state, !!checked)}
                      />
                      <label htmlFor={`state-${state}`} className="text-sm font-medium">
                        {state}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Trades & Specialties * (Select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRADE_OPTIONS.map((trade) => (
                    <div key={trade.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trade-${trade.value}`}
                        checked={formData.trades?.includes(trade.value) || false}
                        onCheckedChange={(checked) => handleTradeChange(trade.value, !!checked)}
                      />
                      <label htmlFor={`trade-${trade.value}`} className="text-sm font-medium">
                        {trade.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity Status *
                  </label>
                  <Select
                    value={formData.capacity}
                    onValueChange={(value) => setFormData({ ...formData, capacity: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active - Accepting new jobs</SelectItem>
                      <SelectItem value="paused">Paused - Not accepting jobs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calendly URL (Optional)
                  </label>
                  <Input
                    type="url"
                    value={formData.calendly_url}
                    onChange={(e) => setFormData({ ...formData, calendly_url: e.target.value })}
                    placeholder="https://calendly.com/yourname"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/contractor/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Saving...' : existingContractor ? 'Update Profile' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}