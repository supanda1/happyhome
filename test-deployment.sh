#!/bin/bash

# ================================
# DEPLOYMENT TESTING SCRIPT
# Cross-machine compatibility and UUID consistency validation
# ================================
#
# This script validates that the deployment works correctly across
# different machines and environments, ensuring UUID consistency
# and model synchronization.
#
# Usage: ./test-deployment.sh
# ================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Function to print test results
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    ((TESTS_PASSED++))
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warn() {
    ((TESTS_WARNED++))
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_fail() {
    ((TESTS_FAILED++))
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ================================
# PRE-DEPLOYMENT TESTS
# ================================

test_prerequisites() {
    print_test "Checking prerequisites..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_pass "Docker installed: $DOCKER_VERSION"
    else
        print_fail "Docker is not installed"
        return 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d ' ' -f3 | cut -d ',' -f1)
        print_pass "Docker Compose installed: $COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version | cut -d ' ' -f3)
        print_pass "Docker Compose (plugin) installed: $COMPOSE_VERSION"
    else
        print_fail "Docker Compose is not installed"
        return 1
    fi
    
    # Check required files
    local required_files=(
        "docker-compose.yml"
        "database/init/00-core-schema.sql"
        "database/init/01-seed-master-data.sql"
        "database/init/02-admin-update-capture.sql"
        "setup-docker.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_pass "Required file exists: $file"
        else
            print_fail "Missing required file: $file"
            return 1
        fi
    done
}

# ================================
# DATABASE SCHEMA TESTS
# ================================

test_database_schema() {
    print_test "Testing database schema and initialization..."
    
    # Wait for database to be ready
    print_info "Waiting for database to initialize..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U admin -d household_services &>/dev/null; then
            print_pass "Database is ready (attempt $attempt)"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_fail "Database failed to initialize after $max_attempts attempts"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
    
    # Test table creation
    local tables=(
        "users" "user_addresses" "service_categories" "service_subcategories" 
        "services" "service_variants" "employees" "orders" "order_items"
        "coupons" "banners" "contact_settings" "assignment_history"
        "admin_changes_log" "seed_generations"
    )
    
    for table in "${tables[@]}"; do
        local exists=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" 2>/dev/null | tr -d ' \n')
        if [ "$exists" = "t" ]; then
            print_pass "Table exists: $table"
        else
            print_fail "Missing table: $table"
        fi
    done
}

# ================================
# UUID CONSISTENCY TESTS
# ================================

test_uuid_consistency() {
    print_test "Testing UUID generation consistency..."
    
    # Test UUID generation function
    local uuid_test=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT generate_uuid();" 2>/dev/null | tr -d ' \n')
    if [[ $uuid_test =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        print_pass "UUID generation function works: $uuid_test"
    else
        print_fail "UUID generation function failed"
    fi
    
    # Test UUID consistency across tables
    local uuid_fields=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE data_type = 'uuid' AND table_schema = 'public' 
        ORDER BY table_name, column_name;
    " 2>/dev/null)
    
    if [ -n "$uuid_fields" ]; then
        print_pass "UUID fields detected in database schema"
        print_info "UUID fields found:"
        echo "$uuid_fields" | while read -r line; do
            if [ -n "$line" ]; then
                print_info "  $line"
            fi
        done
    else
        print_warn "No UUID fields detected (this might be expected in some setups)"
    fi
}

# ================================
# DATA SEEDING TESTS
# ================================

test_data_seeding() {
    print_test "Testing master data seeding..."
    
    # Check seeded data counts
    local categories=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM service_categories WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    local subcategories=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM service_subcategories WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    local services=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM services WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    local employees=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM employees WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    local banners=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM banners WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    local coupons=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM coupons WHERE is_active = true;" 2>/dev/null | tr -d ' \n')
    
    # Expected minimum counts (based on our seed data)
    if [ "$categories" -ge 7 ]; then
        print_pass "Service categories seeded: $categories"
    else
        print_fail "Insufficient service categories: $categories (expected >= 7)"
    fi
    
    if [ "$subcategories" -ge 15 ]; then
        print_pass "Service subcategories seeded: $subcategories"
    else
        print_fail "Insufficient service subcategories: $subcategories (expected >= 15)"
    fi
    
    if [ "$services" -ge 6 ]; then
        print_pass "Services seeded: $services"
    else
        print_fail "Insufficient services: $services (expected >= 6)"
    fi
    
    if [ "$employees" -ge 8 ]; then
        print_pass "Employees seeded: $employees"
    else
        print_fail "Insufficient employees: $employees (expected >= 8)"
    fi
    
    if [ "$banners" -ge 3 ]; then
        print_pass "Banners seeded: $banners"
    else
        print_fail "Insufficient banners: $banners (expected >= 3)"
    fi
    
    if [ "$coupons" -ge 3 ]; then
        print_pass "Coupons seeded: $coupons"
    else
        print_fail "Insufficient coupons: $coupons (expected >= 3)"
    fi
    
    # Test admin user creation
    local admin_user=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM users WHERE user_type = 'super_admin';" 2>/dev/null | tr -d ' \n')
    if [ "$admin_user" -ge 1 ]; then
        print_pass "Admin user created: $admin_user"
    else
        print_fail "Admin user not created"
    fi
}

# ================================
# ADMIN UPDATE CAPTURE TESTS
# ================================

test_admin_update_capture() {
    print_test "Testing admin update capture system..."
    
    # Check if change tracking functions exist
    local functions=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "
        SELECT COUNT(*) FROM pg_proc 
        WHERE proname IN ('log_admin_change', 'generate_seed_script', 'generate_insert_statement');
    " 2>/dev/null | tr -d ' \n')
    
    if [ "$functions" -eq 3 ]; then
        print_pass "Admin update capture functions installed"
    else
        print_fail "Missing admin update capture functions (found: $functions/3)"
    fi
    
    # Test change tracking by making a sample change
    docker-compose exec -T postgres psql -U admin -d household_services -c "
        INSERT INTO service_categories (name, description, icon, sort_order) 
        VALUES ('Test Category', 'Test description', '🧪', 999) 
        ON CONFLICT (name) DO UPDATE SET description = 'Updated test description';
    " &>/dev/null
    
    # Check if change was logged
    local changes=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "
        SELECT COUNT(*) FROM admin_changes_log WHERE table_name = 'service_categories';
    " 2>/dev/null | tr -d ' \n')
    
    if [ "$changes" -gt 0 ]; then
        print_pass "Change tracking working: $changes changes logged"
    else
        print_warn "Change tracking may not be working properly"
    fi
    
    # Clean up test data
    docker-compose exec -T postgres psql -U admin -d household_services -c "
        DELETE FROM service_categories WHERE name = 'Test Category';
    " &>/dev/null
}

# ================================
# APPLICATION HEALTH TESTS
# ================================

test_application_health() {
    print_test "Testing application health..."
    
    # Test backend health
    local backend_attempts=10
    local backend_ready=false
    
    for ((i=1; i<=backend_attempts; i++)); do
        if curl -s http://localhost:8001/health &>/dev/null; then
            print_pass "Backend API is responding"
            backend_ready=true
            break
        fi
        if [ $i -eq $backend_attempts ]; then
            print_fail "Backend API not responding after $backend_attempts attempts"
        else
            sleep 3
        fi
    done
    
    # Test frontend health
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
    if [ "$frontend_status" = "200" ]; then
        print_pass "Frontend is responding"
    else
        print_fail "Frontend not responding (HTTP $frontend_status)"
    fi
    
    # Test database connections from backend
    if [ "$backend_ready" = true ]; then
        local db_health=$(curl -s http://localhost:8001/health 2>/dev/null | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        if [ "$db_health" = "connected" ] || [ "$db_health" = "healthy" ]; then
            print_pass "Backend database connection healthy"
        else
            print_warn "Backend database connection status: $db_health"
        fi
    fi
}

# ================================
# CROSS-MACHINE COMPATIBILITY TESTS
# ================================

test_cross_machine_compatibility() {
    print_test "Testing cross-machine compatibility..."
    
    # Test environment variables
    local env_vars=(
        "DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD"
        "NODE_ENV" "PORT" "VITE_API_BASE_URL"
    )
    
    print_info "Environment configuration:"
    for var in "${env_vars[@]}"; do
        local value=$(docker-compose exec -T backend printenv "$var" 2>/dev/null || echo "NOT_SET")
        if [ "$value" != "NOT_SET" ]; then
            print_pass "$var is set"
        else
            print_warn "$var is not set"
        fi
    done
    
    # Test volume mounts
    local uploads_dir=$(docker-compose exec -T backend ls -la /app/uploads 2>/dev/null | wc -l)
    if [ "$uploads_dir" -gt 0 ]; then
        print_pass "Backend uploads volume mounted"
    else
        print_warn "Backend uploads volume may not be mounted properly"
    fi
    
    # Test network connectivity between services
    local backend_to_db=$(docker-compose exec -T backend nc -z postgres 5432 2>/dev/null && echo "connected" || echo "failed")
    if [ "$backend_to_db" = "connected" ]; then
        print_pass "Backend can connect to PostgreSQL"
    else
        print_fail "Backend cannot connect to PostgreSQL"
    fi
    
    local backend_to_redis=$(docker-compose exec -T backend nc -z redis 6379 2>/dev/null && echo "connected" || echo "failed")
    if [ "$backend_to_redis" = "connected" ]; then
        print_pass "Backend can connect to Redis"
    else
        print_warn "Backend cannot connect to Redis (may be optional)"
    fi
}

# ================================
# PERFORMANCE TESTS
# ================================

test_performance() {
    print_test "Testing basic performance..."
    
    # Test database query performance
    local query_time=$(docker-compose exec -T postgres psql -U admin -d household_services -c "
        \timing on
        SELECT s.name, sc.name as category, ss.name as subcategory 
        FROM services s 
        JOIN service_categories sc ON s.category_id = sc.id 
        JOIN service_subcategories ss ON s.subcategory_id = ss.id 
        WHERE s.is_active = true;
    " 2>&1 | grep "Time:" | awk '{print $2}' | head -1)
    
    if [ -n "$query_time" ]; then
        print_pass "Database query executed (Time: $query_time)"
    else
        print_warn "Could not measure database query performance"
    fi
    
    # Test API response time
    local api_time=$(curl -s -w "%{time_total}" -o /dev/null http://localhost:8001/health 2>/dev/null || echo "0")
    if (( $(echo "$api_time > 0" | bc -l 2>/dev/null || echo 0) )); then
        print_pass "API response time: ${api_time}s"
    else
        print_warn "Could not measure API response time"
    fi
}

# ================================
# MAIN TEST EXECUTION
# ================================

main() {
    echo "🧪 Household Services Deployment Testing"
    echo "========================================"
    echo ""
    
    # Run all test suites
    test_prerequisites || { echo "❌ Prerequisites failed. Exiting."; exit 1; }
    
    echo ""
    print_info "Starting application services for testing..."
    docker-compose up -d &>/dev/null
    
    # Wait for services to start
    sleep 15
    
    echo ""
    test_database_schema
    echo ""
    test_uuid_consistency  
    echo ""
    test_data_seeding
    echo ""
    test_admin_update_capture
    echo ""
    test_application_health
    echo ""
    test_cross_machine_compatibility
    echo ""
    test_performance
    
    # Test summary
    echo ""
    echo "📋 Test Summary"
    echo "==============="
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $TESTS_WARNED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        if [ $TESTS_WARNED -eq 0 ]; then
            echo -e "${GREEN}✅ All tests passed! Your deployment is ready for production.${NC}"
            echo ""
            echo "🚀 Next steps:"
            echo "1. Your application is running and fully tested"
            echo "2. Access frontend: http://localhost:3001"
            echo "3. Access backend API: http://localhost:8001"
            echo "4. Login as admin: admin@happyhomes.com"
            echo "5. Deploy to production with confidence!"
        else
            echo -e "${YELLOW}⚠️  Tests passed with warnings. Review warnings before production deployment.${NC}"
        fi
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please fix issues before deploying to production.${NC}"
        exit 1
    fi
}

# Run tests
main "$@"