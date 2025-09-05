import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, MapPin, Calendar, FileText, Phone, Mail, Clock, Trash2, MoreVertical, ChevronLeft } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import NotificationBell from '@/src/components/NotificationBell'
import { supabase, isConfigured } from '@/src/lib/supabase'
import { env } from '@/src/lib/env'
import { toast } from 'sonner'
import { executeCompleteWorkflow } from '@/lib/workflow/matching'

export default function ProjectPortal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isContractor, setIsContractor] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)
  const [triggeringMatching, setTriggeringMatching] = useState(false)
  const [rematching, setRematching] = useState(false)
  const [matchRequests, setMatchRequests] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])
  const [completedOrders, setCompletedOrders] = useState<any[]>([])

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return

      try {
        if (!supabase) {
          setError('Database connection not configured')
          setLoading(false)
          return
        }
        const sb = supabase
        // Get current user
        const { data: { user } } = await sb.auth.getUser()
        setUser(user)

        // Check if user is a contractor by checking their role in profiles
        if (user) {
          const { data: profileData } = await sb
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
            
          // Set isContractor based on the user's role in their profile
          setIsContractor(profileData?.role === 'contractor')
        }

        // Load project details
        const { data: projectData, error: projectError } = await sb
          .from('projects')
          .select('*')
          .eq('id', id)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Load media
        const { data: mediaData, error: mediaError } = await sb
          .from('media')
          .select('*')
          .eq('project_id', id)

        console.log('Media loading results:', { mediaData, mediaError, projectId: id })

        if (!mediaError) {
          setMedia(mediaData || [])
          console.log('Media loaded successfully:', mediaData?.length || 0, 'items')
          
          // Log details about each media item
          mediaData?.forEach((item, index) => {
            console.log(`Media item ${index}:`, {
              id: item.id,
              type: item.type,
              filename: item.filename,
              storage_path: item.storage_path,
              mime_type: item.mime_type,
              file_size: item.file_size
            })
          })
        } else {
          console.error('Error loading media:', mediaError)
        }

        // Load match requests
        const { data: matchData, error: matchError } = await sb
          .from('match_requests')
          .select('*')
          .eq('project_id', id)

        if (!matchError) {
          setMatchRequests(matchData || [])
          
          // Load contractor details for match requests
          if (matchData && matchData.length > 0) {
            const contractorIds = matchData.map(m => m.contractor_id)
            const { data: contractorData } = await sb
              .from('contractors')
              .select('*')
              .in('id', contractorIds)
            
            setContractors(contractorData || [])
          }
        }

        // Load completed orders for this user
        if (user?.id) {
          // First get the user's Stripe customer ID
          const { data: customerData, error: customerError } = await sb
            .from('stripe_customers')
            .select('customer_id')
            .eq('user_id', user.id)
            .maybeSingle()

          if (!customerError && customerData) {
            // Then get orders for this customer and project
            const { data: ordersData, error: ordersError } = await sb
              .from('stripe_orders')
              .select('*')
              .eq('customer_id', customerData.customer_id)
              .eq('project_id', id)
              .eq('status', 'completed')

            if (!ordersError) {
              setCompletedOrders(ordersData || [])
              console.log('Loaded completed orders:', ordersData?.length || 0, 'orders')
            } else {
              console.error('Error loading orders:', ordersError)
            }
          } else {
            console.log('No Stripe customer found for user:', user.id)
          }
        } else {
          console.log('No user found, skipping order loading')
        }

      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id])

  // Poll for completed orders updates
  useEffect(() => {
    if (!id || !project) return

    const pollForOrders = setInterval(async () => {
      try {
        if (!user?.id) {
          console.log('No user found, skipping order polling')
          return
        }

        // Get user's Stripe customer ID
        const { data: customerData, error: customerError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!customerError && customerData) {
          // Get orders for this customer and project
          const { data: ordersData, error: ordersError } = await supabase
            .from('stripe_orders')
            .select('*')
            .eq('customer_id', customerData.customer_id)
            .eq('project_id', id)
            .eq('status', 'completed')

          if (!ordersError && ordersData) {
            setCompletedOrders(ordersData)
            console.log('Polled completed orders:', ordersData.length, 'orders')
          } else if (ordersError) {
            console.error('Error polling orders:', ordersError)
          }
        } else if (customerError) {
          console.error('Error polling customer data:', customerError)
        }
      } catch (error) {
        console.error('Error polling for orders:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollForOrders)
  }, [id, project])

  const handleTriggerMatching = async () => {
    if (!project) return
    
    // Check if Supabase is configured
    if (!isConfigured || !supabase) {
      toast.error('Database connection not configured. Please connect to Supabase.')
      return
    }
    
    setTriggeringMatching(true)
    toast.info('Finding contractors in your area...')
    
    try {
      const workflowResult = await executeCompleteWorkflow({
        project: {
          id: project.id,
          address: project.address,
          city: project.city,
          state: project.state,
          zip: project.zip,
          peril: project.peril,
          incident_at: project.incident_at,
          description: project.description,
          preferred_date: project.preferred_date,
          preferred_window: project.preferred_window,
          contact_name: project.contact_name,
          contact_phone: project.contact_phone,
          contact_email: project.contact_email,
        },
        baseUrl: window.location.origin
      })
      
      if (workflowResult.success && workflowResult.matchedContractors > 0) {
        // Only update status to matched if contractors were actually found
        await supabase
          .from('projects')
          .update({ status: 'matched' })
          .eq('id', project.id)
        
        // Update local state
        setProject((prev: any) => ({ ...prev, status: 'matched' }))
        
        toast.success(`Found ${workflowResult.matchedContractors} qualified contractor${workflowResult.matchedContractors > 1 ? 's' : ''}! They'll be contacting you soon.`)
        
        // Reload match requests
        const { data: matchData } = await supabase
          .from('match_requests')
          .select('*')
          .eq('project_id', project.id)
        
        if (matchData) {
          setMatchRequests(matchData)
          
          // Load contractor details
          const contractorIds = matchData.map(m => m.contractor_id)
          const { data: contractorData } = await supabase
            .from('contractors')
            .select('*')
            .in('id', contractorIds)
          
          setContractors(contractorData || [])
        }
      } else {
        // Keep status as submitted if no contractors found
        toast.error(workflowResult.errors.length > 0 ? workflowResult.errors[0] : 'No contractors found in your area for this type of damage.')
      }
    } catch (error: any) {
      console.error('Error triggering matching:', error)
      toast.error('Failed to find contractors. Please try again.')
    } finally {
      setTriggeringMatching(false)
    }
  }

  const handleRematch = async () => {
    if (!project) return
    if (!isConfigured || !supabase) {
      toast.error('Database connection not configured. Please connect to Supabase.')
      return
    }

    setRematching(true)
    toast.info('Re-running contractor matching...')

    try {
      // Remove previous match requests
      await supabase
        .from('match_requests')
        .delete()
        .eq('project_id', project.id)

      // Reset project status so timeline reflects a fresh search
      await supabase
        .from('projects')
        .update({ status: 'submitted' })
        .eq('id', project.id)

      // Update local state immediately
      setProject((prev: any) => ({ ...prev, status: 'submitted' }))
      setMatchRequests([])

      // Trigger matching again
      await handleTriggerMatching()
    } catch (error) {
      console.error('Error re-matching contractors:', error)
      toast.error('Failed to rematch contractors. Please try again.')
    } finally {
      setRematching(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || !user) return
    
    setDeletingProject(true)
    try {
      console.log('Deleting project:', project.id, 'for user:', user.id)
      
      // Delete the project with explicit user check
      if (!supabase) throw new Error('Database connection not configured')
      const { data: deletedData, error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('user_id', user.id)
        .select()

      if (deleteError) {
        console.error('Error deleting project:', deleteError)
        throw new Error(deleteError.message)
      }

      if (!deletedData || deletedData.length === 0) {
        throw new Error('Project not found or you do not have permission to delete it')
      }

      console.log('Project deleted successfully:', deletedData)
      toast.success('Claim deleted successfully')
      navigate('/client/dashboard')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast.error(error.message || 'Failed to delete claim. Please try again.')
    } finally {
      setDeletingProject(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h3>
            <p className="text-gray-600 mb-6">
              {error || 'The project you\'re looking for doesn\'t exist or you don\'t have access to it.'}
            </p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'matched':
        return 'bg-blue-100 text-blue-800'
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'onsite':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to={isContractor ? "/contractor/dashboard" : "/client/dashboard"}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <NotificationBell userId={user?.id} />
                <Badge className={`${getStatusColor(project.status)} border-0`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
                {user && project.user_id === user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                              onClick={handleDeleteProject}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deletingProject}
                            >
                              {deletingProject ? 'Deleting...' : 'Delete Claim'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Claim Details
          </h1>
          <p className="text-gray-600">
            Claim ID: {project.id} • Filed {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">
                    {project.address}, {project.city}, {project.state} {project.zip}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Damage Type</h3>
                  <p className="text-gray-600 capitalize">{project.peril} damage</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Incident Date</h3>
                  <p className="text-gray-600">{new Date(project.incident_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Incident Description */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Incident Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>

            {/* Media Gallery */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                {media.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {media.map((item) => {
                      // Get the public URL for the file
                      const { data: urlData } = supabase.storage
                        .from('media')
                        .getPublicUrl(item.storage_path)
                      
                      console.log('Rendering media item:', {
                        item,
                        publicUrl: urlData.publicUrl,
                        storagePath: item.storage_path
                      })
                      
                      return (
                        <div key={item.id} className="relative group">
                        {item.type === 'photo' ? (
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={urlData.publicUrl}
                                alt={item.caption || 'Uploaded photo'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  const target = e.currentTarget as HTMLImageElement
                                  const nextSibling = target.nextElementSibling as HTMLElement
                                  target.style.display = 'none'
                                  if (nextSibling) nextSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            </div>
                          ) : item.type === 'video' ? (
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              <video
                                src={urlData.publicUrl}
                                className="w-full h-full object-cover"
                                controls
                                onError={(e) => {
                                  // Fallback to icon if video fails to load
                                  const target = e.currentTarget as HTMLVideoElement
                                  const nextSibling = target.nextElementSibling as HTMLElement
                                  target.style.display = 'none'
                                  if (nextSibling) nextSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                            <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            </div>
                          ) : item.type === 'audio' ? (
                            <div className="aspect-square bg-blue-100 rounded-lg flex flex-col items-center justify-center p-4 relative z-10"
                                 onClick={(e) => {
                                   console.log('Audio container clicked!', e.target)
                                   // Don't prevent default - let the audio controls handle the click
                                 }}>
                              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mb-2">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="w-full relative z-20">
                                <audio
                                  src={urlData.publicUrl}
                                  controls
                                  className="w-full h-8 relative z-30"
                                  preload="metadata"
                                  onError={(e) => {
                                    console.error('Audio loading error:', e)
                                    console.error('Audio URL:', urlData.publicUrl)
                                    console.error('Audio item:', item)
                                    console.error('Error details:', {
                                      networkState: e.currentTarget.networkState,
                                      readyState: e.currentTarget.readyState,
                                      error: e.currentTarget.error
                                    })
                                  }}
                                  onLoadStart={() => {
                                    console.log('Audio loading started:', urlData.publicUrl)
                                  }}
                                  onCanPlay={() => {
                                    console.log('Audio can play:', urlData.publicUrl)
                                  }}
                                  onLoadedMetadata={(e) => {
                                    console.log('Audio metadata loaded:', {
                                      duration: e.currentTarget.duration,
                                      url: urlData.publicUrl
                                    })
                                  }}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                                <p className="text-xs text-gray-600 mt-1 text-center">
                                  Voice Recording
                                </p>
                                <p className="text-xs text-blue-600 mt-1 text-center cursor-pointer hover:underline relative z-40"
                                   onClick={() => {
                                     console.log('Direct audio URL:', urlData.publicUrl)
                                     window.open(urlData.publicUrl, '_blank')
                                   }}>
                                  Open in new tab
                                </p>
                              </div>
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                          
                          {/* File info overlay - only for photos and videos, not audio */}
                          {item.type !== 'audio' && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-end pointer-events-none">
                              <div className="w-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {item.room_tag && (
                                  <div className="text-xs bg-black bg-opacity-75 px-2 py-1 rounded mb-1 inline-block">
                            {item.room_tag}
                          </div>
                        )}
                                {item.caption && (
                                  <div className="text-xs bg-black bg-opacity-75 px-2 py-1 rounded">
                                    {item.caption}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                      </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No documentation uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Photos, videos, and voice notes will appear here
                    </p>
                  </div>
                )}
                </CardContent>
              </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{project.contact_name}</p>
                    <p className="text-sm text-gray-600">{project.contact_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{project.contact_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Preferred Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">Preferred Date</p>
                  <p className="text-gray-600">{new Date(project.preferred_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Time Window</p>
                  <p className="text-gray-600">
                    {project.preferred_window === '8-10' && '8:00 AM - 10:00 AM'}
                    {project.preferred_window === '10-12' && '10:00 AM - 12:00 PM'}
                    {project.preferred_window === '12-2' && '12:00 PM - 2:00 PM'}
                    {project.preferred_window === '2-4' && '2:00 PM - 4:00 PM'}
                    {project.preferred_window === '4-6' && '4:00 PM - 6:00 PM'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            {(project.carrier_name || project.policy_number) && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.carrier_name && (
                    <div>
                      <p className="font-medium text-gray-900">Carrier</p>
                      <p className="text-gray-600">{project.carrier_name}</p>
                    </div>
                  )}
                  {project.policy_number && (
                    <div>
                      <p className="font-medium text-gray-900">Policy Number</p>
                      <p className="text-gray-600">{project.policy_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Timeline - Only shown to homeowners, not contractors */}
            {!isContractor && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Status Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Claim Submitted</p>
                      <p className="text-sm text-gray-600">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {matchRequests.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">Contractors Contacted</p>
                        <p className="text-sm text-gray-600">
                          {matchRequests.length} contractor{matchRequests.length !== 1 ? 's' : ''} found •{' '}
                          <Link to={`/matching/${project.id}`} className="text-blue-600 hover:underline">
                            View responses
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}
                  {project.status === 'matched' && matchRequests.length === 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">No Contractors Found</p>
                        <p className="text-sm text-gray-600">No qualified contractors available in your area</p>
                      </div>
                    </div>
                  )}
                  {project.assigned_contractor_id && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-900">Contractor Assigned</p>
                        <p className="text-sm text-gray-600">{new Date(project.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {/* Payment Progress - Integrated into timeline */}
                  {project.assigned_contractor_id && (
                    console.log('Payment status debug:', {
                      projectPaymentStatus: project.payment_status,
                      completedOrdersCount: completedOrders.length,
                      completedOrders: completedOrders.map(o => ({ amount: o.amount_total, product: o.product_id }))
                    }),
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        completedOrders.length === 3
                          ? 'bg-green-500' 
                          : completedOrders.length > 0
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                      <div>
                            <p className="font-medium text-gray-900">
                              {completedOrders.length === 3 ? 'Payment Completed' : 
                               completedOrders.length > 0 ? 'Payment In Progress' : 'Payment Required'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {completedOrders.length === 3
                                ? 'All payments completed' 
                                : completedOrders.length > 0 
                                ? `${completedOrders.length} of 3 payments completed`
                                : 'Complete payment to begin work'
                              }
                            </p>
                          </div>
                          <Link to={`/payment/${project.id}`}>
                            <Button 
                              size="sm" 
                              variant={completedOrders.length > 0 ? "outline" : "default"}
                              className={completedOrders.length > 0 ? "" : "bg-green-600 hover:bg-green-700"}
                            >
                              {completedOrders.length > 0 ? 'Review Payments' : 'Complete Payment'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>

                </CardContent>

                <CardFooter>
                  <div className="w-full flex justify-end">
                    <div className="flex items-center gap-2">
                      {!project.assigned_contractor_id && project.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={handleTriggerMatching}
                          disabled={triggeringMatching}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {triggeringMatching ? 'Finding...' : 'Find Contractors'}
                        </Button>
                      )}

                      {!project.assigned_contractor_id && project.status !== 'submitted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRematch}
                          disabled={rematching || triggeringMatching}
                        >
                          {rematching ? 'Re-matching...' : 'Rematch Contractors'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}