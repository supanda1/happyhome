-- Initialize PostgreSQL database for Household Services

-- Create database if it doesn't exist (this runs during container initialization)
SELECT 'CREATE DATABASE household_services' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'household_services');

-- Connect to the household_services database
\c household_services;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search extension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance (these will be created by Alembic migrations)
-- But we can prepare the database for optimal performance

-- Set up proper permissions
GRANT ALL PRIVILEGES ON DATABASE household_services TO postgres;

-- Log initialization
SELECT 'Database household_services initialized successfully' as message;