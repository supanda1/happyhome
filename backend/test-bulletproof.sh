#!/bin/bash

# ==============================================================================
# BULLETPROOF SETUP VALIDATION TEST
# This script tests the complete cleanup/restart cycle
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_info "Running test: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name"
        return 1
    fi
}

# Main test flow
main() {
    echo -e "${BLUE}🧪 TESTING BULLETPROOF SETUP${NC}"
    echo "=============================="
    echo ""
    
    # Test 1: Initial setup
    log_info "TEST 1: Initial setup from clean state"
    ./bulletproof-start.sh
    
    # Test 2: API endpoints
    run_test "API Health Check" "curl -f http://localhost:8001/health"
    run_test "Categories API" "curl -s http://localhost:8001/api/categories | jq -r '.success' | grep -q true"
    run_test "Services API" "curl -s http://localhost:8001/api/services | jq -r '.success' | grep -q true"
    
    # Test 3: Data validation
    local category_count=$(curl -s "http://localhost:8001/api/categories" | jq -r '.data | length')
    run_test "Sufficient Categories ($category_count >= 5)" "[ $category_count -ge 5 ]"
    
    # Test 4: Complete cleanup
    log_info "TEST 2: Complete cleanup and restart"
    docker-compose -f docker-compose.fixed.yml down --volumes
    
    # Wait a moment
    sleep 5
    
    # Test 5: Restart after cleanup
    log_info "TEST 3: Restart after complete cleanup"
    ./bulletproof-start.sh
    
    # Test 6: Verify everything still works
    run_test "API Health After Restart" "curl -f http://localhost:8001/health"
    run_test "Categories API After Restart" "curl -s http://localhost:8001/api/categories | jq -r '.success' | grep -q true"
    
    local category_count_after=$(curl -s "http://localhost:8001/api/categories" | jq -r '.data | length')
    run_test "Data Persistence After Restart ($category_count_after >= 5)" "[ $category_count_after -ge 5 ]"
    
    echo ""
    log_success "🎉 ALL TESTS PASSED! The setup is truly bulletproof!"
    echo ""
}

# Error handling
trap 'log_error "Test suite failed"; exit 1' ERR

# Check dependencies
if ! command -v jq > /dev/null 2>&1; then
    log_error "jq is required for testing. Please install jq first."
    exit 1
fi

if ! command -v curl > /dev/null 2>&1; then
    log_error "curl is required for testing. Please install curl first."
    exit 1
fi

# Run tests
main "$@"