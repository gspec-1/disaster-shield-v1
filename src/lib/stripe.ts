import { STRIPE_PRODUCTS, type ProductKey } from '@/src/stripe-config'
import { supabase } from '@/src/lib/supabase'
import { env } from '@/src/lib/env'

export interface CreateCheckoutSessionData {
  productKey: ProductKey
  successUrl: string
  cancelUrl: string
  projectId: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  url?: string
  message?: string
  error?: string
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string
}

export async function createCheckoutSession(data: CreateCheckoutSessionData): Promise<CheckoutSessionResult> {
  try {
    const product = STRIPE_PRODUCTS[data.productKey]
    
    console.log(`Creating checkout session for product: ${product.name} (${product.priceId})`)
    console.log(`Product mode: ${product.mode}, Stripe mode: TEST`)
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    console.log(`Making request to Stripe checkout endpoint with price_id: ${product.priceId}`)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          project_id: data.projectId,
          product_id: data.productKey,
        }),
      })

      // Attempt to parse response as text first
      const responseText = await response.text()
      console.log('Response from checkout endpoint:', responseText)
      
      let jsonResponse: CheckoutSessionResponse
      
      try {
        jsonResponse = JSON.parse(responseText)
      } catch (e) {
        console.error('Response is not valid JSON:', responseText)
        throw new Error('Invalid response from payment server')
      }
      
      if (!response.ok) {
        console.error('Stripe checkout error:', jsonResponse)
        throw new Error(jsonResponse.message || jsonResponse.error || 'Failed to create checkout session')
      }

      const { sessionId, url } = jsonResponse
      console.log(`Successfully created Stripe checkout session: ${sessionId}`)
      
      if (!url) {
        throw new Error('No checkout URL returned from server')
      }
      
      console.log(`Checkout URL provided by server: ${url}`)
      
      return { sessionId, url }
    } catch (fetchError: any) {
      console.error('Fetch error creating checkout session:', fetchError)
      if (fetchError.message && fetchError.message.includes('NetworkError')) {
        throw new Error('Network error connecting to payment server. Please check your internet connection.')
      }
      throw fetchError
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function redirectToCheckout(checkoutUrl: string) {
  console.log(`Redirecting to Stripe checkout URL: ${checkoutUrl}`)
  
  try {
    // Get the current environment
    const isIframe = window !== window.top
    const isDevelopment = window.location.hostname === 'localhost'
    const isVercel = window.location.hostname.includes('vercel.app')
    
    console.log('Environment check:', { isIframe, isDevelopment, isVercel })
    
    // For iframe environments (like Bolt preview), use _top to break out
    if (isIframe) {
      console.log('Iframe detected - using window.top for redirect')
      window.top!.location.href = checkoutUrl
      return
    }
    
    // For standalone environments, use direct redirect
    console.log(`Redirecting to: ${checkoutUrl}`)
    
    window.location.href = checkoutUrl
  } catch (error: any) {
    console.error('Checkout redirect failed:', error)
    throw new Error('Failed to redirect to checkout')
  }
}

// Get user's current subscription status
export async function getUserSubscription() {
  try {
    // First get the user's Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle()

    if (customerError) {
      console.error('Error fetching customer data:', customerError)
      return null
    }

    if (!customerData) {
      console.log('No Stripe customer found for user')
      return null
    }

    // Then get subscription for this customer
    const { data, error } = await supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('customer_id', customerData.customer_id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}

// Get user's order history for a specific project
export async function getUserOrders(projectId?: string) {
  try {
    // First get the user's Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle()

    if (customerError) {
      console.error('Error fetching customer data:', customerError)
      return []
    }

    if (!customerData) {
      console.log('No Stripe customer found for user')
      return []
    }

    // Then get orders for this customer (and optionally for a specific project)
    let query = supabase
      .from('stripe_orders')
      .select('*')
      .eq('customer_id', customerData.customer_id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}