#!/bin/bash

# 🐳 Household Services - Docker Setup Script
# This script will set up your entire application with one command!

echo "🏠 Setting up Household Services with Docker..."
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   macOS: https://docs.docker.com/docker-for-mac/install/"
    echo "   Linux: https://docs.docker.com/engine/install/"
    echo "   Windows: https://docs.docker.com/docker-for-windows/install/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p database/init
mkdir -p backend/uploads
mkdir -p backups

# Verify database initialization scripts exist
echo "🗄️ Verifying database initialization scripts..."
if [ ! -f "database/init/00-core-schema.sql" ]; then
    echo "❌ Core database schema not found!"
    echo "   Please ensure database/init/00-core-schema.sql exists"
    exit 1
fi

if [ ! -f "database/init/01-seed-master-data.sql" ]; then
    echo "❌ Master data seeding script not found!"
    echo "   Please ensure database/init/01-seed-master-data.sql exists"
    exit 1
fi

if [ ! -f "database/init/02-admin-update-capture.sql" ]; then
    echo "❌ Admin update capture script not found!"
    echo "   Please ensure database/init/02-admin-update-capture.sql exists"
    exit 1
fi

echo "✅ All database initialization scripts found"
echo "   • Core schema: 00-core-schema.sql"
echo "   • Master data: 01-seed-master-data.sql" 
echo "   • Update capture: 02-admin-update-capture.sql"

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=household_services
DB_USER=admin
DB_PASSWORD=admin123

# Backend Configuration
NODE_ENV=production
PORT=8001

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8001/api

# Redis Configuration (optional)
REDIS_URL=redis://redis:6379
EOF

# Pull images and build
echo "📦 Building Docker images (this may take a few minutes)..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check database
DB_STATUS=$(docker-compose exec -T postgres pg_isready -U admin -d household_services 2>/dev/null || echo "Not Ready")
echo "Database: $DB_STATUS"

# Check if tables were created
if [[ "$DB_STATUS" == *"accepting connections"* ]]; then
    TABLE_COUNT=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")
    SERVICE_COUNT=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM services WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    echo "Database tables created: $TABLE_COUNT"
    echo "Services seeded: $SERVICE_COUNT"
fi

# Check backend
BACKEND_STATUS=$(curl -s http://localhost:8001/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "Not Ready")
echo "Backend API: $BACKEND_STATUS"

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "Frontend: Ready"
else
    echo "Frontend: Not Ready (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8001"
echo "🗄️ Database: localhost:5432"
echo ""

# Show seeded data summary if database is ready
if [[ "$DB_STATUS" == *"accepting connections"* ]]; then
    echo "📊 Seeded Data Summary:"
    CATEGORIES=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM service_categories WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    SUBCATEGORIES=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM service_subcategories WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    EMPLOYEES=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM employees WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    BANNERS=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM banners WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    COUPONS=$(docker-compose exec -T postgres psql -U admin -d household_services -t -c "SELECT COUNT(*) FROM coupons WHERE is_active = true;" 2>/dev/null | tr -d ' \n' || echo "0")
    
    echo "   ✅ Service Categories: $CATEGORIES"
    echo "   ✅ Service Subcategories: $SUBCATEGORIES"
    echo "   ✅ Services: $SERVICE_COUNT"
    echo "   ✅ Expert Employees: $EMPLOYEES"
    echo "   ✅ Promotional Banners: $BANNERS"
    echo "   ✅ Active Coupons: $COUPONS"
    echo "   ✅ Admin User: admin@happyhomes.com"
    echo ""
fi

echo "📋 Useful Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Remove all: docker-compose down -v --rmi all"
echo "   Database shell: docker-compose exec postgres psql -U admin -d household_services"
echo ""
echo "🔧 To make changes:"
echo "   1. Edit your code"
echo "   2. Run: docker-compose build"
echo "   3. Run: docker-compose up -d"
echo ""
echo "🚀 Your Household Services platform is ready!"
echo "   Login as admin and start managing your services!"