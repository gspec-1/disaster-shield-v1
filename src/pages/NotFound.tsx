import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield, Home, ArrowLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import NotificationBell from '@/src/components/NotificationBell'

export default function NotFoundPage() {
  const location = useLocation()
  const isContractorRoute = location.pathname.startsWith('/contractor')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="flex justify-center mb-4">
          <NotificationBell userId={user?.id} />
        </div>
        <div className="mb-8">
          <Shield className="h-20 w-20 text-blue-600 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track with your claim.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button 
            variant="outline"
            onClick={() => window.history.back()}
            className="border-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {!isContractorRoute && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Need immediate help with a claim?</p>
            <Link to="/intake">
              <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                Start Emergency Claim
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}