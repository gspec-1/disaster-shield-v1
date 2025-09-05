/**
 * Environment variable access that works in both Vite and Vercel environments
 * 
 * This provides a unified interface for accessing environment variables
 * regardless of how the application is being built or deployed.
 */

// Helper function to safely access import.meta.env
function getMetaEnv(key: string): string | undefined {
  try {
    return (import.meta.env as any)[key];
  } catch (e) {
    return undefined;
  }
}

// Create environment object that tries different sources
export const env = {

  // Supabase Configuration
  SUPABASE_URL: getMetaEnv('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getMetaEnv('VITE_SUPABASE_ANON_KEY'),
  
  // Email Configuration (Resend)
  RESEND_API_KEY: getMetaEnv('VITE_RESEND_API_KEY'),
  RESEND_FROM: getMetaEnv('VITE_RESEND_FROM'),
  USE_DIRECT_RESEND: getMetaEnv('VITE_USE_DIRECT_RESEND') === 'true',
  FORCE_REAL_EMAILS: getMetaEnv('VITE_FORCE_REAL_EMAILS') === 'true',
  
  // Stripe Configuration - TEST MODE ONLY
  STRIPE_PUBLISHABLE_KEY: getMetaEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
  
  // App Configuration
  APP_URL: getMetaEnv('VITE_APP_URL') || (typeof window !== 'undefined' ? window.location.origin : 'https://disaster-shield-v2.vercel.app'),
  
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: getMetaEnv('VITE_TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getMetaEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: getMetaEnv('TWILIO_PHONE_NUMBER'),
};
