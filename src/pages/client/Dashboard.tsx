import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, FileText, Clock, CheckCircle, AlertCircle, Trash2, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { supabase } from '@/src/lib/supabase'
import type { Database } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'
import SubscriptionStatus from '@/src/components/SubscriptionStatus'
import { toast } from 'sonner'

type Project = Database['public']['Tables']['projects']['Row']

export default function ClientDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [deletingProject, setDeletingProject] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (!error) {
            setProjects(data || [])
          } else if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
            // Database tables not set up yet - show empty state
            console.log('Database tables not found - showing empty state')
            setProjects([])
          } else {
            console.error('Error fetching projects:', error)
            setProjects([])
          }
        } catch (error) {
          console.error('Error fetching projects:', error)
          setProjects([])
        }

        // Load user profile to check role
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false)
    }

    getUser()
  }, [])

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

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProject(projectId)
    try {
      // Re-fetch current user session to ensure we have the latest user data
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser || !currentUser.id) {
        console.error('User not authenticated or missing ID:', currentUser, userError)
        toast.error('You must be logged in to delete claims')
        return
      }

      console.log('Deleting project:', projectId, 'for user:', currentUser.id)
      
      // Delete the project with explicit user check
      const { data: deletedData, error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', currentUser.id)
        .select()

      if (deleteError) {
        console.error('Error deleting project:', deleteError)
        throw new Error(deleteError.message)
      }

      if (!deletedData || deletedData.length === 0) {
        throw new Error('Project not found or you do not have permission to delete it')
      }

      console.log('Project deleted successfully:', deletedData)
      
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast.success('Claim deleted successfully')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast.error(error.message || 'Failed to delete claim. Please try again.')
    } finally {
      setDeletingProject(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4" />
      case 'matched':
        return <AlertCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'matched':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
              <span className="text-sm text-gray-600">Welcome back!</span>
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    Admin Portal
                  </Button>
                </Link>
              )}
              <NotificationBell />
              <SubscriptionStatus userId={user?.id} />
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Claims Dashboard</h1>
          <p className="text-gray-600">Track your insurance claims and connect with contractors</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Claims</p>
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Claims</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {projects.filter(p => p.status !== 'completed').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
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
        </div>

        {/* Claims List */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Claims</h2>
          <div className="flex gap-3">
            <Link to="/client/browse-contractors">
              <Button variant="outline">
                Browse Contractors
              </Button>
            </Link>
            <Link to="/intake">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                New Claim
              </Button>
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No claims yet</h3>
              <p className="text-gray-600 mb-6">Get started by filing your first insurance claim</p>
              <Link to="/intake">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  File Your First Claim
                </Button>
              </Link>
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
                        {project.peril.charAt(0).toUpperCase() + project.peril.slice(1)} damage • Filed {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(project.status)} border-0`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(project.status)}
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {project.status === 'matched' && (
                            <DropdownMenuItem asChild>
                              <Link to={`/client/review-estimates/${project.id}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Review Estimates
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Claim
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Claim</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this claim? This action cannot be undone and will remove all associated data including photos, contractor matches, and payment records.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deletingProject === project.id}
                                >
                                  {deletingProject === project.id ? 'Deleting...' : 'Delete Claim'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Claim ID: {project.id.slice(0, 8)}...
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