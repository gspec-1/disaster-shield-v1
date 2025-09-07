/// <reference path="./shims.d.ts" />
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { Resend } from 'npm:resend@4.0.1'

/**
 * Email sending Edge Function for DisasterShield
 * 
 * IMPORTANT: This function needs to be deployed to Supabase with the following environment variables:
 * - RESEND_API_KEY: Your Resend API key (e.g., re_Qcxt7Bu3_QBRXTajV5CaY2TWC3UcwQXsb)
 * - RESEND_FROM: Email address to send from (e.g., onboarding@resend.dev)
 * - MOCK_EMAIL_SERVICE: Set to "true" to mock email sending without using Resend API
 * 
 * To deploy:
 * 1. Install Supabase CLI
 * 2. Run: supabase functions deploy send-email
 * 3. Set secrets: supabase secrets set RESEND_API_KEY=re_Qcxt7Bu3_QBRXTajV5CaY2TWC3UcwQXsb
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Edge Function started:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    })

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('VITE_RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM') || Deno.env.get('VITE_RESEND_FROM')
    // Set to false to send real emails
    const mockMode = false
    
    // Add a test mode for debugging
    const testMode = Deno.env.get('TEST_MODE') === 'true'
    
    // Add a debug mode that shows more details about Resend API calls
    const debugMode = Deno.env.get('DEBUG_MODE') === 'true'
    
    // Add a simple mode that just returns success without doing anything
    const simpleMode = Deno.env.get('SIMPLE_MODE') === 'true'
    
    console.log('📧 Environment check:', {
      hasResendApiKey: !!resendApiKey,
      hasResendFrom: !!resendFrom,
      mockMode,
      testMode,
      debugMode,
      simpleMode,
      apiKeyLength: resendApiKey?.length || 0
    })
    
    // If mock mode is enabled, pretend to send emails without Resend API
    if (mockMode) {
      console.log('MOCK MODE: Email would be sent:', await req.json())
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: `mock-${Date.now()}`,
          mock: true,
          message: 'Email mocked (not actually sent)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If test mode is enabled, return detailed info without sending
    if (testMode) {
      const emailData: EmailRequest = await req.json()
      console.log('TEST MODE: Email data analysis:', {
        to: emailData.to,
        subject: emailData.subject,
        htmlLength: emailData.html?.length || 0,
        hasFrom: !!emailData.from,
        memoryUsage: Deno.memoryUsage ? Deno.memoryUsage() : 'Not available'
      })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: `test-${Date.now()}`,
          test: true,
          message: 'Email analyzed in test mode (not sent)',
          analysis: {
            htmlLength: emailData.html?.length || 0,
            memoryUsage: Deno.memoryUsage ? Deno.memoryUsage() : 'Not available'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If simple mode is enabled, just return success without any processing
    if (simpleMode) {
      console.log('📧 SIMPLE MODE: Returning success without processing')
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: `simple-${Date.now()}`,
          simple: true,
          message: 'Email processed in simple mode (no actual sending)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY or VITE_RESEND_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          help: 'Set the RESEND_API_KEY environment variable in Supabase Edge Functions or enable MOCK_EMAIL_SERVICE=true' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const resend = new Resend(resendApiKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailData: EmailRequest = await req.json()
    
    console.log('📧 Email data received:', {
      to: emailData.to,
      subject: emailData.subject,
      htmlLength: emailData.html?.length || 0,
      hasFrom: !!emailData.from,
      memoryUsage: Deno.memoryUsage ? Deno.memoryUsage() : 'Not available'
    })
    
    // Check if HTML content is too large (potential memory issue)
    if (emailData.html && emailData.html.length > 100000) {
      console.warn('📧 Large HTML content detected:', emailData.html.length, 'characters')
    }

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
      console.error('📧 Validation failed:', {
        hasTo: !!emailData.to,
        hasSubject: !!emailData.subject,
        hasHtml: !!emailData.html
      })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Debug URLs in the email HTML
    if (emailData.html) {
      // Fix for localhost URLs in all links
      const productionUrl = 'https://disaster-shield-v2.vercel.app';
      const localUrlPattern = /(href=["'])(http:\/\/localhost:[0-9]+|http:\/\/127\.0\.0\.1:[0-9]+)/g;
      
      if (emailData.html.includes('localhost:') || emailData.html.includes('127.0.0.1:')) {
        console.log('EDGE FUNCTION - Found localhost URLs, replacing with:', productionUrl);
        emailData.html = emailData.html.replace(localUrlPattern, `$1${productionUrl}`);
        
        // Extract URLs after replacement for logging
        const acceptUrl = emailData.html.match(/href=["']([^"']*\/accept-job\/[^"']*)["']/)?.[1] || 'Not found';
        const declineUrl = emailData.html.match(/href=["']([^"']*\/decline-job\/[^"']*)["']/)?.[1] || 'Not found';
        
        console.log('EDGE FUNCTION - Email URLs after replacement:', {
          acceptUrl,
          declineUrl
        });
      }
    }
    
    // Send email via Resend
    console.log('📧 Attempting to send email via Resend...')
    
    // Add retry logic for Resend API calls
    let retryCount = 0
    const maxRetries = 2
    let lastError = null
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`📧 Resend attempt ${retryCount + 1}/${maxRetries + 1}`)
        
        const emailPayload = {
          // Prefer explicit payload, then RESEND_FROM secret, then Resend onboarding sender
          from: emailData.from || resendFrom,
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }
        
        if (debugMode) {
          console.log('📧 DEBUG: Resend API payload:', {
            from: emailPayload.from,
            to: emailPayload.to,
            subject: emailPayload.subject,
            htmlLength: emailPayload.html?.length || 0,
            hasText: !!emailPayload.text,
            apiKeyPrefix: resendApiKey?.substring(0, 10) + '...'
          })
        }
        
        const { data, error } = await resend.emails.send(emailPayload)
        
        if (error) {
          lastError = error
          console.error(`📧 Resend API error (attempt ${retryCount + 1}):`, {
            error,
            errorType: typeof error,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorName: error?.name
          })
          
          // If it's a rate limit error, wait before retrying
          if (error?.code === 'rate_limit_exceeded' && retryCount < maxRetries) {
            console.log('📧 Rate limit detected, waiting 3 seconds before retry...')
            await new Promise(resolve => setTimeout(resolve, 3000))
            retryCount++
            continue
          }
          
          // For other errors, don't retry
          return new Response(
            JSON.stringify({ error: 'Failed to send email', details: error }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        // Success!
        console.log('📧 Email sent successfully:', {
          id: data?.id,
          to: emailData.to,
          subject: emailData.subject,
          attempt: retryCount + 1
        })
        
        return new Response(
          JSON.stringify({ success: true, id: data?.id }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
        
      } catch (retryError) {
        lastError = retryError
        console.error(`📧 Resend exception (attempt ${retryCount + 1}):`, retryError)
        
        if (retryCount < maxRetries) {
          console.log('📧 Waiting 2 seconds before retry...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          retryCount++
          continue
        }
        
        // Max retries reached
        throw retryError
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('Max retries exceeded')

  } catch (error) {
    console.error('📧 Email function error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      errorType: typeof error,
      errorName: error instanceof Error ? error.name : 'Unknown'
    })
    
    // Check if it's a memory or timeout issue
    if (error instanceof Error) {
      if (error.message.includes('memory') || error.message.includes('timeout')) {
        console.error('📧 Possible memory/timeout issue detected')
      }
      if (error.message.includes('fetch')) {
        console.error('📧 Network/fetch issue detected')
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        errorType: typeof error
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})