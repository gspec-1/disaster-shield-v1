/*
# Enable Email Confirmation

Enables email confirmation for new user signups to ensure users verify their email addresses before accessing the platform.

## Changes

1. **Email Confirmation Settings**
   - Enables email confirmation requirement for new signups
   - Users must click confirmation link in email before they can sign in
   - Prevents unverified accounts from accessing the platform

## Security

- Ensures all users have verified email addresses
- Prevents spam accounts and improves data quality
- Required for production security standards
*/

-- Enable email confirmation for new signups
-- Note: This setting is typically configured in Supabase Dashboard
-- Go to Authentication > Settings > Email Confirmation and enable it
-- This migration serves as documentation of this configuration requirement

-- The actual email confirmation setting must be enabled in the Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Find "Enable email confirmations" 
-- 3. Toggle it ON
-- 4. Save the settings

-- This ensures users must verify their email before they can sign in