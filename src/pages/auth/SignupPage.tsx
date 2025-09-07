import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, User, Building, Mail, CheckCircle, ChevronLeft } from 'lucide-react'
import { supabase } from '@/src/lib/supabase'
import { SignupSchema, type SignupFormData } from '@/src/lib/validation'
import NotificationBell from '@/src/components/NotificationBell'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || 'homeowner'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: defaultRole as 'homeowner' | 'business_owner' | 'contractor' | 'admin'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '')
    
    // If it's a 10-digit US number, prepend +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    
    // If it already starts with 1 and is 11 digits, prepend +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    
    // If it already has + at the start, return as is
    if (value.startsWith('+')) {
      return value
    }
    // Otherwise return the cleaned input
    return cleaned
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      // Validate form data
      const validatedData = SignupSchema.parse(formData)

      // Check if email already exists in profiles table
      console.log('Checking if email exists:', validatedData.email)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', validatedData.email)
        .maybeSingle()

      console.log('Email check result:', { existingProfile, checkError })

      if (existingProfile) {
        setError('An account with this email address already exists. Please sign in instead.')
        setLoading(false)
        return
      }

      console.log('Attempting signup with email:', validatedData.email)

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.fullName,
            phone: validatedData.phone,
            role: validatedData.role,
          }
        }
      })

      console.log('Supabase signup result:', { authData, authError })

      if (authError) {
        console.log('Supabase auth error:', authError)
        throw authError
      }

      if (authData.user) {
        console.log('User created successfully, showing email confirmation')
        
        // Profile is automatically created by database trigger (handle_new_user)
        // No need to manually create profile here
        
        // Show email confirmation prompt
        setUserEmail(validatedData.email)
        setShowEmailConfirmation(true)
      } else {
        throw new Error('No user data returned from signup')
      }
    } catch (error: any) {
      console.log('Signup error caught:', error)
      // Handle Supabase auth errors
      if (error.errors) {
        // Handle Zod validation errors
        const errors: Record<string, string> = {}
        error.errors.forEach((err: any) => {
          if (err.path) {
            errors[err.path.join('.')] = err.message
          }
        })
        setFieldErrors(errors)
        setError('Please fix the errors below')
      } else if (error.message?.includes('already registered') ||
                 error.message?.includes('already been registered') ||
                 error.message?.includes('User already registered') ||
                 error.message?.includes('already exists') ||
                 error.code === 'user_already_exists') {
        setError('An account with this email address already exists. Please sign in instead.')
      } else if (error.message?.includes('User already registered') ||
                 error.message?.includes('already been registered') ||
                 error.message?.includes('already exists') ||
                 error.code === 'user_already_exists' ||
                 error.message?.includes('duplicate key value') ||
                 error.message?.includes('violates unique constraint')) {
        setError('An account with this email address already exists. Please sign in instead.')
      } else {
        setError(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div></div>
              <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Back</span>
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
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your account has been created for:
              </p>
              <p className="text-lg font-semibold text-blue-600 mb-6">
                {userEmail}
              </p>
              <p className="text-gray-600 mb-8">
                You can now sign in and start using DisasterShield. No email confirmation required!
              </p>
              
              <div className="space-y-4">
                <Link to="/auth/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sign In Now
                  </Button>
                </Link>
                
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Return Home
                  </Button>
                </Link>
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">Join our platform to get started</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.role === 'contractor' ? (
                <Building className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              Sign Up as {formData.role === 'contractor' ? 'Contractor' : 'Homeowner'}
            </CardTitle>
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
                  Account Type
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homeowner">Homeowner</SelectItem>
                    <SelectItem value="business_owner">Business Owner</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
                {fieldErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

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
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="+12345678900"
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                )}
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
                  placeholder="Create a password"
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}