#!/bin/bash

# 🧪 Happy Homes Setup Validator
# Comprehensive testing script to validate your deployment

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_header() {
    echo -e "${BLUE}🧪 Happy Homes Setup Validator${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -ne "${CYAN}[$TOTAL_TESTS] Testing: $1... ${NC}"
}

pass_test() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}PASS${NC}"
}

fail_test() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}FAIL${NC}"
    if [ ! -z "$1" ]; then
        echo -e "    ${YELLOW}ℹ️  $1${NC}"
    fi
}

warn_test() {
    echo -e "${YELLOW}WARN${NC}"
    if [ ! -z "$1" ]; then
        echo -e "    ${YELLOW}⚠️  $1${NC}"
    fi
}

# Test Docker installation
test_docker() {
    print_test "Docker installation"
    if command -v docker >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        pass_test
        echo -e "    ${GREEN}✓ Version: $DOCKER_VERSION${NC}"
    else
        fail_test "Docker not installed"
        return 1
    fi
}

# Test Docker Compose
test_docker_compose() {
    print_test "Docker Compose installation"
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "v2.x")
        pass_test
        echo -e "    ${GREEN}✓ Version: $COMPOSE_VERSION${NC}"
    else
        fail_test "Docker Compose not available"
        return 1
    fi
}

# Test Docker daemon
test_docker_daemon() {
    print_test "Docker daemon status"
    if docker info >/dev/null 2>&1; then
        pass_test
    else
        fail_test "Docker daemon not running. Try: sudo systemctl start docker"
        return 1
    fi
}

# Test project files
test_project_files() {
    local required_files=(
        "docker-compose.yml"
        "Dockerfile.frontend"
        "backend/Dockerfile.nodejs"
        "setup-docker.sh"
        "docker-dev.sh"
    )
    
    for file in "${required_files[@]}"; do
        print_test "Project file: $file"
        if [ -f "$file" ]; then
            pass_test
        else
            fail_test "File missing: $file"
        fi
    done
}

# Test environment configuration
test_environment() {
    print_test "Environment configuration"
    if [ -f ".env" ]; then
        pass_test
        
        # Check required variables
        local env_vars=("DB_HOST" "DB_NAME" "DB_USER" "VITE_API_BASE_URL")
        for var in "${env_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                echo -e "    ${GREEN}✓ $var configured${NC}"
            else
                echo -e "    ${YELLOW}⚠️  $var not found in .env${NC}"
            fi
        done
    else
        fail_test ".env file not found"
    fi
}

# Test database initialization files
test_database_files() {
    print_test "Database initialization files"
    local db_files=(
        "database/init/00-core-schema.sql"
        "database/init/01-seed-master-data.sql"
        "database/init/02-admin-update-capture.sql"
    )
    
    local found_files=0
    for file in "${db_files[@]}"; do
        if [ -f "$file" ]; then
            found_files=$((found_files + 1))
        fi
    done
    
    if [ $found_files -eq ${#db_files[@]} ]; then
        pass_test
        echo -e "    ${GREEN}✓ All $found_files database files found${NC}"
    else
        fail_test "Missing database files ($found_files/${#db_files[@]} found)"
    fi
}

# Test Docker containers
test_containers() {
    print_test "Docker containers status"
    
    if docker compose ps >/dev/null 2>&1; then
        local containers=$(docker compose ps --format json 2>/dev/null || docker compose ps -q 2>/dev/null)
        
        if [ ! -z "$containers" ]; then
            pass_test
            
            # Check individual containers
            local services=("postgres" "backend" "frontend")
            for service in "${services[@]}"; do
                local status=$(docker compose ps "$service" --format "{{.State}}" 2>/dev/null || echo "not found")
                case $status in
                    "running")
                        echo -e "    ${GREEN}✓ $service: running${NC}"
                        ;;
                    "exited")
                        echo -e "    ${RED}✗ $service: exited${NC}"
                        ;;
                    *)
                        echo -e "    ${YELLOW}⚠️  $service: $status${NC}"
                        ;;
                esac
            done
        else
            fail_test "No containers found. Run './docker-dev.sh start'"
        fi
    else
        fail_test "Docker Compose not configured"
    fi
}

# Test network connectivity
test_network() {
    print_test "Docker network connectivity"
    
    # Check if containers can communicate
    if docker compose exec -T backend curl -s postgres:5432 >/dev/null 2>&1; then
        pass_test
        echo -e "    ${GREEN}✓ Backend can reach database${NC}"
    else
        warn_test "Backend-database connectivity issue"
    fi
}

