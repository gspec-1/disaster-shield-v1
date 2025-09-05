import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, Clock, AlertCircle } from 'lucide-react'
import { getUserSubscription } from '@/src/lib/stripe'
import { isConfigured } from '@/src/lib/supabase'

interface SubscriptionStatusProps {
  userId?: string
  showCard?: boolean
}

export default function SubscriptionStatus({ userId, showCard = false }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubscription = async () => {
      if (!userId || !isConfigured) {
        setLoading(false)
        return
      }

      try {
        const subscriptionData = await getUserSubscription()
        setSubscription(subscriptionData)
      } catch (error) {
        console.error('Error loading subscription:', error)
        setSubscription(null)
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [userId])

  if (!isConfigured || loading) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
      case 'unpaid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Crown className="h-4 w-4" />
      case 'trialing':
        return <Clock className="h-4 w-4" />
      case 'past_due':
      case 'canceled':
      case 'unpaid':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatPlanName = (status: string) => {
    if (!subscription || !subscription.subscription_status) {
      return 'One-Time Payment'
    }

    switch (status) {
      case 'active':
        return 'Premium Plan'
      case 'trialing':
        return 'Trial Period'
      case 'past_due':
        return 'Payment Due'
      case 'canceled':
        return 'Canceled'
      case 'unpaid':
        return 'Payment Failed'
      case 'not_started':
        return 'One-Time Payment'
      default:
        return 'One-Time Payment'
    }
  }

  const content = (
    <div className="flex items-center gap-2">
      <Badge className={`border-0 ${getStatusColor(subscription?.subscription_status || 'not_started')}`}>
        <span className="flex items-center gap-1">
          {getStatusIcon(subscription?.subscription_status || 'not_started')}
          {formatPlanName(subscription?.subscription_status || 'not_started')}
        </span>
      </Badge>
    </div>
  )

  if (showCard) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Plan</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPlanName(subscription?.subscription_status || 'not_started')}
              </p>
            </div>
            {getStatusIcon(subscription?.subscription_status || 'not_started')}
          </div>
          {subscription?.current_period_end && (
            <p className="text-sm text-gray-500 mt-2">
              {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} on{' '}
              {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
            </p>
          )}
          {!subscription && (
            <p className="text-sm text-gray-500 mt-2">
              Pay for services as you use them
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return content
}