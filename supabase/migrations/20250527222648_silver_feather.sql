/*
  # Create Admin User

  1. Changes
    - Creates an admin user in auth.users table
    - Creates corresponding profile in public.profiles table
    - Uses safe insertion methods without relying on email uniqueness
*/

-- Create a function to create the admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert admin user into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) 
  SELECT 
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin","role":"admin"}'::jsonb,
    now(),
    now(),
    'authenticated',
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  );

  -- Create profile for admin user
  INSERT INTO public.profiles (id, email, role)
  SELECT new_user_id, 'admin@example.com', 'admin'
  WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE id = new_user_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'admin@example.com'
  );
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_admin_user();

-- Drop the function after use
DROP FUNCTION create_admin_user();