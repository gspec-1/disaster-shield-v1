import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users, Clock, Award, ArrowRight, CheckCircle } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function AboutPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get user profile to check role
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          
          setProfile(profileData)
        } catch (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/95 backdrop-blur-sm">
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
              <Link to="/about" className="text-blue-600 font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Contact
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <NotificationBell />
                  <Link 
                    to={profile?.role === 'contractor' || user.user_metadata?.role === 'contractor' ? '/contractor/dashboard' : '/client/dashboard'} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Dashboard
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/');
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

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Revolutionizing Disaster Recovery
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            We're eliminating the weeks of delays, paperwork confusion, and contractor uncertainty 
            that plague traditional insurance claims. Our platform connects you with the right help instantly.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                When disaster strikes, time is everything. Water spreads, mold grows, and damage compounds 
                with every passing hour. Yet traditional claim processes can take weeks to connect 
                homeowners with qualified contractors.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                DisasterShield changes this. Our digital-first platform eliminates delays by instantly 
                matching verified contractors with urgent repair needs, generating professional documentation, 
                and streamlining the entire process from incident to resolution.
              </p>
              {user && profile?.role !== 'contractor' && user.user_metadata?.role !== 'contractor' ? (
                <Link to="/intake">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Experience the Difference
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : !user ? (
                <Link to="/auth/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Sign In to Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/contractor/dashboard">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">85% Faster</h3>
                  <p className="text-sm text-gray-600">Average time to contractor match vs traditional methods</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">500+ Contractors</h3>
                  <p className="text-sm text-gray-600">Verified professionals in our network</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">98% Satisfaction</h3>
                  <p className="text-sm text-gray-600">Customer approval rating</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">$2M+ Claims</h3>
                  <p className="text-sm text-gray-600">Successfully processed</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built on Trust & Speed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every contractor is vetted, every process is transparent, and every claim is handled with urgency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Network</h3>
              <p className="text-gray-600 leading-relaxed">
                Every contractor in our network is thoroughly vetted for licensing, insurance, 
                and track record. We only work with the best.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                What used to take weeks now happens in minutes. Our automated matching and 
                documentation saves precious time when every hour counts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Transparency</h3>
              <p className="text-gray-600 leading-relaxed">
                Track every step of your claim with real-time updates. Access your professional 
                documentation anytime, anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Experience the Future of Disaster Recovery?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join the platform that's changing how insurance claims get handled
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user && profile?.role !== 'contractor' && user.user_metadata?.role !== 'contractor' ? (
              <Link to="/intake">
                <Button size="lg" className="text-lg px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white">
                  Start Your Claim
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : !user ? (
              <Link to="/auth/login">
                <Button size="lg" className="text-lg px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white">
                  Sign In to File Claim
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/contractor/dashboard">
                <Button size="lg" className="text-lg px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-10 py-4 border-2 border-white/80 text-white bg-white/10 hover:bg-white hover:text-blue-700 transition-all duration-300">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}