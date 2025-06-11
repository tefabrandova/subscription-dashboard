/*
  # Setup Admin User and Profile

  1. New Tables
    - Creates admin user in auth.users table
    - Creates corresponding profile in profiles table
  
  2. Changes
    - Adds initial admin user with encrypted password
    - Sets up admin profile with proper role
*/

-- Create a function to create the admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Insert admin user into auth.users
  INSERT INTO auth.users (
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
  ) VALUES (
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
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO admin_id;

  -- Create profile for admin user if one was created
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (admin_id, 'admin@example.com', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_admin_user();

-- Drop the function after use
DROP FUNCTION create_admin_user();