/*
# Auto-create Profile Trigger

Creates a database trigger that automatically creates a profile record whenever a new user is created in auth.users.
This eliminates race conditions and foreign key constraint violations that occur when trying to create profiles from the client side.

## Changes

1. **Function: handle_new_user()**
   - Extracts user metadata from auth.users
   - Creates corresponding profile record in public.profiles
   - Uses COALESCE for safe default values

2. **Trigger: on_auth_user_created**
   - Fires after INSERT on auth.users
   - Automatically calls handle_new_user() function
   - Ensures profile is created atomically with user creation

## Security

- Function runs with SECURITY DEFINER to bypass RLS
- Only creates profiles for newly inserted users
- Uses safe metadata extraction with fallbacks
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();