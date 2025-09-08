import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { estimateId, projectId } = await req.json()

    if (!estimateId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the estimate details
    const { data: estimate, error: estimateError } = await supabase
      .from('contractor_estimates')
      .select(`
        *,
        contractors (
          company_name,
          contact_name
        ),
        projects (
          address,
          city,
          state
        )
      `)
      .eq('id', estimateId)
      .eq('status', 'accepted')
      .single()

    if (estimateError || !estimate) {
      return new Response(
        JSON.stringify({ error: 'Estimate not found or not accepted' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a unique product name and description
    const productName = `Repair Work - ${estimate.contractors.company_name}`
    const productDescription = `Repair work estimate by ${estimate.contractors.company_name} for ${estimate.projects.address}, ${estimate.projects.city}, ${estimate.projects.state}`

    // Create Stripe product
    const product = await stripe.products.create({
      name: productName,
      description: productDescription,
      metadata: {
        estimate_id: estimateId,
        project_id: projectId,
        contractor_id: estimate.contractor_id,
        type: 'repair_cost_estimate'
      }
    })

    // Create Stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: estimate.estimate_amount, // Amount in cents
      currency: 'usd',
      metadata: {
        estimate_id: estimateId,
        project_id: projectId,
        contractor_id: estimate.contractor_id
      }
    })

    // Update the estimate with Stripe product and price IDs
    const { error: updateError } = await supabase
      .from('contractor_estimates')
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id
      })
      .eq('id', estimateId)

    if (updateError) {
      console.error('Error updating estimate with Stripe IDs:', updateError)
      // Don't fail the whole process, but log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        productId: product.id,
        priceId: price.id,
        amount: estimate.estimate_amount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating dynamic product:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create dynamic product' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
