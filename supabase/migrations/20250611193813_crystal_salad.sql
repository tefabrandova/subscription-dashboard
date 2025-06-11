/*
  # Complete Database Reset and Setup

  1. Clean Slate
    - Drop all existing policies, triggers, and functions
    - Recreate all tables with proper structure
    - Set up clean RLS policies
    - Create proper triggers and functions

  2. Tables Created
    - profiles (user profiles)
    - accounts (subscription/purchase accounts)
    - packages (service packages)
    - customers (customer information)
    - subscriptions (customer subscriptions)
    - expenses (business expenses)
    - activity_logs (system activity tracking)
    - notifications (system notifications)
    - workspace_settings (app settings)
    - subscription_plans (pricing plans)
    - users (local user management)

  3. Security
    - Enable RLS on all tables
    - Create appropriate policies for data access
    - Set up user profile creation trigger
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ALL existing policies on ALL tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts CASCADE;
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages CASCADE;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers CASCADE;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions CASCADE;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses CASCADE;
DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON workspace_settings CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create tables (using CREATE TABLE IF NOT EXISTS to be safe)

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('subscription', 'purchase')),
  name text NOT NULL,
  details jsonb DEFAULT '[]'::jsonb,
  subscription_date timestamptz NOT NULL,
  expiry_date timestamptz NOT NULL,
  price jsonb NOT NULL,
  linked_packages integer DEFAULT 0,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('subscription', 'purchase')),
  name text NOT NULL,
  details jsonb DEFAULT '[]'::jsonb,
  price jsonb NOT NULL,
  subscribed_customers integer DEFAULT 0,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  package_id uuid NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  duration integer NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'sold')),
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date timestamptz NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  object_name text NOT NULL,
  details text NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('account_expiry', 'package_expiry', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  user_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Workspace settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo text,
  theme_color text DEFAULT '#8a246c',
  updated_at timestamptz DEFAULT now()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  features text[] NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Users table for local authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_account_id ON packages(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_object_id ON activity_logs(object_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@example.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create RLS policies

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO public USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO public USING (auth.uid() = id);

-- Accounts policies
CREATE POLICY "accounts_select_authenticated" ON accounts FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "accounts_insert_authenticated" ON accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "accounts_update_authenticated" ON accounts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "accounts_delete_authenticated" ON accounts FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "accounts_read_policy" ON accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_policy" ON accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update_policy" ON accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete_policy" ON accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Packages policies
CREATE POLICY "packages_select_authenticated" ON packages FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "packages_insert_authenticated" ON packages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "packages_update_authenticated" ON packages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "packages_delete_authenticated" ON packages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "packages_read_policy" ON packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "packages_all_policy" ON packages FOR ALL TO authenticated USING (true);

-- Customers policies
CREATE POLICY "customers_select_authenticated" ON customers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_insert_authenticated" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_update_authenticated" ON customers FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "customers_delete_authenticated" ON customers FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "customers_read_policy" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers_all_policy" ON customers FOR ALL TO authenticated USING (true);

-- Subscriptions policies
CREATE POLICY "subscriptions_select_authenticated" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "subscriptions_insert_authenticated" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "subscriptions_update_authenticated" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "subscriptions_delete_authenticated" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "subscriptions_read_policy" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "subscriptions_all_policy" ON subscriptions FOR ALL TO authenticated USING (true);

-- Expenses policies
CREATE POLICY "expenses_select_authenticated" ON expenses FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "expenses_insert_authenticated" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "expenses_update_authenticated" ON expenses FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "expenses_delete_authenticated" ON expenses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "expenses_manage_own" ON expenses FOR ALL TO public USING (auth.uid() = user_id);

-- Activity logs policies
CREATE POLICY "activity_logs_select_authenticated" ON activity_logs FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "activity_logs_read_policy" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_logs_insert_policy" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "activity_logs_read_own" ON activity_logs FOR SELECT TO public USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_all_own" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_system_insert" ON notifications FOR INSERT TO public WITH CHECK (true);

-- Workspace settings policies
CREATE POLICY "workspace_settings_read_all" ON workspace_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "workspace_settings_admin_manage" ON workspace_settings FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Subscription plans policies
CREATE POLICY "subscription_plans_read_all" ON subscription_plans FOR SELECT TO public USING (true);

-- Users policies
CREATE POLICY "users_read_own" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workspace settings
INSERT INTO workspace_settings (id, theme_color) 
VALUES (uuid_generate_v4(), '#8a246c')
ON CONFLICT DO NOTHING;