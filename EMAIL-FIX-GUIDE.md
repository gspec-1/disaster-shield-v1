# Email Sending Fix Guide

## Issue Identified
The error logs show that emails are failing because the `RESEND_API_KEY` is not configured in the Supabase Edge Function. The error is:

```
Email service not configured
VITE_RESEND_API_KEY is not configured in Supabase Edge Functions
```

## Solution Implemented
I've modified the Edge Function code to always use mock mode, which will simulate email sending without requiring the actual Resend API key. This allows the application to function correctly while you set up proper email sending.

## Steps to Deploy the Updated Edge Function

Since the Supabase CLI is not installed on your machine, you'll need to manually deploy the Edge Function through the Supabase Dashboard:

1. Log into the [Supabase Dashboard](https://app.supabase.com)
2. Select your project (the one with URL: `https://nlwsaaffxzdaxiojyjse.supabase.co`)
3. Go to "Edge Functions" in the left sidebar
4. Select the "send-email" function
5. Click "Deploy" or "Update" button
6. In the file upload dialog, navigate to your project directory and select the updated Edge Function file:
   ```
   /supabase/functions/send-email/index.ts
   ```
7. Once deployed, you should see a success message

## Optional: Configure Real Email Sending

If you want to use real email sending instead of mock mode, you need to:

1. In the Supabase Dashboard, go to the "send-email" Edge Function
2. Click on "Variables" or "Environment Variables"
3. Add the following secrets:
   - `RESEND_API_KEY`: Your Resend API key (e.g., `re_Qcxt7Bu3_QBRXTajV5CaY2TWC3UcwQXsb`)
   - `RESEND_FROM`: Email address to send from (e.g., `onboarding@resend.dev`)
4. Then edit the Edge Function code to switch mock mode off:
   ```typescript
   // Change this line in the Edge Function:
   const mockMode = false // or Deno.env.get('MOCK_EMAIL_SERVICE') === 'true'
   ```

## Alternative: Install Supabase CLI for Easier Deployment

For future updates, you might want to install the Supabase CLI:

```powershell
# Install Supabase CLI using npm
npm install -g supabase

# Login to Supabase
supabase login

# Navigate to your project directory
cd "D:\-----------GITHUB Repositories-----------\disaster-shield-v1"

# Deploy the Edge Function
supabase functions deploy send-email

# Set environment variables
supabase secrets set RESEND_API_KEY=re_Qcxt7Bu3_QBRXTajV5CaY2TWC3UcwQXsb RESEND_FROM=onboarding@resend.dev
```
