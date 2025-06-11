-- Subscription Management System Database Schema
-- PostgreSQL Version for Supabase

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('subscription', 'purchase');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'sold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('account_expiry', 'package_expiry', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT NULL
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type account_type NOT NULL,
  name varchar(255) NOT NULL,
  details jsonb DEFAULT NULL,
  subscription_date date NOT NULL,
  expiry_date date NOT NULL,
  price jsonb DEFAULT NULL,
  linked_packages integer DEFAULT 0,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  type account_type NOT NULL,
  name varchar(255) NOT NULL,
  details jsonb DEFAULT NULL,
  price jsonb DEFAULT NULL,
  subscribed_customers integer DEFAULT 0,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255) DEFAULT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  package_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration integer NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category varchar(255) NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type varchar(50) NOT NULL,
  object_type varchar(50) NOT NULL,
  object_id varchar(50) NOT NULL,
  object_name varchar(255) NOT NULL,
  details text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  user_id uuid NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create workspace_settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo text DEFAULT NULL,
  theme_color varchar(7) DEFAULT '#8a246c',
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_packages_account_id ON packages(account_id);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_object_type ON activity_logs(object_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for accounts
CREATE POLICY "accounts_insert_authenticated" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "accounts_select_authenticated" ON accounts
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "accounts_update_authenticated" ON accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "accounts_delete_authenticated" ON accounts
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for packages
CREATE POLICY "packages_insert_authenticated" ON packages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "packages_select_authenticated" ON packages
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "packages_update_authenticated" ON packages
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "packages_delete_authenticated" ON packages
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for customers
CREATE POLICY "customers_insert_authenticated" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_select_authenticated" ON customers
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_update_authenticated" ON customers
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_delete_authenticated" ON customers
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for subscriptions
CREATE POLICY "subscriptions_insert_authenticated" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "subscriptions_select_authenticated" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "subscriptions_update_authenticated" ON subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "subscriptions_delete_authenticated" ON subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for expenses
CREATE POLICY "expenses_insert_authenticated" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_select_authenticated" ON expenses
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_update_authenticated" ON expenses
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_delete_authenticated" ON expenses
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for activity_logs
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_authenticated" ON activity_logs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for notifications
CREATE POLICY "notifications_insert_authenticated" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_select_authenticated" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update_authenticated" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_delete_authenticated" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Insert default workspace settings
INSERT INTO workspace_settings (id, theme_color) VALUES
('00000000-0000-0000-0000-000000000001', '#8a246c')
ON CONFLICT (id) DO UPDATE SET 
theme_color = EXCLUDED.theme_color;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();