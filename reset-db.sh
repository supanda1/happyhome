#!/bin/bash

# Reset Database Script - Ensures fresh migration every time

echo "🔄 Stopping containers..."
docker compose down

echo "🗑️ Removing database volume to force fresh initialization..."
docker volume rm myapp_postgres_data 2>/dev/null || echo "Volume didn't exist"

echo "🚀 Starting containers with fresh database..."
docker compose up -d postgres

echo "⏳ Waiting for database to initialize..."
sleep 10

echo "🔍 Checking if migration completed..."
docker compose exec postgres psql -U postgres -d household_services -c "SELECT COUNT(*) as services FROM services; SELECT COUNT(*) as categories FROM service_categories;"

echo "🚀 Starting all services..."
docker compose up -d

echo "✅ Database reset complete with fresh migration data!"