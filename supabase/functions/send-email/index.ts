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
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('VITE_RESEND_API_KEY')
    const resendFrom = Deno.env.get('RESEND_FROM') || Deno.env.get('VITE_RESEND_FROM')
    // Set to false to send real emails
    const mockMode = false
    
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

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html) {
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
    const { data, error } = await resend.emails.send({
      // Prefer explicit payload, then RESEND_FROM secret, then Resend onboarding sender
      from: emailData.from || resendFrom,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    if (error) {
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})