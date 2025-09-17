-- Migration 010: Add user preferences column
-- Description: Add JSONB preferences column to users table for storing user-specific settings like menu order

BEGIN;

-- Add preferences column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create index on preferences column for better query performance
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING gin (preferences);

-- Add comment to describe the column
COMMENT ON COLUMN users.preferences IS 'User preferences stored as JSON, including menu order and other UI settings';

COMMIT;