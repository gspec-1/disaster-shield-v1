import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Clock, CheckCircle, AlertCircle, MapPin, Star, Mail, Phone } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function MatchingPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [matchRequests, setMatchRequests] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (!user) {
          navigate('/auth/login')
          return
        }

        if (!projectId) {
          navigate('/client/dashboard')
          return
        }

        // Load project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError || !projectData) {
          navigate('/client/dashboard')
          return
        }

        // Check if user owns this project
        if (projectData.user_id !== user.id) {
          navigate('/client/dashboard')
          return
        }

        setProject(projectData)

        // Load match requests with contractor details
        const { data: matchData, error: matchError } = await supabase
          .from('match_requests')
          .select(`
            *,
            contractors (*)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (!matchError && matchData) {
          setMatchRequests(matchData)
          setContractors(matchData.map(m => m.contractors).filter(Boolean))
        }

      } catch (error) {
        console.error('Error loading matching data:', error)
        navigate('/client/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up real-time subscription for match request updates
    const subscription = supabase
      .channel('match_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_requests',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Match request update:', payload)
          // Reload data when match requests change
          loadData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [projectId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading contractor matching...</p>
        </div>
      </div>
    )
  }

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'declined':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const acceptedMatch = matchRequests.find(m => m.status === 'accepted')
  const pendingMatches = matchRequests.filter(m => m.status === 'sent')
  const declinedMatches = matchRequests.filter(m => m.status === 'declined')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={`/portal/${projectId}`} className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DisasterShield</span>
            </Link>
            <div className="flex items-center space-x-4">
              <NotificationBell userId={user?.id} />
              <Link to={`/portal/${projectId}`}>
                <Button variant="outline">Back to Project</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Matching</h1>
          <p className="text-gray-600">
            We're connecting you with qualified contractors for your {project?.peril} damage claim
          </p>
        </div>

        {/* Matching Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contractors Contacted</p>
                  <p className="text-3xl font-bold text-gray-900">{matchRequests.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Responses Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingMatches.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Job Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {acceptedMatch ? 'Assigned' : 'Matching'}
                  </p>
                </div>
                {acceptedMatch ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <Clock className="h-8 w-8 text-orange-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Contractor */}
        {acceptedMatch && (
          <Card className="border-0 shadow-lg mb-8 border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-6 w-6" />
                Contractor Assigned!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{acceptedMatch.contractors.company_name}</h3>
                    <p className="text-gray-600">{acceptedMatch.contractors.contact_name}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0">
                    Assigned
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{acceptedMatch.contractors.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{acceptedMatch.contractors.email}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Service Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {acceptedMatch.contractors.service_areas.map((area: string) => (
                      <Badge key={area} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Next Steps:</strong> Your assigned contractor will contact you within 24 hours to schedule the inspection. 
                    You can also reach out to them directly using the contact information above.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Responses */}
        {pendingMatches.length > 0 && !acceptedMatch && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-yellow-600" />
                Waiting for Contractor Responses ({pendingMatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMatches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{match.contractors.company_name}</h3>
                        <p className="text-gray-600 text-sm">{match.contractors.contact_name}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-0">
                        Pending Response
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Serves: {match.contractors.service_areas.slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Specializes in: {match.contractors.trades.slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Invitation sent {new Date(match.created_at).toLocaleDateString()} at {new Date(match.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">What happens next?</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Contractors have 48 hours to respond. The first contractor to accept will be assigned to your job. 
                      You'll be notified immediately when someone accepts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declined Responses */}
        {declinedMatches.length > 0 && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                Contractor Responses ({declinedMatches.length} declined)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {declinedMatches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-3 bg-red-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{match.contractors.company_name}</h4>
                        <p className="text-sm text-gray-600">{match.contractors.contact_name}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800 border-0">
                        Declined
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Declined on {new Date(match.responded_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Matches Found */}
        {matchRequests.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Finding Contractors</h3>
              <p className="text-gray-600 mb-6">
                We're actively searching for qualified contractors in your area. This usually takes a few minutes.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}