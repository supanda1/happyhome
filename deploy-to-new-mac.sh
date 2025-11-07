#!/bin/bash

# =============================================================================
# Household Services - Mac Deployment Script
# Version: 1st-container-version
# Images: 1934/myapp_api_v1, 1934/myapp_frontend_v1
# =============================================================================

set -e

echo "🏠 Happy Homes - Mac Deployment Script"
echo "======================================"
echo "🏷️  Version: 1st-container-version"
echo "🐳  Images: 1934/myapp_db_v1, 1934/myapp_api_v1, 1934/myapp_frontend_v1"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    echo ""
    echo "📥 Please install Docker Desktop from:"
    echo "   https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "🔄 Then run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running!"
    echo ""
    echo "🚀 Please start Docker Desktop and try again."
    exit 1
fi

print_status "Docker is installed and running"
echo ""

# Stop any existing containers
print_info "Stopping any existing containers..."
docker compose -f docker-compose.production.yml down 2>/dev/null || true
echo ""

# Pull latest images from Docker Hub
print_info "Pulling latest images from Docker Hub..."
echo "   🔄 Pulling 1934/myapp_db_v1:latest..."
docker pull 1934/myapp_db_v1:latest

echo "   🔄 Pulling 1934/myapp_api_v1:latest..."
docker pull 1934/myapp_api_v1:latest

echo "   🔄 Pulling 1934/myapp_frontend_v1:latest..."
docker pull 1934/myapp_frontend_v1:latest

print_status "All images pulled successfully"
echo ""

# Start the application
print_info "Starting Household Services application..."
docker compose -f docker-compose.production.yml up -d

echo ""
print_info "Waiting for containers to be healthy (this may take 2-3 minutes)..."

# Wait for health checks
attempt=0
max_attempts=60
while [ $attempt -lt $max_attempts ]; do
    if docker compose -f docker-compose.production.yml ps | grep -q "healthy"; then
        break
    fi
    echo -n "."
    sleep 5
    attempt=$((attempt + 1))
done

echo ""
echo ""

# Check container status
print_info "Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
print_info "Testing application endpoints..."

# Test backend health
sleep 10
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    print_status "Backend API: http://localhost:8001 (healthy)"
else
    print_warning "Backend API: http://localhost:8001 (still starting or not responding)"
fi

# Test frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_status "Frontend: http://localhost:3001 (healthy)"
else
    print_warning "Frontend: http://localhost:3001 (still starting or not responding)"
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📱 Access your application:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔌 Backend API: http://localhost:8001"
echo "   🔍 Database: localhost:5432"
echo ""
echo "🔐 Admin Login Credentials:"
echo "   📧 Email: admin@happyhomes.com"
echo "   🔑 Password: password123"
echo ""
echo "📊 Engineers Workload Dashboard Features:"
echo "   ✅ Current Workload View - Real-time engineer task distribution"
echo "   ✅ Historical Reports - Daily/Weekly/Monthly reporting"
echo "   ✅ Date Range Filtering - Custom date range selection"
echo "   ✅ Engineer-Specific Reports - Individual performance tracking"
echo "   ✅ CSV Export - Comprehensive data export with order details"
echo "   ✅ Modern UI - Beautiful glassmorphism design with animations"
echo ""
echo "🧪 Testing Steps:"
echo "   1. Open http://localhost:3001"
echo "   2. Login with admin credentials above"
echo "   3. Navigate to 'Engineers Workload Dashboard'"
echo "   4. Switch between 'Current Workload' and 'Historical Reports'"
echo "   5. Try different date ranges (Last 7/30/90 days)"
echo "   6. Test daily/weekly/monthly report types"
echo "   7. Export CSV reports with order details"
echo ""
echo "🆘 Troubleshooting:"
echo "   📋 View all logs: docker compose -f docker-compose.production.yml logs"
echo "   📋 View API logs: docker compose -f docker-compose.production.yml logs api"
echo "   📋 View frontend logs: docker compose -f docker-compose.production.yml logs frontend"
echo "   🔄 Restart all: docker compose -f docker-compose.production.yml restart"
echo "   🔄 Restart API: docker compose -f docker-compose.production.yml restart api"
echo "   🛑 Stop all: docker compose -f docker-compose.production.yml down"
echo ""
echo "📝 Note: If containers show as 'unhealthy', wait 2-3 minutes for full startup"
echo ""