#!/bin/bash

# Complete Fresh Start Script - Ensures database is properly initialized

echo "🔥 Starting Fresh Development Environment"
echo "========================================"

# Function to check service status
check_service() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker compose ps $service_name | grep -q "healthy\|running"; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "⏳ Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start"
    return 1
}

# Stop everything
echo "🛑 Stopping all containers..."
docker compose down

# Optional: Remove volumes for completely fresh start
read -p "🗑️ Do you want to reset the database completely? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing database volume..."
    docker volume rm myapp_postgres_data 2>/dev/null || echo "Volume didn't exist"
fi

# Start database first
echo "🚀 Starting PostgreSQL database..."
docker compose up -d postgres

# Wait for database to be healthy
if ! check_service "postgres"; then
    echo "❌ Database failed to start. Exiting."
    exit 1
fi

# Start migration service
echo "🔄 Running migrations..."
docker compose up migrations

# Check migration status
migration_exit_code=$(docker compose ps migrations --format "table {{.Status}}" | grep -o "Exited ([0-9]*)" | grep -o "[0-9]*")
if [ "$migration_exit_code" = "0" ]; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migrations may have had issues, but continuing..."
fi

# Start API
echo "🚀 Starting API service..."
docker compose up -d api

# Wait for API to be healthy
if ! check_service "api"; then
    echo "❌ API failed to start. Exiting."
    exit 1
fi

# Start frontend
echo "🚀 Starting Frontend..."
docker compose up -d frontend

# Wait for frontend
if ! check_service "frontend"; then
    echo "❌ Frontend failed to start. Exiting."
    exit 1
fi

# Verify database content
echo "🔍 Verifying database content..."
SERVICES_COUNT=$(docker compose exec postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM services;" 2>/dev/null | xargs)
CATEGORIES_COUNT=$(docker compose exec postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM service_categories;" 2>/dev/null | xargs)

echo "📊 Database Status:"
echo "   - Categories: $CATEGORIES_COUNT/7"
echo "   - Services: $SERVICES_COUNT/31"

if [ "$CATEGORIES_COUNT" = "7" ] && [ "$SERVICES_COUNT" = "31" ]; then
    echo "✅ Database has complete data!"
else
    echo "⚠️ Database may be missing some data"
fi

echo ""
echo "🎉 Environment is ready!"
echo "========================================"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 API: http://localhost:8001"
echo "🗄️ pgAdmin: http://localhost:5050"
echo "========================================"

# Show running containers
echo "📋 Running services:"
docker compose ps