/*
  # Fix RLS Policies for Accounts Table

  1. Changes
    - Drop existing RLS policies for accounts table
    - Create new RLS policies that properly handle user authentication
    - Add proper security checks for all CRUD operations
    - Add user_id column to accounts table for ownership tracking
    - Add default value for user_id based on auth.uid()

  2. Security
    - Ensure authenticated users can perform CRUD operations on their own accounts
    - Maintain data integrity with proper auth and ownership checks
    - Prevent unauthorized access while allowing legitimate operations
*/

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE accounts ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- Drop existing policies for accounts table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON accounts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON accounts;

-- Create new policies with proper auth and ownership checks
CREATE POLICY "Enable read access for authenticated users" ON accounts
    FOR SELECT 
    TO authenticated 
    USING (
      auth.uid() IS NOT NULL AND 
      auth.uid() = user_id
    );

CREATE POLICY "Enable insert for authenticated users" ON accounts
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
      auth.uid() IS NOT NULL AND 
      auth.uid() = user_id
    );

CREATE POLICY "Enable update for authenticated users" ON accounts
    FOR UPDATE 
    TO authenticated 
    USING (
      auth.uid() IS NOT NULL AND 
      auth.uid() = user_id
    )
    WITH CHECK (
      auth.uid() IS NOT NULL AND 
      auth.uid() = user_id
    );

CREATE POLICY "Enable delete for authenticated users" ON accounts
    FOR DELETE 
    TO authenticated 
    USING (
      auth.uid() IS NOT NULL AND 
      auth.uid() = user_id
    );