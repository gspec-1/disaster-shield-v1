import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for access_token and refresh_token in URL params (from email link)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        
        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session from the URL parameters
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Error setting session:', error)
            setError('Invalid or expired reset link. Please request a new password reset.')
            setValidSession(false)
          } else if (data.session) {
            console.log('Valid reset session established')
            setValidSession(true)
          } else {
            setError('Invalid reset link. Please request a new password reset.')
            setValidSession(false)
          }
        } else {
          // Check if there's already a valid session
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setValidSession(true)
          } else {
            setError('No valid reset session found. Please request a new password reset.')
            setValidSession(false)
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        setError('Failed to verify reset link. Please try again.')
        setValidSession(false)
      }
      setCheckingSession(false)
    }

    checkSession()
  }, [searchParams])

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Shield className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
            </Link>
          </div>
          <Card className="shadow-lg">
            <CardContent className="pt-8 text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifying Reset Link...</h3>
              <p className="text-gray-600">Please wait while we verify your password reset request</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error if session is invalid
  if (!validSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Shield className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
            </Link>
          </div>
          <Card className="shadow-lg">
            <CardContent className="pt-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Invalid Reset Link</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link to="/auth/forgot-password">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth/login')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Shield className="h-10 w-10 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
            </Link>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h2>
              <p className="text-gray-600 mb-6">
                Your password has been updated successfully. You'll be redirected to the login page shortly.
              </p>
              <Link to="/auth/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <NotificationBell userId={currentUser?.id} />
            <div></div>
          </div>
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="mt-2 text-gray-600">Enter your new password below</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/auth/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}