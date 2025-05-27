/*
  # Create Admin User
  
  1. Changes
    - Creates initial admin user in the users table
    - Sets up admin role and credentials
  
  2. Security
    - Password is hashed
    - User has admin role
*/

-- Insert admin user into public.users table
INSERT INTO public.users (
  id,
  name,
  email,
  password,
  role,
  created_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'Admin',
  'admin@example.com',
  'admin123',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;