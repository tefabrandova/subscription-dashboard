/*
  # Add admin and notifications tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `password` (text)
      - `role` (text)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

    - `notifications`
      - `id` (uuid, primary key) 
      - `type` (text)
      - `title` (text)
      - `message` (text)
      - `user_id` (uuid, foreign key)
      - `read` (boolean)
      - `created_at` (timestamp)

    - `workspace_settings`
      - `id` (uuid, primary key)
      - `logo` (text)
      - `theme_color` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('account_expiry', 'package_expiry', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create workspace settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo TEXT,
    theme_color TEXT DEFAULT '#8a246c',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Only admins can create users" ON users
    FOR INSERT TO authenticated
    WITH CHECK (role = 'admin');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Only admins can delete users" ON users
    FOR DELETE TO authenticated
    USING (role = 'admin');

-- Notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Workspace settings policies
CREATE POLICY "Anyone can read workspace settings" ON workspace_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Only admins can modify workspace settings" ON workspace_settings
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger for workspace_settings updated_at
CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role)
VALUES (
    uuid_generate_v4(),
    'Admin',
    'admin@example.com',
    '$2a$10$xKR8HFj1Zf5XGZuv1XJqZeUH7/9kUP9tnvTyLVqDqE8zHEXtqJEPK',
    'admin'
) ON CONFLICT DO NOTHING;

-- Insert default workspace settings
INSERT INTO workspace_settings (id, theme_color)
VALUES (
    uuid_generate_v4(),
    '#8a246c'
) ON CONFLICT DO NOTHING;