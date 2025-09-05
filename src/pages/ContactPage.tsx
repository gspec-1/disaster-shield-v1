import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Shield, Mail, Phone, MapPin } from 'lucide-react'
import { useEffect } from 'react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function ContactPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement contact form submission
    console.log('Contact form submitted:', formData)
  }

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
              <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                About
              </Link>
              <Link to="/contact" className="text-blue-600 font-medium">
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

      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about DisasterShield? We're here to help you navigate your disaster recovery needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">support@disastershield.com</p>
                      <p className="text-sm text-gray-500 mt-1">We typically respond within 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Phone</h3>
                      <p className="text-gray-600">1-800-DISASTER</p>
                      <p className="text-sm text-gray-500 mt-1">Available 24/7 for emergencies</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Headquarters</h3>
                      <p className="text-gray-600">
                        123 Innovation Drive<br />
                        Tampa, FL 33602
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Emergency Claims</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      For urgent claims requiring immediate attention, use our fast-track intake process.
                    </p>
                    {user && profile?.role !== 'contractor' && user.user_metadata?.role !== 'contractor' ? (
                      <Link to="/intake">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                          Start Emergency Claim
                        </Button>
                      </Link>
                    ) : !user ? (
                      <Link to="/auth/login">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                          Sign In to File Claim
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">
                        Contractors cannot file claims. Browse available jobs in your dashboard.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full"
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}