/*
  # Initial Database Schema

  1. New Tables
    - `accounts`
      - `id` (uuid, primary key)
      - `type` (text) - subscription or purchase
      - `name` (text)
      - `details` (jsonb) - credentials and notes
      - `subscription_date` (timestamptz)
      - `expiry_date` (timestamptz)
      - `price` (jsonb) - price info for different durations
      - `linked_packages` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `packages`
      - `id` (uuid, primary key)
      - `account_id` (uuid, foreign key)
      - `type` (text) - subscription or purchase
      - `name` (text)
      - `details` (jsonb) - credentials and notes
      - `price` (jsonb) - price info for different durations
      - `subscribed_customers` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `subscriptions`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `package_id` (uuid, foreign key)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `duration` (int)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `expenses`
      - `id` (uuid, primary key)
      - `date` (timestamptz)
      - `category` (text)
      - `description` (text)
      - `amount` (decimal)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `action_type` (text)
      - `object_type` (text)
      - `object_id` (uuid)
      - `object_name` (text)
      - `details` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase')),
    name TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '[]',
    subscription_date TIMESTAMPTZ NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    price JSONB NOT NULL,
    linked_packages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'purchase')),
    name TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '[]',
    price JSONB NOT NULL,
    subscribed_customers INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'sold')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id UUID NOT NULL,
    object_name TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Accounts policies
CREATE POLICY "Enable read access for authenticated users" ON accounts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON accounts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON accounts
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON accounts
    FOR DELETE TO authenticated USING (true);

-- Packages policies
CREATE POLICY "Enable read access for authenticated users" ON packages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON packages
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON packages
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON packages
    FOR DELETE TO authenticated USING (true);

-- Customers policies
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON customers
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON customers
    FOR DELETE TO authenticated USING (true);

-- Subscriptions policies
CREATE POLICY "Enable read access for authenticated users" ON subscriptions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON subscriptions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON subscriptions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON subscriptions
    FOR DELETE TO authenticated USING (true);

-- Expenses policies
CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE TO authenticated USING (true);

-- Activity logs policies
CREATE POLICY "Enable read access for authenticated users" ON activity_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON activity_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_account_id ON packages(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_package_id ON subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_object_id ON activity_logs(object_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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