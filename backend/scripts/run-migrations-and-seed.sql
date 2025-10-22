-- ==============================================================================
-- RUN MIGRATIONS AND SEED DATA SCRIPT
-- This script runs all necessary migrations and seeds data for PostgreSQL container startup
-- ==============================================================================

-- First run the comprehensive setup
\i /docker-entrypoint-initdb.d/02-complete-setup.sql

-- Then run any additional fix migrations
\i /app/migrations/012_fix_user_addresses_schema.sql
\i /app/migrations/013_fix_coupon_schema.sql
\i /app/migrations/014_add_coupon_code_to_orders.sql
\i /app/migrations/015_add_coupon_id_to_orders.sql
\i /app/migrations/016_fix_order_items_schema.sql
\i /app/migrations/017_comprehensive_python_models_setup.sql

-- Log completion
SELECT 'All migrations and seed data loaded successfully for Python models compatibility' as message;