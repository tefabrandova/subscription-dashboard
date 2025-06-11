-- Fix workspace settings insertion
-- This migration ensures workspace_settings has a default record without conflicts

-- Check if workspace_settings table exists and is empty, then insert default
DO $$
BEGIN
  -- Only insert if the table exists and is empty
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workspace_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM workspace_settings LIMIT 1) THEN
      INSERT INTO workspace_settings (id, logo, theme_color, updated_at) 
      VALUES (uuid_generate_v4(), NULL, '#8a246c', NOW());
    END IF;
  END IF;
END $$;