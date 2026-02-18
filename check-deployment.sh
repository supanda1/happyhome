#!/bin/bash

# 🔍 Deployment Status Checker
# Comprehensive health check for all services

echo "🔍 Household Services - Deployment Status Checker"
echo "================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} $1"
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC} $1"
}

# Check Docker
echo ""
echo "🐳 Docker Environment:"
echo "====================="

if command -v docker >/dev/null 2>&1; then
    check_pass "Docker is installed"
    docker --version
    docker compose version
else
    check_fail "Docker is not installed"
    exit 1
fi

# Check compose file
echo ""
echo "📄 Configuration Files:"
echo "======================"

if [ -f "docker-compose.production.yml" ]; then
    check_pass "Production compose file exists"
else
    check_fail "Production compose file missing"
fi

if [ -f "docker-compose.yml" ]; then
    check_info "Development compose file exists"
fi

# Check running containers
echo ""
echo "🚀 Container Status:"
echo "==================="

CONTAINERS=$(docker compose -f docker-compose.production.yml ps -q 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    check_pass "Containers are running"
    docker compose -f docker-compose.production.yml ps
else
    check_fail "No containers running"
    echo "Run: docker compose -f docker-compose.production.yml up -d"
fi

# Check individual services
echo ""
echo "🔧 Service Health Checks:"
echo "========================="

# Database check
echo "Database (postgres):"
if docker ps | grep -q myapp_db; then
    if docker exec myapp_db pg_isready -U postgres >/dev/null 2>&1; then
        check_pass "Database is ready"
    else
        check_fail "Database is not ready"
    fi
else
    check_fail "Database container not running"
fi

# API check  
echo "API (backend):"
if docker ps | grep -q myapp_api; then
    # Check if API responds
    if curl -s http://localhost:8001/health >/dev/null 2>&1; then
        check_pass "API is responding"
        
        # Check database connection from API
        DB_HEALTH=$(curl -s http://localhost:8001/health/db 2>/dev/null)
        if echo "$DB_HEALTH" | grep -q "OK"; then
            check_pass "API database connection working"
        else
            check_fail "API cannot connect to database"
            echo "Response: $DB_HEALTH"
        fi
    else
        check_fail "API is not responding"
    fi
else
    check_fail "API container not running"
fi

# Frontend check
echo "Frontend (nginx):"
if docker ps | grep -q myapp_frontend; then
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        check_pass "Frontend is responding"
    else
        check_fail "Frontend is not responding"
    fi
else
    check_fail "Frontend container not running"
fi

# Network connectivity check
echo ""
echo "🌐 Network Connectivity:"
echo "========================"

if docker ps | grep -q myapp_api && docker ps | grep -q myapp_db; then
    if docker exec myapp_api ping postgres -c 1 >/dev/null 2>&1; then
        check_pass "API can reach database"
    else
        check_fail "API cannot reach database"
    fi
fi

if docker ps | grep -q myapp_frontend && docker ps | grep -q myapp_api; then
    if docker exec myapp_frontend nslookup api >/dev/null 2>&1; then
        check_pass "Frontend can resolve API"
    else
        check_fail "Frontend cannot resolve API"
    fi
fi

# Port check
echo ""
echo "🔌 Port Status:"
echo "==============="

check_port() {
    local port=$1
    local service=$2
    if netstat -tulpn 2>/dev/null | grep -q ":$port " || ss -tulpn 2>/dev/null | grep -q ":$port "; then
        check_pass "Port $port ($service) is listening"
    else
        check_fail "Port $port ($service) is not listening"
    fi
}

check_port 3001 "Frontend"
check_port 8001 "API"
check_port 5432 "Database"

# Environment check
echo ""
echo "🔧 Environment Variables:"
echo "========================="

if docker ps | grep -q myapp_api; then
    echo "API Environment:"
    docker exec myapp_api env | grep -E "^DB_|^NODE_ENV" | while read line; do
        check_info "$line"
    done
fi

# Resource usage
echo ""
echo "💾 Resource Usage:"
echo "=================="

echo "Memory usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Stats not available"

echo ""
echo "Disk usage:"
df -h . | tail -1 | awk '{print "Available: " $4 " (" $5 " used)"}'

# Final summary
echo ""
echo "📋 Summary:"
echo "==========="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo "🌐 Application URLs:"
echo "   Frontend: http://$SERVER_IP:3001"
echo "   API:      http://$SERVER_IP:8001"
echo "   Database: $SERVER_IP:5432"
echo ""

# Quick access commands
echo "🔧 Quick Commands:"
echo "   View logs:    docker compose -f docker-compose.production.yml logs -f"
echo "   Restart all:  docker compose -f docker-compose.production.yml restart"
echo "   Stop all:     docker compose -f docker-compose.production.yml down"
echo "   Start all:    docker compose -f docker-compose.production.yml up -d"
echo ""

# Log locations
if docker ps | grep -q myapp_; then
    echo "📁 Container Logs:"
    echo "   Database: docker logs myapp_db"
    echo "   API:      docker logs myapp_api"
    echo "   Frontend: docker logs myapp_frontend"
fi