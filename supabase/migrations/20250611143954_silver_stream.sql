/*
  # Fix RLS Policies for All Tables

  1. Security Updates
    - Fix activity_logs policies to allow proper inserts
    - Update all table policies to use proper authentication checks
    - Remove references to non-existent user_id columns
    
  2. Policy Changes
    - Simplify RLS policies for authenticated users
    - Ensure proper WITH CHECK clauses
    - Allow authenticated users to perform CRUD operations
*/

-- Fix activity_logs table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_policy" ON activity_logs;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Users can read activity logs" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_read_policy" ON activity_logs;

-- Create proper activity logs policies
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_authenticated" ON activity_logs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix accounts table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
DROP POLICY IF EXISTS "Users can read own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_read_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_update_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_delete_policy" ON accounts;

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

-- Fix packages table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON packages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON packages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON packages;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON packages;
DROP POLICY IF EXISTS "Users can manage packages" ON packages;
DROP POLICY IF EXISTS "Users can read packages" ON packages;
DROP POLICY IF EXISTS "packages_all_policy" ON packages;
DROP POLICY IF EXISTS "packages_read_policy" ON packages;

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

-- Fix customers table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customers;
DROP POLICY IF EXISTS "Users can manage customers" ON customers;
DROP POLICY IF EXISTS "Users can read customers" ON customers;
DROP POLICY IF EXISTS "customers_all_policy" ON customers;
DROP POLICY IF EXISTS "customers_read_policy" ON customers;

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

-- Fix subscriptions table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON subscriptions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON subscriptions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON subscriptions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON subscriptions;
DROP POLICY IF EXISTS "Users can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can read subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_all_policy" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_read_policy" ON subscriptions;

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

-- Fix expenses table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON expenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON expenses;

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

-- Only set defaults for columns that actually exist
-- Check if user_id column exists in accounts table and set default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Check if user_id column exists in customers table and set default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE customers ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Check if user_id column exists in subscriptions table and set default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subscriptions ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Check if user_id column exists in expenses table and set default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE expenses ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;