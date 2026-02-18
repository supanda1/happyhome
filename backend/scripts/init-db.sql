-- Initialize database
-- This file runs before other initialization files

-- Create database if it doesn't exist (already handled by POSTGRES_DB env var)
-- Just ensure we're connected to the right database
SELECT 'Database initialization started' as status;