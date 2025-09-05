# Setting up Email Service for DisasterShield

This document explains how to properly configure the email service for DisasterShield, which uses Resend for email delivery.

## Why We Use Supabase Edge Functions

We use a Supabase Edge Function to send emails instead of calling Resend's API directly from the browser. This is because:

1. **CORS Restrictions**: Resend's API doesn't allow direct browser requests due to CORS policies
2. **API Key Security**: We don't want to expose our Resend API key in client-side code
3. **Error Handling**: The Edge Function provides better error handling and logging

## Deployment Steps

### 1. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 2. Link Your Project (if not already linked)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy the Send-Email Function

```bash
supabase functions deploy send-email
```

### 4. Set Required Environment Variables

```bash
supabase secrets set RESEND_API_KEY=re_Qcxt7Bu3_QBRXTajV5CaY2TWC3UcwQXsb
supabase secrets set RESEND_FROM=onboarding@resend.dev
```

Optionally, if you want to mock emails in the Edge Function without actually sending them:

```bash
supabase secrets set MOCK_EMAIL_SERVICE=true
```

## Troubleshooting

If you're experiencing issues with the email service:

1. **Check Edge Function Logs**: 
   ```bash
   supabase functions logs send-email
   ```

2. **Verify Environment Variables**:
   ```bash
   supabase secrets list
   ```

3. **Test Edge Function Directly**:
   ```bash
   curl -X POST https://<your-project-id>.supabase.co/functions/v1/send-email \
     -H "Authorization: Bearer <your-anon-key>" \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","subject":"Test Email","html":"<p>This is a test</p>"}'
   ```

## Configuration in Frontend

The frontend is configured to use the Edge Function by default. The `USE_DIRECT_RESEND` option has been disabled because it causes CORS errors in browser environments.

If you need to modify this behavior, check `.env` file:

```
VITE_USE_DIRECT_RESEND=false  # Keep this false for browser environments
```

## Common Issues

### CORS Errors

If you see errors like:
```
Access to fetch at 'https://api.resend.com/emails' from origin 'http://localhost:5173' has been blocked by CORS policy
```

This means you're trying to call Resend's API directly from the browser, which isn't allowed. Make sure:
1. `VITE_USE_DIRECT_RESEND` is set to `false` in your `.env` file
2. The Supabase Edge Function is properly deployed

### Authorization Errors

If you see errors about authorization:
```
Failed to fetch: 401 Unauthorized
```

This means:
1. The user might not be logged in
2. The session token might be invalid
3. The Edge Function might not be properly configured with permissions
