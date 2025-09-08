import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings,
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { toast } from 'sonner'

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalContractors: number
  activeContractors: number
  totalUsers: number
  pendingFNOLs: number
  completedFNOLs: number
  recentProjects: any[]
  recentFNOLs: any[]
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        navigate('/auth/login')
        return
      }

      setUser(authUser)

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.')
        // Redirect to appropriate dashboard based on role
        if (profile?.role === 'contractor') {
          navigate('/contractor/dashboard')
        } else {
          navigate('/client/dashboard')
        }
        return
      }

      // Load dashboard data
      await loadDashboardData()
    } catch (error) {
      console.error('Auth check error:', error)
      navigate('/auth/login')
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load all stats in parallel
      const [
        projectsResult,
        contractorsResult,
        usersResult,
        fnolResult,
        recentProjectsResult,
        recentFNOLsResult
      ] = await Promise.all([
        supabase.from('projects').select('id, status, created_at'),
        supabase.from('contractors').select('id, capacity, created_at'),
        supabase.from('profiles').select('id, role, created_at'),
        supabase.from('fnol_records').select('id, status, created_at').limit(100),
        supabase.from('projects').select('id, contact_name, peril, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('fnol_records').select('id, status, created_at').order('created_at', { ascending: false }).limit(5)
      ])

      const projects = projectsResult.data || []
      const contractors = contractorsResult.data || []
      const users = usersResult.data || []
      const fnols = fnolResult.data || []
      const recentProjects = recentProjectsResult.data || []
      const recentFNOLs = recentFNOLsResult.data || []

      setStats({
        totalProjects: projects.length,
        activeProjects: projects.filter(p => ['submitted', 'matched', 'scheduled', 'onsite'].includes(p.status)).length,
        totalContractors: contractors.length,
        activeContractors: contractors.filter(c => c.capacity === 'active').length,
        totalUsers: users.length,
        pendingFNOLs: fnols.filter(f => f.status === 'pending').length,
        completedFNOLs: fnols.filter(f => f.status === 'acknowledged').length,
        recentProjects,
        recentFNOLs
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading admin dashboard...</p>
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
              <Link to="/client/dashboard" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              Admin Portal
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your DisasterShield platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalProjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeProjects || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contractors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalContractors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Contractors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeContractors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FNOL Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending FNOLs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingFNOLs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed FNOLs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedFNOLs || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/admin/insurance-companies">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Insurance Companies
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Users className="h-4 w-4 mr-2" />
                Manage Users (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics & Reports (Coming Soon)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Settings className="h-4 w-4 mr-2" />
                System Settings (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Projects</h4>
                  <div className="space-y-2">
                    {stats?.recentProjects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{project.contact_name}</p>
                          <p className="text-xs text-gray-600 capitalize">{project.peril} damage</p>
                        </div>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent FNOLs</h4>
                  <div className="space-y-2">
                    {stats?.recentFNOLs.slice(0, 3).map((fnol) => (
                      <div key={fnol.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">FNOL #{fnol.id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-600">{new Date(fnol.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={
                          fnol.status === 'acknowledged' ? 'default' :
                          fnol.status === 'pending' ? 'secondary' :
                          fnol.status === 'submitted' ? 'secondary' :
                          'destructive'
                        }>
                          {fnol.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
