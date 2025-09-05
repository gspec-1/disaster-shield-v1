import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield, Mail, ArrowLeft, CheckCircle, ChevronLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import NotificationBell from '@/src/components/NotificationBell'
import { env } from '@/src/lib/env'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.APP_URL || window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div></div>
              <Link to="/auth/login" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back to Sign In</span>
              </Link>
              <div></div>
            </div>
            <div className="text-center">
              <Link to="/" className="inline-flex items-center space-x-2">
                <Shield className="h-10 w-10 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
              </Link>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to:
              </p>
              <p className="text-lg font-semibold text-blue-600 mb-6">
                {email}
              </p>
              <p className="text-gray-600 mb-8">
                Click the link in your email to reset your password. The link will expire in 1 hour.
              </p>
              
              <div className="space-y-4">
                <Link to="/auth/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Didn't receive the email?</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEmailSent(false)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
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
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DisasterShield</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-gray-600">Enter your email to receive a reset link</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/auth/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium inline-flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}