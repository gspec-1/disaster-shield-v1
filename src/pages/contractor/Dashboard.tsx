import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Settings, Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'
import SubscriptionStatus from '@/src/components/SubscriptionStatus'

export default function ContractorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [contractor, setContractor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user: userData } } = await supabase.auth.getUser()
        
        if (!userData) {
          navigate('/auth/login')
          return
        }
        
        setUser(userData)
        
        // Get contractor profile
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractors')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle()

        console.log('Contractor query result:', { contractorData, contractorError })
        
        if (contractorError) {
          console.error('Error fetching contractor:', contractorError)
        }
        setContractor(contractorData)

        if (contractorData) {
          // Get assigned projects
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('assigned_contractor_id', contractorData.id)
            .order('created_at', { ascending: false })

          if (projectsError) {
            console.error('Error fetching projects:', projectsError)
          }

          setProjects(projectsData || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // If Supabase is not configured, redirect to home
        if (error instanceof Error && error.message.includes('Supabase environment variables')) {
          navigate('/')
        } else {
          // For other errors, still try to show the dashboard
          setContractor(null)
          setProjects([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [navigate])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even if signOut fails
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
            <p className="text-gray-600 mb-6">Set up your contractor profile to start receiving job opportunities</p>
            <Link to="/contractor/profile">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Complete Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DisasterShield</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {contractor?.company_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <NotificationBell />
              <SubscriptionStatus userId={user?.id} />
              <Link to="/contractor/profile">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Dashboard</h1>
          <p className="text-gray-600">Manage your jobs and track your business</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{contractor.capacity}</p>
                </div>
                <div className={`h-3 w-3 rounded-full ${contractor.capacity === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Jobs</h2>
          <Link to="/contractor/browse-jobs">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Browse Available Jobs
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-600 mb-6">Jobs will appear here when you're matched with claims in your area</p>
              <p className="text-sm text-gray-500">
                Make sure your profile is complete and your capacity is set to "Active"
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {project.address}, {project.city}, {project.state}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.peril.charAt(0).toUpperCase() + project.peril.slice(1)} damage • {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`border-0 ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'matched' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Contact: {project.contact_name} • {project.contact_phone}
                    </div>
                    <Link to={`/portal/${project.id}`}>
                      <Button variant="outline" size="sm">
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