# Email Troubleshooting Guide

## Common Issues

### Emails showing as "mocked" in console logs

If you see messages like:
```
📧 Email MOCKED by Edge Function: {success: true, id: 'mock-1756837211307', mock: true, message: 'Email mocked (not actually sent)'}
```

This means the Supabase Edge Function is running in mock mode. To fix this:

1. Deploy the updated Edge Function:
   ```bash
   npm run deploy:email-function
   ```

2. Configure it to use real emails:
   ```bash
   npm run set:email-real
   ```

3. Verify the settings:
   ```bash
   supabase secrets list
   ```
   
   You should see `MOCK_EMAIL_SERVICE=false` in the output.

### 406 Not Acceptable Errors

If you see 406 errors like:
```
GET https://nlwsaaffxzdaxiojyjse.supabase.co/rest/v1/contractors?select=id&user_id=eq.c6ad13ba-e01a-4929-8497-75a4d679220e 406 (Not Acceptable)
```

This usually indicates an issue with the Supabase API request headers. Make sure:

1. Your Supabase client is configured correctly
2. The `apikey` header is included in requests
3. The authentication token is valid

## Testing Email Functionality

To test if emails are working correctly:

1. Use the IntakePage form to submit a new project
2. Check the console logs for email sending attempts
3. If mock mode is disabled, real emails should be sent to the addresses

## Switching Between Mock and Real Emails

During development, you may want to use mock emails to avoid sending real emails:

```bash
# Enable mock mode
npm run set:email-mock
```

For production or testing with real emails:

```bash
# Disable mock mode
npm run set:email-real
```

## Viewing Edge Function Logs

To see detailed logs from the email sending function:

```bash
supabase functions logs send-email
```

This will show you requests, errors, and whether emails are being mocked or actually sent.
