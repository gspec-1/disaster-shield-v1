@echo off
echo This script will deploy the email function to Supabase

set /p token=Enter your Supabase access token: 
set SUPABASE_ACCESS_TOKEN=%token%

echo Deploying email function...
supabase functions deploy send-email

echo Done! Your email function is now deployed with mock mode disabled.
echo Emails will now be sent for real instead of being mocked.
