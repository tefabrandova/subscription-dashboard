/*
  # Add subscription plans

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `features` (text array)
      - `price_monthly` (decimal)
      - `price_yearly` (decimal)
      - `active` (boolean)
      - `created_at` (timestamp)

  2. Initial Data
    - Basic, Pro, and Enterprise plans
*/

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  features TEXT[] NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON subscription_plans
  FOR SELECT USING (true);

-- Insert default plans
INSERT INTO subscription_plans (name, description, features, price_monthly, price_yearly) VALUES
(
  'Basic',
  'Perfect for small businesses just getting started',
  ARRAY[
    'Up to 50 customers',
    'Basic reporting',
    'Email support',
    'Single user access'
  ],
  29.99,
  299.99
),
(
  'Pro',
  'Ideal for growing businesses with more needs',
  ARRAY[
    'Up to 500 customers',
    'Advanced reporting',
    'Priority support',
    'Up to 5 team members',
    'Custom branding',
    'API access'
  ],
  99.99,
  999.99
),
(
  'Enterprise',
  'For large organizations requiring maximum flexibility',
  ARRAY[
    'Unlimited customers',
    'Custom reporting',
    '24/7 dedicated support',
    'Unlimited team members',
    'White labeling',
    'Advanced API features',
    'Custom integrations'
  ],
  299.99,
  2999.99
);