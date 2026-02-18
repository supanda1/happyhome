#!/bin/bash

# ==============================================================================
# HOUSEHOLD SERVICES - ONE-CLICK STARTUP SCRIPT
# This script starts the complete household services application
# ==============================================================================

set -e

echo "🚀 Starting Household Services Application..."
echo "=============================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to cleanup previous containers
cleanup_previous() {
    echo "🧹 Cleaning up previous containers..."
    
    # Stop and remove containers if they exist
    docker-compose down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove any orphaned containers
    docker container prune -f 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f 2>/dev/null || true
    
    echo "✅ Cleanup completed"
}

# Function to build and start services
start_services() {
    echo "🏗️  Building and starting services..."
    
    # Build and start all services
    docker-compose up --build -d
    
    echo "✅ Services started successfully!"
}

# Function to wait for services to be ready
wait_for_services() {
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for PostgreSQL to be ready
    echo "  📊 Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres -d household_services > /dev/null 2>&1; then
            echo "  ✅ PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "  ❌ PostgreSQL failed to start"
            exit 1
        fi
        sleep 2
    done
    
    # Wait for API to be ready
    echo "  🌐 Waiting for API server..."
    for i in {1..30}; do
        if curl -s http://localhost:8001/health > /dev/null 2>&1; then
            echo "  ✅ API server is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "  ❌ API server failed to start"
            exit 1
        fi
        sleep 3
    done
}

# Function to show service status
show_status() {
    echo ""
    echo "🎉 Household Services is now running!"
    echo "====================================="
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access Points:"
    echo "  • API Server: http://localhost:8001"
    echo "  • API Health: http://localhost:8001/health"
    echo "  • API Docs:   http://localhost:8001/"
    echo "  • pgAdmin:    http://localhost:5050"
    echo "    - Email: admin@admin.com"
    echo "    - Password: admin"
    echo ""
    echo "📊 Database Statistics:"
    
    # Show database statistics
    timeout 10s bash -c 'until docker-compose exec -T postgres psql -U postgres -d household_services -c "SELECT '\''Categories'\'' as type, COUNT(*) as count FROM service_categories UNION ALL SELECT '\''Subcategories'\'' as type, COUNT(*) as count FROM service_subcategories UNION ALL SELECT '\''Services'\'' as type, COUNT(*) as count FROM services UNION ALL SELECT '\''Employees'\'' as type, COUNT(*) as count FROM employees UNION ALL SELECT '\''Coupons'\'' as type, COUNT(*) as count FROM coupons;" 2>/dev/null; do sleep 1; done' || echo "  Database stats will be available once fully initialized"
    
    echo ""
    echo "👤 Default Admin Account:"
    echo "  • Email: admin@happyhomes.com"
    echo "  • Password: admin123"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs:     docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart:       docker-compose restart"
    echo "  • Full cleanup:  docker-compose down --volumes"
    echo ""
    echo "✅ Setup completed successfully!"
}

# Main execution flow
main() {
    echo "🎯 Starting Household Services Setup"
    echo "===================================="
    
    check_docker
    cleanup_previous
    start_services
    wait_for_services
    show_status
    
    # Follow logs
    echo "📋 Following service logs (Ctrl+C to stop):"
    echo "============================================"
    docker-compose logs -f api
}

# Run with error handling
trap 'echo "❌ Setup failed. Check the logs above for details."' ERR

# Execute main function
main "$@"