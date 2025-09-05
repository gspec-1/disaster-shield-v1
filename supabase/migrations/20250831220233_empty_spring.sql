/*
  # Disable email confirmation for development

  This migration disables email confirmation to prevent the "Email not confirmed" error
  during development. In production, you may want to re-enable this for security.
*/

-- Note: Email confirmation settings are managed in Supabase Dashboard
-- Go to Authentication > Settings > Email Confirmation and toggle it off
-- This SQL migration serves as documentation of this configuration change