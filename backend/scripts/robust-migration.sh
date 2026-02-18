#!/bin/bash

# ==============================================================================
# BULLETPROOF DATABASE MIGRATION SCRIPT
# This script ONLY handles database initialization and exits
# ==============================================================================

set -e

# Configuration
MAX_RETRIES=30
RETRY_INTERVAL=3
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-household_services}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for PostgreSQL
wait_for_postgres() {
    log_info "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        
        if [ $i -eq $MAX_RETRIES ]; then
            log_error "PostgreSQL failed to become ready after $MAX_RETRIES attempts"
            return 1
        fi
        
        log_info "Attempt $i/$MAX_RETRIES failed, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
}

# Function to test database connection
test_connection() {
    log_info "Testing database connection..."
    
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Database connection successful!"
        return 0
    else
        log_error "Database connection failed!"
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    log_info "Checking if database '$DB_NAME' exists..."
    
    DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "0")
    
    if [ "$DB_EXISTS" != "1" ]; then
        log_info "Creating database '$DB_NAME'..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
        log_success "Database '$DB_NAME' created!"
    else
        log_info "Database '$DB_NAME' already exists"
    fi
}

# Function to check if migration is needed
check_migration_needed() {
    log_info "Checking if migration is needed..."
    
    # Check if service_categories table exists and has data
    TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_categories');" 2>/dev/null || echo "false")
    
    if [ "$TABLE_EXISTS" = "t" ]; then
        # Check if we have data
        CATEGORY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM service_categories;" 2>/dev/null || echo "0")
        
        if [ "$CATEGORY_COUNT" -gt "0" ]; then
            log_success "Database already initialized with $CATEGORY_COUNT categories. Skipping migration."
            return 1  # No migration needed
        fi
    fi
    
    log_info "Migration needed - tables don't exist or are empty"
    return 0  # Migration needed
}

# Function to run migration
run_migration() {
    log_info "Running database migration..."
    
    if [ ! -f "000_complete_setup.sql" ]; then
        log_error "Migration file '000_complete_setup.sql' not found!"
        return 1
    fi
    
    # Run the migration with error handling
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f 000_complete_setup.sql; then
        log_success "Database migration completed successfully!"
        return 0
    else
        log_error "Database migration failed!"
        return 1
    fi
}

# Function to verify migration success
verify_migration() {
    log_info "Verifying migration success..."
    
    # Check all expected tables exist
    local expected_tables=("service_categories" "service_subcategories" "services" "users" "employees")
    
    for table in "${expected_tables[@]}"; do
        TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null || echo "false")
        
        if [ "$TABLE_EXISTS" != "t" ]; then
            log_error "Table '$table' not found after migration!"
            return 1
        fi
    done
    
    # Check data counts
    local category_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM service_categories;" 2>/dev/null || echo "0")
    local service_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM services;" 2>/dev/null || echo "0")
    local subcategory_count=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM service_subcategories;" 2>/dev/null || echo "0")
    
    log_success "Migration verification complete:"
    log_success "  → Categories: $category_count"
    log_success "  → Subcategories: $subcategory_count"
    log_success "  → Services: $service_count"
    
    if [ "$category_count" -lt "5" ] || [ "$service_count" -lt "10" ]; then
        log_error "Migration verification failed - insufficient data"
        return 1
    fi
    
    log_success "All verification checks passed!"
    return 0
}

# Function to create health check marker
create_health_marker() {
    log_info "Creating migration completion marker..."
    
    # Create a marker that other containers can check
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        CREATE TABLE IF NOT EXISTS migration_status (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            version VARCHAR(50) DEFAULT '1.0.0'
        );
        
        INSERT INTO migration_status (migration_name) 
        VALUES ('000_complete_setup') 
        ON CONFLICT DO NOTHING;
    " > /dev/null 2>&1
    
    log_success "Migration marker created successfully!"
}

# Main execution flow
main() {
    log_info "🚀 Starting BULLETPROOF Database Migration"
    log_info "=========================================="
    
    # Step 1: Wait for PostgreSQL
    if ! wait_for_postgres; then
        log_error "PostgreSQL connection timeout"
        exit 1
    fi
    
    # Step 2: Test connection
    if ! test_connection; then
        log_error "Database connection test failed"
        exit 1
    fi
    
    # Step 3: Create database
    if ! create_database; then
        log_error "Database creation failed"
        exit 1
    fi
    
    # Step 4: Check if migration is needed
    if ! check_migration_needed; then
        log_success "✅ Database already initialized - nothing to do!"
        exit 0
    fi
    
    # Step 5: Run migration
    if ! run_migration; then
        log_error "Migration execution failed"
        exit 1
    fi
    
    # Step 6: Verify migration
    if ! verify_migration; then
        log_error "Migration verification failed"
        exit 1
    fi
    
    # Step 7: Create health marker
    if ! create_health_marker; then
        log_error "Health marker creation failed"
        exit 1
    fi
    
    log_success "🎉 BULLETPROOF Migration completed successfully!"
    log_success "========================================="
    exit 0
}

# Error trap
trap 'log_error "Migration failed due to an unexpected error"; exit 1' ERR

# Execute main function
main "$@"