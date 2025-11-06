-- ==============================================================================
-- RUN MIGRATIONS AND SEED DATA SCRIPT
-- This script runs all necessary migrations and seeds data for PostgreSQL container startup
-- ==============================================================================

-- Run the complete setup migration (contains all necessary schema and data)
\i /app/migrations/final_complete_setup.sql

-- Run any additional enhancement migrations if they exist
-- \i /app/migrations/enhance_services_table.sql  -- Uncomment if needed
-- \i /app/migrations/fix_image_paths.sql         -- Uncomment if needed

-- Log completion
SELECT 'Database initialized successfully with corrected engineer foreign key constraints' as message;