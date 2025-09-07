import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield, ChevronLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'

import { useEffect } from 'react'
export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (data.user) {
        // Get user role from profile table first, fallback to metadata
        let userRole = 'homeowner'
        
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle()
          
          if (profileData) {
            userRole = profileData.role
          } else {
            // Fallback to metadata if profile doesn't exist
            userRole = data.user.user_metadata?.role || 'homeowner'
          }
        } catch (error) {
          console.log('Error fetching profile role, using metadata fallback')
          userRole = data.user.user_metadata?.role || 'homeowner'
        }

        // Redirect based on role
        if (userRole === 'admin') {
          navigate('/admin')
        } else if (userRole === 'contractor') {
          navigate('/contractor/dashboard')
        } else {
          navigate('/client/dashboard')
        }
      }
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed') || 
          error.code === 'email_not_confirmed' ||
          error.message?.includes('email_not_confirmed') ||
          error.message?.includes('confirm your email')) {
        setError('Please check your email and click the confirmation link to verify your account before signing in.')
      } else {
        setError(error.message || 'Failed to sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Shield className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
            </Link>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-gray-600">Welcome back</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}