/*
# Add Email Column to Profiles Table

Adds an email column to the profiles table to store user email addresses directly in the profile record.

## Changes

1. **profiles table**
   - Add `email` column (text, not null)
   - Populate existing records with email from auth.users
   - Update trigger function to include email in new profile creation

2. **Updated trigger function**
   - Modified handle_new_user() to include email when creating profiles
   - Ensures all new users get email stored in their profile

## Security

- Email column is populated from auth.users.email
- Maintains data consistency between auth and profile tables
- No additional RLS policies needed as existing policies cover the new column
*/

-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Populate existing profiles with email from auth.users
UPDATE profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
AND profiles.email IS NULL;

-- Make email column not null after populating existing records
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Update the trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Enhanced logging for debugging
  RAISE LOG 'TRIGGER FIRED: Creating profile for user ID: %', NEW.id;
  RAISE LOG 'User email: %', NEW.email;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Extract data with better fallback logic
  DECLARE
    user_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner');
    user_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    user_phone text := NEW.raw_user_meta_data->>'phone';
    user_email text := NEW.email;
  BEGIN
    RAISE LOG 'Extracted role: %, name: %, phone: %, email: %', user_role, user_name, user_phone, user_email;
    
    -- Insert profile for the new user including email
    INSERT INTO public.profiles (id, role, full_name, phone, email)
    VALUES (NEW.id, user_role, user_name, user_phone, user_email);
    
    RAISE LOG 'SUCCESS: Profile created for user % with role % and email %', NEW.id, user_role, user_email;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'FAILED to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Don't fail the user creation, just log the error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update any existing profiles that might be missing email
DO $$
BEGIN
  -- Create missing profiles for any auth users without profiles
  INSERT INTO public.profiles (id, role, full_name, phone, email)
  SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'role', 'homeowner'),
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    u.raw_user_meta_data->>'phone',
    u.email
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
  
  RAISE LOG 'Created missing profiles for users without profile records';
END $$;