# ISP Management System

A comprehensive ISP management system built with React, TypeScript, and Supabase.

## Features

- Customer management
- Package management
- Revenue tracking
- Activity logging
- User authentication
- Admin dashboard

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Update the `.env` file with your Supabase credentials
   - Apply the database migrations from the `supabase/migrations/` directory using the Supabase dashboard or CLI

3. Start the development server:
   ```bash
   npm run dev
   ```

## Database Setup

The database schema is defined in the `supabase/migrations/` directory. These migrations need to be applied to your Supabase project to create the necessary tables including:

- `activity_logs`
- `customers`
- `packages`
- `accounts`
- `users`
- And other required tables

To apply migrations:
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run each migration file in chronological order, or
4. Use the Supabase CLI to apply migrations automatically

## Environment Variables

Make sure to set up your `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```