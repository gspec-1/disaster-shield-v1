/*
# Fix Profile Creation for All User Roles

Fixes the handle_new_user() trigger function to properly create profiles for all user types,
not just contractors. The current trigger is missing profiles for homeowners and business owners.

## Changes

1. **Update handle_new_user() function**
   - Ensure it creates profiles for ALL user roles
   - Use proper fallback values for role and full_name
   - Handle cases where metadata might be missing

## Security

- Function runs with SECURITY DEFINER to bypass RLS
- Creates profiles for all newly registered users
- Uses safe metadata extraction with proper fallbacks
*/

-- Drop and recreate the function to fix profile creation for all roles
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert profile for ALL new users, regardless of role
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();