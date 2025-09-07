import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Clock, Users, FileCheck, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase, isConfigured } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Only try to get user if Supabase is configured and client exists
        if (!isConfigured || !supabase) {
          console.log('Supabase not configured, skipping auth check')
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        try {
          // Get current session instead of user to avoid auth errors
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.log('No active session:', sessionError.message)
            setUser(null)
            setProfile(null)
            setLoading(false)
            return
          }
          
          const user = session?.user || null
          
          setUser(user)
          
          if (user) {
            // Get user profile from profiles table
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()
              
              if (!profileError && profileData) {
                setProfile(profileData)
              }
            } catch (error) {
              console.log('Error fetching profile:', error)
              setProfile(null)
            }
          } else {
            setProfile(null)
          }
        } catch (fetchError) {
          console.log('Supabase fetch error (likely network/CORS):', fetchError)
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.log('Supabase connection error:', error)
        // If Supabase is not accessible, continue without auth
        setUser(null)
        setProfile(null)
      }
      
      setLoading(false)
    }

    getUser()

    // Only listen for auth changes if Supabase is configured
    let subscription: any = null
    if (isConfigured && supabase) {
      try {
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user || null)
          setProfile(null)
        })
        subscription = authSubscription
      } catch (error) {
        console.log('Error setting up auth listener:', error)
        subscription = null
      }
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">DisasterShield</span>
            </div>
            
            <nav className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Home
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Contact
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <NotificationBell />
                  <Link 
                    to={
                      profile?.role === 'admin' || user.user_metadata?.role === 'admin' ? '/admin' :
                      profile?.role === 'contractor' || user.user_metadata?.role === 'contractor' ? '/contractor/dashboard' : 
                      '/client/dashboard'
                    } 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      if (supabase) {
                        await supabase.auth.signOut();
                        navigate('/');
                      }
                    }}
                    className="text-gray-700 hover:text-red-600 border-gray-300 hover:border-red-300"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              From Disaster to Repair<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                in Minutes — Not Weeks
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Skip the paperwork maze. Our digital platform connects you with vetted contractors instantly, 
              generates professional claim packets, and gets repairs started fast.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user && profile?.role !== 'contractor' && profile?.role !== 'admin' ? (
                <Link to="/intake">
                  <Button size="lg" className="text-lg px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Start My Claim
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : !user ? (
                <Link to="/auth/login">
                  <Button size="lg" className="text-lg px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Sign In to File Claim
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : null}
              <Link to="/auth/signup?role=contractor">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-blue-700 transition-all duration-300">
                  Join as Contractor
                </Button>
              </Link>
            </div>
            {!user && (
              <div className="mt-6 text-center">
                <p className="text-blue-100 mb-2">Already have an account?</p>
                <div className="relative inline-block">
                  <span className="absolute -left-8 top-0 text-2xl text-yellow-400 animate-bounce">
                    →
                  </span>
                  <span className="absolute -right-8 top-0 text-2xl text-yellow-400 animate-bounce">
                    ←
                  </span>
                  <Link to="/auth/login" className="text-blue-100 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/10">
                    Sign In Here
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How DisasterShield Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our streamlined process gets you from disaster to repair faster than traditional methods
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1. File Your Claim</h3>
                <p className="text-gray-600">Complete our simple 5-minute intake form with photos and details about your damage.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Get Matched</h3>
                <p className="text-gray-600">Our system instantly matches you with qualified local contractors in your area.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Schedule Fast</h3>
                <p className="text-gray-600">Contractors respond within hours. Schedule inspections and get work started immediately.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Track Progress</h3>
                <p className="text-gray-600">Monitor your claim status, view professional packets, and manage payments all in one place.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Your Property Restored?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of homeowners who've streamlined their insurance claims with DisasterShield
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user && profile?.role !== 'contractor' && profile?.role !== 'admin' ? (
              <Link to="/intake">
                <Button size="lg" className="text-lg px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Start My Claim Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : !user ? (
              <Link to="/auth/login">
                <Button size="lg" className="text-lg px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Sign In to File Claim
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : user && (profile?.role === 'admin' || user.user_metadata?.role === 'admin') ? (
              <div className="text-center">
                <p className="text-blue-100 text-lg">
                  Admin users can access the admin portal
                </p>
                <Link to="/admin">
                  <Button size="lg" variant="outline" className="mt-4 text-lg px-10 py-4 border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-blue-700 transition-all duration-300">
                    Go to Admin Portal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-blue-100 text-lg">
                  Contractors can browse available jobs in their dashboard
                </p>
                <Link to="/contractor/dashboard">
                  <Button size="lg" variant="outline" className="mt-4 text-lg px-10 py-4 border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-blue-700 transition-all duration-300">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">DisasterShield</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The fastest way to connect homeowners with qualified contractors for insurance claims and disaster recovery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Contractors</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth/signup?role=contractor" className="hover:text-white transition-colors">Join Network</Link></li>
                <li><Link to="/contractor/dashboard" className="hover:text-white transition-colors">Contractor Portal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DisasterShield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}