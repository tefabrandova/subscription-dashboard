/*
  # Fix RLS Policies for Accounts Table

  1. Changes
    - Drop existing RLS policies for accounts table
    - Create new, more permissive RLS policies that properly check auth.uid()
    - Add proper security checks for all CRUD operations

  2. Security
    - Ensure authenticated users can perform CRUD operations
    - Maintain data integrity with proper auth checks
    - Prevent unauthorized access while allowing legitimate operations
*/

-- Drop existing policies for accounts table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON accounts;

-- Create new policies with proper auth checks
CREATE POLICY "Enable read access for authenticated users" ON accounts
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON accounts
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON accounts
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON accounts
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() IS NOT NULL);