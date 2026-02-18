#!/bin/bash

# Household Services - Development Environment Startup Script
# Runs PostgreSQL, Backend API, and Frontend as separate containers

set -e

echo "🚀 Starting Household Services Development Environment"
echo "=================================================="

# Ensure we're in the correct directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Run this script from the project root directory."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development environment..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down
}

# Trap cleanup function on script exit
trap cleanup EXIT INT TERM

# Pull latest images
echo "📦 Pulling latest base images..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml pull postgres pgadmin redis

# Build containers (if needed)
echo "🔨 Building application containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Start PostgreSQL first and wait for it to be healthy
echo "🗄️  Starting PostgreSQL database..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d household_services >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    counter=$((counter + 1))
    sleep 1
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    echo "❌ PostgreSQL failed to start within $timeout seconds"
    exit 1
fi

# Verify database schema
echo "🔍 Verifying database schema..."
TABLES_COUNT=$(docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$TABLES_COUNT" -lt 10 ]; then
    echo "⚠️  Database schema incomplete ($TABLES_COUNT tables). Re-running initialization..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml restart postgres
    sleep 10
fi

# Start backend API
echo "🔧 Starting Backend API server..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api

# Wait for API to be ready
echo "⏳ Waiting for Backend API to be ready..."
timeout=30
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:8001/health >/dev/null 2>&1; then
        echo "✅ Backend API is ready!"
        break
    fi
    counter=$((counter + 1))
    sleep 1
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    echo "⚠️  Backend API taking longer than expected to start..."
fi

# Start frontend
echo "⚛️  Starting Frontend development server..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend

# Start development tools (pgAdmin & Redis)
echo "🛠️  Starting development tools..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d pgadmin redis

echo ""
echo "🎉 Development Environment Ready!"
echo "================================"
echo ""
echo "📍 Services Available:"
echo "   🌐 Frontend:     http://localhost:3001"
echo "   🔌 Backend API:  http://localhost:8001"
echo "   🗄️  Database:     localhost:5432"
echo "   🔧 pgAdmin:      http://localhost:5050 (admin@admin.com / admin)"
echo "   🔴 Redis:        localhost:6379"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:       docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f [service]"
echo "   Stop all:        docker compose -f docker-compose.yml -f docker-compose.dev.yml down"
echo "   Rebuild:         docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache"
echo "   Shell access:    docker compose -f docker-compose.yml -f docker-compose.dev.yml exec [service] sh"
echo ""
echo "🔄 Development features enabled:"
echo "   • Hot reload for frontend (React/Vite)"
echo "   • Hot reload for backend (Node.js/TypeScript)"
echo "   • Volume mounts for live code changes"
echo "   • Development debugging tools"
echo ""

# Show container status
echo "📊 Container Status:"
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Wait for user input to keep containers running
echo ""
echo "Press Ctrl+C to stop all containers..."
echo ""

# Keep script running and show logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f