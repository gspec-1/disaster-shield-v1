/// <reference path="./shims.d.ts" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Get Stripe secret key - use test key by default for development
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || 
                    'sk_test_51RmEVUGYzYF1t9AdlA8XyZislc8Hk1vTjzl31CA1Xa1c29Yx6F7q5OAeauYzXB1jEjpfTQK5yXTKnpt8wp1E9vic00A7jrZsOi';

console.log('Stripe TEST configuration:', {
  hasStripeSecret: !!stripeSecret,
  keyType: 'TEST MODE ONLY'
});

const stripe = new Stripe(stripeSecret!, {
  apiVersion: '2024-06-20',
  appInfo: {
    name: 'DisasterShield',
    version: '1.0.0',
  },
});

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', {
        price_id: requestData.price_id,
        mode: requestData.mode,
        hasSuccessUrl: !!requestData.success_url,
        hasCancelUrl: !!requestData.cancel_url
      });
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { price_id, success_url, cancel_url, mode, project_id, product_id } = requestData;

    // Validate required parameters
    if (!price_id || !success_url || !cancel_url || !mode || !project_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          required: ['price_id', 'success_url', 'cancel_url', 'mode', 'project_id']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }


    // Validate mode
    if (!['payment', 'subscription'].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Must be "payment" or "subscription"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      console.error('User authentication failed:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Verify the price exists in Stripe
    try {
      const price = await stripe.prices.retrieve(price_id);
      console.log('Price verified:', {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        active: price.active
      });

      if (!price.active) {
        return new Response(
          JSON.stringify({ error: 'Price is not active' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (priceError) {
      console.error('Price validation failed:', priceError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid price ID',
          details: priceError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create Stripe customer
    let customerId;
    
    // Check for existing customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      // Verify customer exists in current Stripe mode
      try {
        await stripe.customers.retrieve(existingCustomer.customer_id);
        customerId = existingCustomer.customer_id;
        console.log('Using existing customer:', customerId);
      } catch (customerError) {
        console.log('Existing customer not found in current mode, will create new one');
        // Delete invalid customer record
        await supabase
          .from('stripe_customers')
          .delete()
          .eq('user_id', user.id);
      }
    }

    // Create new customer if needed
    if (!customerId) {
      try {
        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
            source: 'disastershield'
          },
        });

        console.log('Created new Stripe customer:', newCustomer.id);

        // Save customer to database
        const { error: saveError } = await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            customer_id: newCustomer.id,
          });

        if (saveError) {
          console.error('Failed to save customer to database:', saveError);
          // Try to clean up the Stripe customer
          try {
            await stripe.customers.del(newCustomer.id);
          } catch (deleteError) {
            console.error('Failed to clean up Stripe customer:', deleteError);
          }
          
          return new Response(
            JSON.stringify({ error: 'Failed to create customer record' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        customerId = newCustomer.id;
      } catch (stripeError) {
        console.error('Failed to create Stripe customer:', stripeError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create customer',
            details: stripeError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // CRITICAL: Check for duplicate payments before creating checkout session
    if (mode === 'payment') {
      // Check if this user has already completed a payment for this product and project
      const { data: existingOrders, error: existingOrdersError } = await supabase
        .from('stripe_orders')
        .select('id, status')
        .eq('customer_id', customerId)
        .eq('project_id', project_id)
        .eq('product_id', product_id)
        .eq('status', 'completed');

      if (existingOrdersError) {
        console.error('Error checking for existing orders:', existingOrdersError);
      } else if (existingOrders && existingOrders.length > 0) {
        console.log(`Duplicate payment attempt blocked for user ${user.id}, project ${project_id}, product ${product_id}`);
        return new Response(
          JSON.stringify({ 
            error: 'Payment already completed', 
            message: 'This payment has already been completed for this project. Please refresh the page to see updated status.' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create checkout session
    try {
      console.log('Creating checkout session with:', {
        customer: customerId,
        price_id,
        mode,
        success_url: success_url.substring(0, 50) + '...',
        cancel_url: cancel_url.substring(0, 50) + '...'
      });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: mode as 'payment' | 'subscription',
        success_url,
        cancel_url,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        // Add these settings to fix environment issues
        ui_mode: 'hosted',
        automatic_tax: { enabled: false },
        tax_id_collection: { enabled: false },
        phone_number_collection: { enabled: false },
        custom_text: {
          submit: {
            message: 'Complete your payment to proceed with your DisasterShield claim.'
          }
        },
        metadata: {
          project_id: project_id,
          user_id: user.id,
          product_id: product_id
        },
        ...(mode === 'payment' && {
          payment_intent_data: {
            metadata: {
              user_id: user.id,
              project_id: project_id,
              product_id: product_id,
              source: 'disastershield'
            }
          }
        }),
        ...(mode === 'subscription' && {
          subscription_data: {
            metadata: {
              user_id: user.id,
              source: 'disastershield'
            }
          }
        })
      });

      console.log('Checkout session created successfully:', {
        id: session.id,
        url: session.url ? 'Generated' : 'Missing',
        status: session.status
      });

      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          url: session.url 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (sessionError) {
      console.error('Failed to create checkout session:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: sessionError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in checkout function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});