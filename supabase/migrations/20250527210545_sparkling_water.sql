/*
  # Initial Schema Setup

  1. New Tables
    - subscription_plans: Stores available subscription plans
    - accounts: Manages user accounts and their types
    - packages: Stores package information linked to accounts
    - customers: Stores customer information
    - subscriptions: Manages customer subscriptions to packages
    - expenses: Tracks business expenses
    - activity_logs: Logs system activities
    - users: Stores user information
    - notifications: Manages system notifications
    - workspace_settings: Stores workspace configuration

  2. Security
    - Enables RLS on all tables
    - Sets up appropriate policies for each table
    - Implements updated_at triggers
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscription_plans table
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

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('subscription', 'purchase')),
  name text NOT NULL,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  subscription_date timestamptz NOT NULL,
  expiry_date timestamptz NOT NULL,
  price jsonb NOT NULL,
  linked_packages integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid DEFAULT auth.uid()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('subscription', 'purchase')),
  name text NOT NULL,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  price jsonb NOT NULL,
  subscribed_customers integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  duration integer NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'sold')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  object_name text NOT NULL,
  details text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('account_expiry', 'package_expiry', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create workspace_settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo text,
  theme_color text DEFAULT '#8a246c',
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$ 
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
  DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
  DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
  DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
  DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON workspace_settings;
  
  -- Create new triggers
  CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Drop existing policies
DO $$ 
BEGIN
  -- Drop all existing policies for each table
  DROP POLICY IF EXISTS "Allow public read access" ON subscription_plans;
  DROP POLICY IF EXISTS "Users can read own accounts" ON accounts;
  DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
  DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
  DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
  DROP POLICY IF EXISTS "Users can read packages" ON packages;
  DROP POLICY IF EXISTS "Users can manage packages" ON packages;
  DROP POLICY IF EXISTS "Users can read customers" ON customers;
  DROP POLICY IF EXISTS "Users can manage customers" ON customers;
  DROP POLICY IF EXISTS "Users can read subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can manage subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can read activity logs" ON activity_logs;
  DROP POLICY IF EXISTS "Users can create activity logs" ON activity_logs;
  DROP POLICY IF EXISTS "Users can read own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
  DROP POLICY IF EXISTS "Anyone can read workspace settings" ON workspace_settings;
  DROP POLICY IF EXISTS "Only admins can modify workspace settings" ON workspace_settings;
END $$;

-- Create new policies
DO $$ 
BEGIN
  -- subscription_plans policies
  CREATE POLICY "subscription_plans_read_policy" ON subscription_plans
    FOR SELECT TO public USING (true);

  -- accounts policies
  CREATE POLICY "accounts_read_policy" ON accounts
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "accounts_insert_policy" ON accounts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "accounts_update_policy" ON accounts
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "accounts_delete_policy" ON accounts
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

  -- packages policies
  CREATE POLICY "packages_read_policy" ON packages
    FOR SELECT TO authenticated USING (true);
  CREATE POLICY "packages_all_policy" ON packages
    FOR ALL TO authenticated USING (true);

  -- customers policies
  CREATE POLICY "customers_read_policy" ON customers
    FOR SELECT TO authenticated USING (true);
  CREATE POLICY "customers_all_policy" ON customers
    FOR ALL TO authenticated USING (true);

  -- subscriptions policies
  CREATE POLICY "subscriptions_read_policy" ON subscriptions
    FOR SELECT TO authenticated USING (true);
  CREATE POLICY "subscriptions_all_policy" ON subscriptions
    FOR ALL TO authenticated USING (true);

  -- activity_logs policies
  CREATE POLICY "activity_logs_read_policy" ON activity_logs
    FOR SELECT TO authenticated USING (true);
  CREATE POLICY "activity_logs_insert_policy" ON activity_logs
    FOR INSERT TO authenticated WITH CHECK (true);

  -- users policies
  CREATE POLICY "users_read_policy" ON users
    FOR SELECT TO authenticated USING (auth.uid() = id);
  CREATE POLICY "users_update_policy" ON users
    FOR UPDATE TO authenticated USING (auth.uid() = id);

  -- notifications policies
  CREATE POLICY "notifications_read_policy" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());
  CREATE POLICY "notifications_all_policy" ON notifications
    FOR ALL TO authenticated USING (user_id = auth.uid());

  -- workspace_settings policies
  CREATE POLICY "workspace_settings_read_policy" ON workspace_settings
    FOR SELECT TO authenticated USING (true);
  CREATE POLICY "workspace_settings_admin_policy" ON workspace_settings
    FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
    );
END $$;