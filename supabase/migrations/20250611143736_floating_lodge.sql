/*
  # Fix RLS Policies and UUID Issues

  1. Security Updates
    - Fix activity_logs RLS policies to allow proper inserts
    - Add proper policies for all tables
    - Ensure UUID generation works correctly

  2. Policy Updates
    - Allow authenticated users to insert activity logs
    - Fix user ID references in policies
    - Add proper constraints and defaults
*/

-- Fix activity_logs table policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Users can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_policy" ON activity_logs;

-- Create proper activity logs policy
CREATE POLICY "activity_logs_insert_authenticated" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "activity_logs_select_authenticated" ON activity_logs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix accounts table policies to use proper UUID references
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON accounts;

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

-- Ensure proper UUID defaults for all tables
ALTER TABLE accounts ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE packages ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE customers ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE subscriptions ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE expenses ALTER COLUMN user_id SET DEFAULT auth.uid();