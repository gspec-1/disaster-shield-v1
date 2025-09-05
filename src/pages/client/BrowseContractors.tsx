import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search, MapPin, Star, Calendar, Phone, Mail, ExternalLink, ChevronLeft } from 'lucide-react'
import { supabase, isConfigured } from '@/src/lib/supabase'
import type { Database } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

type Contractor = Database['public']['Tables']['contractors']['Row']

export default function BrowseContractors() {
  const navigate = useNavigate()
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrade, setSelectedTrade] = useState('all')
  const [selectedState, setSelectedState] = useState('all')

  const tradeOptions = [
    { value: 'water_mitigation', label: 'Water Mitigation' },
    { value: 'mold', label: 'Mold Remediation' },
    { value: 'rebuild', label: 'General Contracting' },
    { value: 'roofing', label: 'Roofing' },
    { value: 'smoke_restoration', label: 'Fire/Smoke Restoration' },
  ]

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        console.error('Supabase client is not configured!')
        setContractors([])
        setFilteredContractors([])
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Note: Contractors should be publicly browsable, so we don't require authentication
      // Users can browse contractors without logging in

      try {
        console.log('Starting contractor fetch...')
        console.log('Supabase configured:', isConfigured)
        console.log('Supabase client:', supabase)
        
        const { data, error } = await supabase
          .from('contractors')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('Full contractors query result:')
        console.log('- Data:', data)
        console.log('- Error:', error)
        console.log('- Data length:', data?.length || 0)
        console.log('- First contractor:', data?.[0])

        if (error) {
          console.error('Error fetching contractors:', error)
          setContractors([])
        } else {
          const allContractors = data || []
          console.log('Setting contractors:', allContractors.length)
          setContractors(allContractors)
          setFilteredContractors(allContractors)
        }
      } catch (error) {
        console.error('Error loading contractors:', error)
        setContractors([])
        setFilteredContractors([])
      }
      
      setLoading(false)
    }

    loadData()
  }, [navigate])

  useEffect(() => {
    let filtered = contractors
    console.log('Starting filtering with contractors:', contractors.length)
    console.log('Sample contractor service_areas:', contractors[0]?.service_areas)
    console.log('Sample contractor trades:', contractors[0]?.trades)

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contractor =>
        contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractor.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log('After search filter:', filtered.length)
    }

    // Filter by trade
    if (selectedTrade !== 'all') {
      filtered = filtered.filter(contractor => {
          try {
            const trades = typeof contractor.trades === 'string' 
              ? JSON.parse(contractor.trades) 
              : contractor.trades
            return Array.isArray(trades) && trades.includes(selectedTrade)
          } catch (error) {
            console.error('Error parsing trades for contractor:', contractor.id, error)
            return false
          }
        }
      )
      console.log('After trade filter:', filtered.length)
    }

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(contractor => {
          try {
            const serviceAreas = typeof contractor.service_areas === 'string' 
              ? JSON.parse(contractor.service_areas) 
              : contractor.service_areas
            return Array.isArray(serviceAreas) && 
              serviceAreas.some(area => 
                area.toLowerCase() === selectedState.toLowerCase() ||
                area.toLowerCase().includes(selectedState.toLowerCase())
              )
          } catch (error) {
            console.error('Error parsing service_areas for contractor:', contractor.id, error)
            return false
          }
        }
      )
      console.log('After state filter:', filtered.length)
    }

    // Remove the contractor-specific filtering that was hiding all contractors
    console.log('Final filtered contractors:', filtered.length)
    setFilteredContractors(filtered)
  }, [contractors, searchTerm, selectedTrade, selectedState])

  const handleSignOut = async () => {
    try {
      if (!supabase) {
        navigate('/')
        return
      }
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading contractors...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600">Supabase is not properly configured. Please check your environment variables.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to={user ? "/client/dashboard" : "/"} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">{user ? "Dashboard" : "Home"}</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user && <NotificationBell userId={user.id} />}
              {user ? (
                <>
                  <Link to="/client/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Contractors</h1>
          <p className="text-gray-600">Find qualified contractors in your area for your project needs</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Input
                  placeholder="Company name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade/Specialty
                </label>
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    {tradeOptions.map(trade => (
                      <SelectItem key={trade.value} value={trade.value}>
                        {trade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area
                </label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Contractors ({filteredContractors.length})
          </h2>
        </div>

        {filteredContractors.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No contractors found</h3>
              <p className="text-gray-600 mb-6">
                {contractors.length === 0 
                  ? 'No contractors are currently available in our network'
                  : 'Try adjusting your search filters to find contractors'
                }
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setSelectedTrade('all')
                setSelectedState('all')
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredContractors.map((contractor) => (
              <Card key={contractor.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {contractor.company_name}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{contractor.contact_name}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      Available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {contractor.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {contractor.email}
                    </div>
                  </div>

                  {/* Service Areas */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Service Areas
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const serviceAreas = typeof contractor.service_areas === 'string' 
                            ? JSON.parse(contractor.service_areas) 
                            : contractor.service_areas
                          return Array.isArray(serviceAreas) ? serviceAreas.slice(0, 3).map((area) => (
                            <Badge key={area} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          )) : []
                        } catch (error) {
                          return []
                        }
                      })()}
                      {(() => {
                        try {
                          const serviceAreas = typeof contractor.service_areas === 'string' 
                            ? JSON.parse(contractor.service_areas) 
                            : contractor.service_areas
                          return Array.isArray(serviceAreas) && serviceAreas.length > 3 ? (
                            <Badge variant="outline" className="text-xs">
                              +{serviceAreas.length - 3} more
                            </Badge>
                          ) : null
                        } catch (error) {
                          return null
                        }
                      })()}
                    </div>
                  </div>

                  {/* Trades */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const trades = typeof contractor.trades === 'string' 
                            ? JSON.parse(contractor.trades) 
                            : contractor.trades
                          return Array.isArray(trades) ? trades.map((trade) => {
                            const tradeLabel = tradeOptions.find(t => t.value === trade)?.label || trade
                            return (
                              <Badge key={trade} className="bg-blue-100 text-blue-800 border-0 text-xs">
                                {tradeLabel}
                              </Badge>
                            )
                          }) : []
                        } catch (error) {
                          return []
                        }
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        // TODO: Implement direct contact functionality
                        window.location.href = `mailto:${contractor.email}?subject=Project Inquiry from DisasterShield`
                      }}
                    >
                      Contact Directly
                    </Button>
                    {contractor.calendly_url && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(contractor.calendly_url!, '_blank')}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}