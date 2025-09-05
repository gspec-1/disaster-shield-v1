/*
# Debug and Fix Profile Creation for All User Types

Fixes the profile creation trigger and adds debugging to understand why profiles aren't being created for homeowners and business owners.

## Changes

1. **Enhanced handle_new_user() function**
   - Better logging and error handling
   - Explicit profile creation for ALL user roles
   - Debug output to track execution

2. **Profile creation verification**
   - Adds function to manually create missing profiles
   - Ensures all users get profiles regardless of role

## Security

- Function runs with SECURITY DEFINER to bypass RLS
- Creates profiles for all newly registered users
- Maintains data integrity and security
*/

-- Drop and recreate the function with enhanced debugging
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Enhanced logging for debugging
  RAISE LOG 'TRIGGER FIRED: Creating profile for user ID: %', NEW.id;
  RAISE LOG 'User email: %', NEW.email;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Extract role with better fallback logic
  DECLARE
    user_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner');
    user_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
    user_phone text := NEW.raw_user_meta_data->>'phone';
  BEGIN
    RAISE LOG 'Extracted role: %, name: %, phone: %', user_role, user_name, user_phone;
    
    -- Insert profile for the new user
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (NEW.id, user_role, user_name, user_phone);
    
    RAISE LOG 'SUCCESS: Profile created for user % with role %', NEW.id, user_role;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'FAILED to create profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Don't fail the user creation, just log the error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually fix missing profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    RAISE LOG 'Creating missing profile for user: %', user_record.id;
    
    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'role', 'homeowner'),
      COALESCE(user_record.raw_user_meta_data->>'full_name', SPLIT_PART(user_record.email, '@', 1)),
      user_record.raw_user_meta_data->>'phone'
    );
    
    RAISE LOG 'Created missing profile for user: %', user_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create any missing profiles
SELECT public.create_missing_profiles();