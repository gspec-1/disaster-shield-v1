import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search, MapPin, Calendar, AlertTriangle, Clock, DollarSign, ChevronLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import type { Database } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

type Project = Database['public']['Tables']['projects']['Row']

export default function BrowseJobs() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [contractor, setContractor] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeril, setSelectedPeril] = useState('all')
  const [selectedState, setSelectedState] = useState('all')
  const [showAllJobs, setShowAllJobs] = useState(false)
  const [existingMatchRequests, setExistingMatchRequests] = useState<string[]>([])

  const perilOptions = [
    { value: 'water', label: 'Water Damage' },
    { value: 'flood', label: 'Flood' },
    { value: 'wind', label: 'Wind/Storm' },
    { value: 'fire', label: 'Fire' },
    { value: 'mold', label: 'Mold' },
    { value: 'other', label: 'Other' },
  ]

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (!user) {
        navigate('/auth/login')
        return
      }

      // Get contractor profile
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      console.log('Contractor data:', contractorData)

      if (!contractorData) {
        navigate('/contractor/profile')
        return
      }

      setContractor(contractorData)

      // Get existing match requests for this contractor
      const { data: matchRequestsData } = await supabase
        .from('match_requests')
        .select('project_id')
        .eq('contractor_id', contractorData.id)

      const existingProjectIds = matchRequestsData?.map(mr => mr.project_id) || []
      setExistingMatchRequests(existingProjectIds)

      try {
        // Get available projects (not assigned to anyone yet)
        // Show projects that are available for contractor matching
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .is('assigned_contractor_id', null)
          .in('status', ['submitted', 'matched', 'scheduled'])
          .order('created_at', { ascending: false })

        console.log('Raw projects from database:', data)
        console.log('Projects query error:', error)

        if (error) {
          console.error('Error fetching projects:', error)
          setProjects([])
        } else {
          setProjects(data || [])
          setFilteredProjects(data || [])
        }
      } catch (error) {
        console.error('Error loading projects:', error)
        setProjects([])
        setFilteredProjects([])
      }
      
      setLoading(false)
    }

    loadData()
  }, [navigate])

  useEffect(() => {
    let filtered = projects
    console.log('Starting with projects:', projects.length)

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.log('After search filter:', filtered.length)
    }

    // Filter by peril type
    if (selectedPeril !== 'all') {
      filtered = filtered.filter(project => project.peril === selectedPeril)
      console.log('After peril filter:', filtered.length)
    }

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(project => project.state === selectedState)
      console.log('After state filter:', filtered.length)
    }

    // Filter by contractor's service areas and trades (unless "Show All Jobs" is enabled)
    if (contractor && !showAllJobs) {
      console.log('🔍 Contractor filtering debug:', {
        contractorId: contractor.id,
        serviceAreas: contractor.service_areas,
        trades: contractor.trades,
        projectsBeforeFilter: filtered.length
      })
      
      filtered = filtered.filter(project => {
        // Check if contractor serves the project's state or city
        const contractorAreas = contractor.service_areas || []
        const servesArea = contractorAreas.some(area => 
          area.toLowerCase() === project.state.toLowerCase() ||
          area.toLowerCase() === project.city.toLowerCase() ||
          area.toLowerCase() === project.zip
        )
        
        // Check if contractor has relevant trades
        const contractorTrades = contractor.trades || []
        const perilTradeMap: Record<string, string[]> = {
          flood: ['water_mitigation', 'rebuild', 'general'],
          water: ['water_mitigation', 'mold', 'general'],
          wind: ['rebuild', 'roofing', 'general'],
          fire: ['rebuild', 'smoke_restoration', 'general'],
          mold: ['mold', 'water_mitigation', 'general'],
          other: ['rebuild', 'general'],
        }
        
        const relevantTrades = perilTradeMap[project.peril] || ['rebuild', 'general']
        const hasRelevantTrade = contractorTrades.some(trade => 
          relevantTrades.includes(trade)
        )
        
        // If contractor has no service areas or trades defined, show all projects
        // This helps new contractors see all available jobs
        const hasNoRestrictions = contractorAreas.length === 0 && contractorTrades.length === 0
        
        // Show project if:
        // 1. Contractor has no restrictions (new contractor), OR
        // 2. Contractor serves the area, OR  
        // 3. Contractor has relevant trade
        const shouldShow = hasNoRestrictions || servesArea || hasRelevantTrade
        
        console.log(`📋 Project ${project.id} (${project.peril} in ${project.city}, ${project.state}):`, {
          servesArea,
          hasRelevantTrade,
          hasNoRestrictions,
          shouldShow,
          relevantTrades,
          contractorTrades
        })
        
        return shouldShow
      })
      console.log('✅ After contractor filtering:', filtered.length, 'projects remain')
    }

    setFilteredProjects(filtered)
  }, [projects, searchTerm, selectedPeril, selectedState, contractor, showAllJobs])

  const handleExpressInterest = async (projectId: string) => {
    if (!contractor) return

    // Check if already expressed interest
    if (existingMatchRequests.includes(projectId)) {
      alert('You have already expressed interest in this job.')
      return
    }

    try {
      // Double-check in database to prevent race conditions
      const { data: existingRequest } = await supabase
        .from('match_requests')
        .select('id')
        .eq('project_id', projectId)
        .eq('contractor_id', contractor.id)
        .maybeSingle()

      if (existingRequest) {
        alert('You have already expressed interest in this job.')
        return
      }

      // Create a match request
      const { error } = await supabase
        .from('match_requests')
        .insert({
          project_id: projectId,
          contractor_id: contractor.id,
          status: 'sent'
        })

      if (error) {
        console.error('Error expressing interest:', error)
        if (error.code === '23505') {
          alert('You have already expressed interest in this job.')
        } else {
          alert('Failed to express interest. Please try again.')
        }
      } else {
        alert('Interest expressed! The homeowner will be notified.')
        // Update local state to reflect the new match request
        setExistingMatchRequests(prev => [...prev, projectId])

        // Create notification for homeowner
        try {
          const project = filteredProjects.find(p => p.id === projectId)
          if (project?.user_id) {
            await supabase.from('notifications').insert({
              user_id: project.user_id,
              type: 'contractor_matched',
              title: '🤝 Contractor Interested!',
              message: `A contractor has expressed interest in your ${project.peril} damage claim. They may contact you soon.`,
              data: {
                projectId: project.id,
                contractorId: contractor.id
              }
            })
          }
        } catch (notificationError) {
          console.error('Error creating interest notification:', notificationError)
        }
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
      alert('Failed to express interest. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
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
          <p className="text-gray-600">Loading available jobs...</p>
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
              <Link to="/contractor/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell userId={user?.id} />
              <Link to="/contractor/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Jobs</h1>
          <p className="text-gray-600">Browse and express interest in projects that match your expertise</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Location
                </label>
                <Input
                  placeholder="City, address, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Damage Type
                </label>
                <Select value={selectedPeril} onValueChange={setSelectedPeril}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {perilOptions.map(peril => (
                      <SelectItem key={peril.value} value={peril.value}>
                        {peril.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Filtering
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAllJobs"
                    checked={showAllJobs}
                    onChange={(e) => setShowAllJobs(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showAllJobs" className="text-sm text-gray-700">
                    Show all jobs (ignore service areas)
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Matching Jobs ({filteredProjects.length})
          </h2>
        </div>

        {filteredProjects.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No matching jobs found</h3>
              <p className="text-gray-600 mb-6">
                {projects.length === 0 
                  ? 'No jobs are currently available that match your service areas and trades'
                  : 'Try adjusting your search filters to find more jobs'
                }
              </p>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('')
                  setSelectedPeril('all')
                  setSelectedState('all')
                  setShowAllJobs(false)
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        {project.peril.charAt(0).toUpperCase() + project.peril.slice(1)} Damage
                      </CardTitle>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {project.address}, {project.city}, {project.state} {project.zip}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800 border-0 mb-2">
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        Filed {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Incident Description</h4>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Incident Date
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {new Date(project.incident_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Preferred Inspection
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {new Date(project.preferred_date).toLocaleDateString()} • {project.preferred_window}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Property Owner</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p>{project.contact_name}</p>
                      <p>{project.contact_phone}</p>
                    </div>
                  </div>

                  {/* Insurance Info */}
                  {(project.carrier_name || project.policy_number) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Insurance Information
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {project.carrier_name && <p>Carrier: {project.carrier_name}</p>}
                        {project.policy_number && <p>Policy: {project.policy_number}</p>}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    {existingMatchRequests.includes(project.id) ? (
                      <Button 
                        className="flex-1 bg-gray-400 cursor-not-allowed"
                        disabled
                      >
                        Interest Expressed
                      </Button>
                    ) : (
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleExpressInterest(project.id)}
                      >
                        Express Interest
                      </Button>
                    )}
                    <Link to={`/portal/${project.id}`}>
                      <Button variant="outline">
                        View Details
                      </Button>
                    </Link>
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