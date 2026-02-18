#!/bin/bash

# ==============================================================================
# HOUSEHOLD SERVICES DATABASE INITIALIZATION SCRIPT
# This script sets up the complete database with all tables and seed data
# ==============================================================================

set -e  # Exit on any error

echo "🚀 Starting Household Services Database Setup..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres}; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database exists, create if not
echo "🔍 Checking if database exists..."
DB_EXISTS=$(psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME:-household_services}'" || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "📦 Creating database ${DB_NAME:-household_services}..."
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d postgres -c "CREATE DATABASE ${DB_NAME:-household_services};"
else
    echo "✅ Database ${DB_NAME:-household_services} already exists"
fi

# Check if tables already exist
echo "🔍 Checking if tables exist..."
TABLES_EXIST=$(psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-household_services} -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='service_categories'" || echo "0")

if [ "$TABLES_EXIST" = "0" ]; then
    echo "📋 Running complete database setup migration..."
    
    # Run the complete setup migration
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-household_services} -f /app/migrations/final_complete_setup.sql
    
    echo "✅ Database setup completed successfully!"
    echo "📊 Database Statistics:"
    
    # Show setup summary
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-household_services} -c "
    SELECT 
        'Categories' as type, COUNT(*) as count FROM service_categories
    UNION ALL
    SELECT 
        'Subcategories' as type, COUNT(*) as count FROM service_subcategories
    UNION ALL
    SELECT 
        'Services' as type, COUNT(*) as count FROM services
    UNION ALL
    SELECT 
        'Employees' as type, COUNT(*) as count FROM employees
    UNION ALL
    SELECT 
        'Coupons' as type, COUNT(*) as count FROM coupons;
    "
else
    echo "✅ Database tables already exist, skipping migration"
    
    # Show current statistics
    echo "📊 Current Database Statistics:"
    psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -d ${DB_NAME:-household_services} -c "
    SELECT 
        'Categories' as type, COUNT(*) as count FROM service_categories
    UNION ALL
    SELECT 
        'Subcategories' as type, COUNT(*) as count FROM service_subcategories
    UNION ALL
    SELECT 
        'Services' as type, COUNT(*) as count FROM services
    UNION ALL
    SELECT 
        'Employees' as type, COUNT(*) as count FROM employees
    UNION ALL
    SELECT 
        'Coupons' as type, COUNT(*) as count FROM coupons;
    "
fi

echo "🎉 Database initialization completed!"
echo "🌐 API will be available at: http://localhost:8001/api"
echo "👤 Default Admin: admin@happyhomes.com"
echo "📚 API Documentation: http://localhost:8001/"