# Test database connectivity
test_database() {
    print_test "Database connectivity"
    
    if docker compose exec -T postgres pg_isready -U admin -d household_services >/dev/null 2>&1; then
        pass_test
        
        # Check if tables exist
        local table_count=$(docker compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")
        echo -e "    ${GREEN}✓ Tables created: $table_count${NC}"
        
        # Check if data is seeded
        local service_count=$(docker compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM services WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
        if [ "$service_count" -gt "0" ]; then
            echo -e "    ${GREEN}✓ Services seeded: $service_count${NC}"
        else
            echo -e "    ${YELLOW}⚠️  No services found in database${NC}"
        fi
    else
        fail_test "Database not accessible"
    fi
}

# Test backend API
test_backend() {
    print_test "Backend API health"
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:8001/health >/dev/null 2>&1; then
            local health_response=$(curl -s http://localhost:8001/health 2>/dev/null)
            if echo "$health_response" | grep -q '"status"'; then
                pass_test
                echo -e "    ${GREEN}✓ API responding at http://localhost:8001${NC}"
                return 0
            fi
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            sleep 2
        fi
        attempt=$((attempt + 1))
    done
    
    fail_test "Backend API not responding at http://localhost:8001/health"
}

# Test frontend
test_frontend() {
    print_test "Frontend accessibility"
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
        
        if [ "$status_code" = "200" ]; then
            pass_test
            echo -e "    ${GREEN}✓ Frontend serving at http://localhost:3001${NC}"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            sleep 2
        fi
        attempt=$((attempt + 1))
    done
    
    fail_test "Frontend not accessible at http://localhost:3001 (HTTP $status_code)"
}

# Test API endpoints
test_api_endpoints() {
    local endpoints=(
        "health:Health check"
        "api/services:Services API"
        "api/categories:Categories API"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint=$(echo $endpoint_info | cut -d: -f1)
        local description=$(echo $endpoint_info | cut -d: -f2)
        
        print_test "API endpoint: $description"
        
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8001/$endpoint" 2>/dev/null || echo "000")
        
        case $status_code in
            200|201)
                pass_test
                ;;
            404)
                warn_test "Endpoint not found (might be normal during startup)"
                ;;
            500)
                fail_test "Server error"
                ;;
            *)
                fail_test "Unexpected status: $status_code"
                ;;
        esac
    done
}

# Test admin access
test_admin_access() {
    print_test "Admin authentication test"
    
    local login_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@happyhomes.com", "password": "admin123"}' \
        http://localhost:8001/api/auth/login 2>/dev/null || echo "")
    
    if echo "$login_response" | grep -q "token\|success"; then
        pass_test
        echo -e "    ${GREEN}✓ Admin login working${NC}"
    else
        fail_test "Admin authentication failed"
        echo -e "    ${YELLOW}ℹ️  Response: $login_response${NC}"
    fi
}

# Test file permissions
test_permissions() {
    print_test "File permissions"
    
    local scripts=("setup-docker.sh" "docker-dev.sh" "quick-start.sh")
    local all_executable=true
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                echo -e "    ${GREEN}✓ $script is executable${NC}"
            else
                echo -e "    ${YELLOW}⚠️  $script not executable${NC}"
                all_executable=false
            fi
        fi
    done
    
    if $all_executable; then
        pass_test
    else
        warn_test "Some scripts need 'chmod +x'"
    fi
}

# Test system resources
test_system_resources() {
    print_test "System resources"
    
    # Check available disk space (need at least 5GB)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local space_gb=$((available_space / 1024 / 1024))
    
    if [ $space_gb -ge 5 ]; then
        pass_test
        echo -e "    ${GREEN}✓ Available disk space: ${space_gb}GB${NC}"
    else
        warn_test "Low disk space: ${space_gb}GB (5GB+ recommended)"
    fi
    
    # Check memory (if available)
    if command -v free >/dev/null 2>&1; then
        local mem_mb=$(free -m | grep '^Mem:' | awk '{print $2}')
        if [ $mem_mb -ge 4000 ]; then
            echo -e "    ${GREEN}✓ Available memory: ${mem_mb}MB${NC}"
        else
            echo -e "    ${YELLOW}⚠️  Low memory: ${mem_mb}MB (4GB+ recommended)${NC}"
        fi
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}===============${NC}"
    echo ""
    
    echo -e "Total Tests:  ${CYAN}$TOTAL_TESTS${NC}"
    echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
    
    local pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Success Rate: ${CYAN}${pass_rate}%${NC}"
    
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Your setup is perfect!${NC}"
        echo ""
        echo -e "${CYAN}🚀 Ready to use:${NC}"
        echo -e "   Frontend: ${GREEN}http://localhost:3001${NC}"
        echo -e "   Backend:  ${GREEN}http://localhost:8001${NC}"
        echo -e "   Admin:    ${GREEN}admin@happyhomes.com / admin123${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Some tests failed. Check the issues above.${NC}"
        echo ""
        echo -e "${CYAN}💡 Common fixes:${NC}"
        echo -e "   • Run: ${YELLOW}./docker-dev.sh restart${NC}"
        echo -e "   • Check: ${YELLOW}./docker-dev.sh logs${NC}"
        echo -e "   • Reset: ${YELLOW}./docker-dev.sh reset${NC}"
        echo ""
    fi
}

# Main execution
main() {
    print_header
    
    echo -e "${CYAN}Running comprehensive validation tests...${NC}"
    echo ""
    
    # Infrastructure tests
    test_docker
    test_docker_compose
    test_docker_daemon
    
    # Project tests
    test_project_files
    test_environment
    test_database_files
    test_permissions
    
    # Runtime tests
    test_containers
    test_network
    test_database
    test_backend
    test_frontend
    
    # Functionality tests
    test_api_endpoints
    test_admin_access
    
    # System tests
    test_system_resources
    
    # Summary
    print_summary
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"