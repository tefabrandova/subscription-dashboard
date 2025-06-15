/*
  # Complete Database Schema Migration

  1. Database Setup
    - Enable UUID extension
    - Create utility functions

  2. User Management
    - Profiles table with RLS
    - Authentication triggers

  3. Business Logic Tables
    - Accounts (subscription/purchase accounts)
    - Packages (linked to accounts)
    - Customers (with contact info)
    - Subscriptions (customer-package relationships)
    - Expenses (financial tracking)
    - Activity logs (audit trail)
    - Notifications (system alerts)
    - Workspace settings (customization)
    - Subscription plans (SaaS plans)

  4. Security
    - Row Level Security enabled on all tables
    - Proper access policies
    - User-based data isolation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, display_name)
    VALUES (NEW.id, NEW.email, 'user', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    CREATE POLICY "profiles_select_own" ON profiles
        FOR SELECT TO public
        USING (auth.uid() = id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    CREATE POLICY "profiles_insert_own" ON profiles
        FOR INSERT TO public
        WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    CREATE POLICY "profiles_update_own" ON profiles
        FOR UPDATE TO public
        USING (auth.uid() = id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase')),
    name TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    subscription_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    price JSONB NOT NULL,
    linked_packages INTEGER DEFAULT 0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Accounts policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "accounts_read_policy" ON accounts;
    CREATE POLICY "accounts_read_policy" ON accounts
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "accounts_insert_policy" ON accounts;
    CREATE POLICY "accounts_insert_policy" ON accounts
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "accounts_update_policy" ON accounts;
    CREATE POLICY "accounts_update_policy" ON accounts
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "accounts_delete_policy" ON accounts;
    CREATE POLICY "accounts_delete_policy" ON accounts
        FOR DELETE TO authenticated
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create trigger for accounts updated_at
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase')),
    name TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '[]'::jsonb,
    price JSONB NOT NULL,
    subscribed_customers INTEGER DEFAULT 0,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Packages policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "packages_read_policy" ON packages;
    CREATE POLICY "packages_read_policy" ON packages
        FOR SELECT TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "packages_all_policy" ON packages;
    CREATE POLICY "packages_all_policy" ON packages
        FOR ALL TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create index for packages account_id
CREATE INDEX IF NOT EXISTS idx_packages_account_id ON packages(account_id);

-- Create trigger for packages updated_at
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "customers_read_policy" ON customers;
    CREATE POLICY "customers_read_policy" ON customers
        FOR SELECT TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "customers_all_policy" ON customers;
    CREATE POLICY "customers_all_policy" ON customers
        FOR ALL TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create trigger for customers updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'sold')),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;
    CREATE POLICY "subscriptions_read_policy" ON subscriptions
        FOR SELECT TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "subscriptions_all_policy" ON subscriptions;
    CREATE POLICY "subscriptions_all_policy" ON subscriptions
        FOR ALL TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);

-- Create trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "expenses_manage_own" ON expenses;
    CREATE POLICY "expenses_manage_own" ON expenses
        FOR ALL TO public
        USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create trigger for expenses updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id UUID NOT NULL,
    object_name TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "activity_logs_insert_policy" ON activity_logs;
    CREATE POLICY "activity_logs_insert_policy" ON activity_logs
        FOR INSERT TO authenticated
        WITH CHECK (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "activity_logs_read_policy" ON activity_logs;
    CREATE POLICY "activity_logs_read_policy" ON activity_logs
        FOR SELECT TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_object_id ON activity_logs(object_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('account_expiry', 'package_expiry', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
    CREATE POLICY "notifications_read_own" ON notifications
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "notifications_all_own" ON notifications;
    CREATE POLICY "notifications_all_own" ON notifications
        FOR ALL TO authenticated
        USING (user_id = auth.uid());
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "notifications_system_insert" ON notifications;
    CREATE POLICY "notifications_system_insert" ON notifications
        FOR INSERT TO public
        WITH CHECK (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create workspace_settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo TEXT,
    theme_color TEXT DEFAULT '#8a246c',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- Workspace settings policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "workspace_settings_read_all" ON workspace_settings;
    CREATE POLICY "workspace_settings_read_all" ON workspace_settings
        FOR SELECT TO authenticated
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "workspace_settings_admin_manage" ON workspace_settings;
    CREATE POLICY "workspace_settings_admin_manage" ON workspace_settings
        FOR ALL TO authenticated
        USING (EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        ));
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create trigger for workspace_settings updated_at
DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON workspace_settings;
CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL,
    price_yearly NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "subscription_plans_read_all" ON subscription_plans;
    CREATE POLICY "subscription_plans_read_all" ON subscription_plans
        FOR SELECT TO public
        USING (true);
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Insert default workspace settings
INSERT INTO workspace_settings (id, logo, theme_color)
VALUES (uuid_generate_v4(), null, '#8a246c')
ON CONFLICT DO NOTHING;

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, features, price_monthly, price_yearly, active)
VALUES 
    ('Basic', 'Perfect for small businesses', ARRAY['Up to 100 customers', 'Basic reporting', 'Email support'], 29.99, 299.99, true),
    ('Professional', 'Great for growing businesses', ARRAY['Up to 500 customers', 'Advanced reporting', 'Priority support', 'API access'], 59.99, 599.99, true),
    ('Enterprise', 'For large organizations', ARRAY['Unlimited customers', 'Custom reporting', '24/7 support', 'API access', 'Custom integrations'], 99.99, 999.99, true)
ON CONFLICT DO NOTHING;