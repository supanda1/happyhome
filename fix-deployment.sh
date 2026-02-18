#!/bin/bash

# 🚨 Emergency Deployment Fix Script for Remote Machine
# Run this script on the remote machine to fix container networking issues

echo "🚨 Household Services - Emergency Deployment Fix"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop all containers
print_step "Stopping all running containers..."
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
print_success "All containers stopped and removed"

# Step 2: Clean up networks
print_step "Cleaning up Docker networks..."
docker network prune -f >/dev/null 2>&1
print_success "Docker networks cleaned"

# Step 3: Pull latest images
print_step "Pulling latest Docker images..."
docker pull 1934/myapp_db_v1:latest
docker pull 1934/myapp_api_v1:latest  
docker pull 1934/myapp_frontend_v1:latest
print_success "Latest images pulled"

# Step 4: Check if production compose file exists
if [ ! -f "docker-compose.production.yml" ]; then
    print_error "docker-compose.production.yml not found!"
    echo "Please ensure you're running this script from the project root directory."
    exit 1
fi

# Step 5: Start services with production compose
print_step "Starting services with production compose..."
docker compose -f docker-compose.production.yml up -d

if [ $? -eq 0 ]; then
    print_success "Services started successfully"
else
    print_error "Failed to start services"
    exit 1
fi

# Step 6: Wait for services to be ready
print_step "Waiting for services to be ready..."
sleep 15

# Step 7: Check service status
print_step "Checking service status..."
docker compose -f docker-compose.production.yml ps

# Step 8: Test connectivity
echo ""
print_step "Testing service connectivity..."

# Test database
echo "Testing database..."
if docker exec myapp_api pg_isready -h postgres -p 5432 >/dev/null 2>&1; then
    print_success "✅ Database connectivity: OK"
else
    print_warning "⚠️ Database connectivity: Issues detected"
fi

# Test API health
echo "Testing API health..."
sleep 5
if curl -s http://localhost:8001/health >/dev/null 2>&1; then
    print_success "✅ API health: OK"
else
    print_warning "⚠️ API health: Issues detected"
fi

# Test frontend
echo "Testing frontend..."
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    print_success "✅ Frontend health: OK"
else
    print_warning "⚠️ Frontend health: Issues detected"
fi

# Step 9: Show final status
echo ""
echo "🎯 Final Status Check:"
echo "====================="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
print_success "🎉 Deployment fix completed!"
echo ""
echo "📱 Access your application:"
echo "   🌐 Frontend: http://$SERVER_IP:3001"
echo "   🔌 API:      http://$SERVER_IP:8001"
echo "   🗄️  Database: $SERVER_IP:5432"
echo ""
echo "🔧 Management commands:"
echo "   📊 Status:   docker compose -f docker-compose.production.yml ps"
echo "   📋 Logs:     docker compose -f docker-compose.production.yml logs -f"
echo "   🔄 Restart:  docker compose -f docker-compose.production.yml restart"
echo "   ⏹️  Stop:     docker compose -f docker-compose.production.yml down"
echo ""

# Step 10: Show current container status
echo "Current container status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "If you still see issues, check the logs:"
echo "docker compose -f docker-compose.production.yml logs -f"