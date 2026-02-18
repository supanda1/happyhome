#!/bin/bash

# ==============================================================================
# BULLETPROOF HOUSEHOLD SERVICES STARTUP
# This script GUARANTEES a working setup every time
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.fixed.yml"
MAX_RETRIES=30
RETRY_INTERVAL=5

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check Docker
check_docker() {
    log_step "Checking Docker availability..."
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "docker-compose is not installed."
        exit 1
    fi
    
    log_success "Docker is ready"
}

# Function to perform complete cleanup
complete_cleanup() {
    log_step "Performing COMPLETE cleanup..."
    
    # Stop all containers
    docker-compose -f $DOCKER_COMPOSE_FILE down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove any household services containers
    docker ps -a --filter "name=household_services" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
    
    # Remove unused containers and networks
    docker container prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true
    
    # Remove unused volumes (be careful here)
    docker volume ls --filter "name=backend" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    
    log_success "Complete cleanup finished"
}

# Function to start PostgreSQL
start_postgres() {
    log_step "Starting PostgreSQL database..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres
    
    log_info "Waiting for PostgreSQL to be healthy..."
    for i in $(seq 1 $MAX_RETRIES); do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps postgres | grep -q "(healthy)"; then
            log_success "PostgreSQL is healthy and ready!"
            return 0
        fi
        
        if [ $i -eq $MAX_RETRIES ]; then
            log_error "PostgreSQL health check timeout"
            log_error "PostgreSQL logs:"
            docker-compose -f $DOCKER_COMPOSE_FILE logs postgres
            return 1
        fi
        
        log_info "PostgreSQL health check attempt $i/$MAX_RETRIES..."
        sleep $RETRY_INTERVAL
    done
}

# Function to run migration
run_migration() {
    log_step "Running database migration..."
    
    # Run migration container with proper profile
    if docker-compose -f $DOCKER_COMPOSE_FILE --profile migration up migration; then
        log_success "Migration container executed"
    else
        log_error "Migration container failed"
        log_error "Migration logs:"
        docker-compose -f $DOCKER_COMPOSE_FILE logs migration 2>/dev/null || true
        return 1
    fi
    
    # Verify migration completed by checking the database
    log_info "Verifying migration success..."
    
    for i in $(seq 1 20); do
        if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres psql -U postgres -d household_services -tAc "SELECT COUNT(*) FROM service_categories;" 2>/dev/null | grep -q -E "^[1-9][0-9]*$"; then
            local category_count=$(docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres psql -U postgres -d household_services -tAc "SELECT COUNT(*) FROM service_categories;" 2>/dev/null)
            log_success "Migration verification successful! Found $category_count categories."
            return 0
        fi
        
        if [ $i -eq 20 ]; then
            log_error "Migration verification failed - no data found"
            return 1
        fi
        
        log_info "Migration verification attempt $i/20..."
        sleep 2
    done
}

# Function to start API server
start_api() {
    log_step "Starting API server..."
    
    docker-compose -f $DOCKER_COMPOSE_FILE up -d api redis
    
    log_info "Waiting for API server to be healthy..."
    for i in $(seq 1 $MAX_RETRIES); do
        if curl -s http://localhost:8001/health > /dev/null 2>&1; then
            log_success "API server is healthy and responding!"
            return 0
        fi
        
        if [ $i -eq $MAX_RETRIES ]; then
            log_error "API server health check timeout"
            log_error "API server logs:"
            docker-compose -f $DOCKER_COMPOSE_FILE logs api
            return 1
        fi
        
        log_info "API server health check attempt $i/$MAX_RETRIES..."
        sleep $RETRY_INTERVAL
    done
}

# Function to verify complete setup
verify_setup() {
    log_step "Verifying complete setup..."
    
    # Test API endpoints
    local endpoints=("/health" "/api/categories" "/api/subcategories" "/api/services")
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s "http://localhost:8001$endpoint" | grep -q '"success"'; then
            log_success "✅ Endpoint $endpoint is working"
        else
            log_error "❌ Endpoint $endpoint failed"
            return 1
        fi
    done
    
    # Check data counts
    local category_count=$(curl -s "http://localhost:8001/api/categories" | jq -r '.data | length' 2>/dev/null || echo "0")
    local service_count=$(curl -s "http://localhost:8001/api/services" | jq -r '.data | length' 2>/dev/null || echo "0")
    local subcategory_count=$(curl -s "http://localhost:8001/api/subcategories" | jq -r '.data | length' 2>/dev/null || echo "0")
    
    log_success "📊 Data verification:"
    log_success "  → Categories: $category_count"
    log_success "  → Subcategories: $subcategory_count" 
    log_success "  → Services: $service_count"
    
    if [ "$category_count" -lt "5" ] || [ "$service_count" -lt "10" ]; then
        log_error "Insufficient data found - setup may have failed"
        return 1
    fi
    
    log_success "All verifications passed!"
    return 0
}

# Function to show final status
show_final_status() {
    echo ""
    echo -e "${GREEN}🎉 BULLETPROOF SETUP COMPLETED SUCCESSFULLY! 🎉${NC}"
    echo "==============================================="
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    echo -e "${BLUE}🌐 Access Points:${NC}"
    echo "  • API Server: http://localhost:8001"
    echo "  • API Health: http://localhost:8001/health"
    echo "  • API Docs:   http://localhost:8001/"
    echo "  • Categories: http://localhost:8001/api/categories"
    echo "  • Services:   http://localhost:8001/api/services"
    echo ""
    echo -e "${BLUE}👤 Default Admin Account:${NC}"
    echo "  • Email: admin@happyhomes.com"
    echo "  • Password: admin123"
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo "  • View logs:        docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  • Stop services:    docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  • Full cleanup:     docker-compose -f $DOCKER_COMPOSE_FILE down --volumes"
    echo "  • Restart:          ./bulletproof-start.sh"
    echo ""
    echo -e "${GREEN}✅ Your Household Services application is ready to use!${NC}"
    echo ""
}

# Main execution flow
main() {
    echo -e "${PURPLE}"
    echo "🚀 BULLETPROOF HOUSEHOLD SERVICES STARTUP"
    echo "=========================================="
    echo -e "${NC}"
    
    check_docker
    complete_cleanup
    start_postgres
    run_migration
    start_api
    verify_setup
    show_final_status
    
    # Optional: Start development services
    read -p "Do you want to start pgAdmin for database management? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Starting pgAdmin..."
        docker-compose -f $DOCKER_COMPOSE_FILE --profile development up -d pgadmin
        echo "  • pgAdmin: http://localhost:5050 (admin@admin.com / admin)"
    fi
    
    echo ""
    log_info "Setup completed! Press Ctrl+C to stop following logs."
    echo ""
    
    # Follow API logs
    docker-compose -f $DOCKER_COMPOSE_FILE logs -f api
}

# Error handling
handle_error() {
    log_error "Setup failed at step: $1"
    log_error "Check the logs above for details"
    log_info "You can try running the script again - it will cleanup and retry"
    exit 1
}

# Set up error trap
trap 'handle_error "Unknown step"' ERR

# Execute main function
main "$@"