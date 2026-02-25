#!/bin/bash

# Migration Runner Script - Ensures database has required data on every startup

echo "🔄 Starting migration check..."

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -p 5432 -U postgres -d household_services; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Check if we have all required data
SERVICES_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM services;" 2>/dev/null | xargs)
CATEGORIES_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM service_categories;" 2>/dev/null | xargs)
USERS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
BANNERS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM banners;" 2>/dev/null | xargs)
COUPONS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM coupons;" 2>/dev/null | xargs)

echo "📊 Current data: Categories=$CATEGORIES_COUNT, Services=$SERVICES_COUNT, Users=$USERS_COUNT, Banners=$BANNERS_COUNT, Coupons=$COUPONS_COUNT"

# If we don't have the expected data, run migration
if [ "$CATEGORIES_COUNT" != "7" ] || [ "$SERVICES_COUNT" != "32" ] || [ "$USERS_COUNT" != "3" ] || [ "$BANNERS_COUNT" != "3" ] || [ "$COUPONS_COUNT" != "6" ]; then
    echo "⚠️ Incomplete data detected. Running migration..."
    
    # Run the complete setup migration (includes service image paths)
    psql -h postgres -U postgres -d household_services -f /migrations/final_complete_setup.sql
    
    # Verify after migration
    SERVICES_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM services;" | xargs)
    CATEGORIES_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM service_categories;" | xargs)
    USERS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM users;" | xargs)
    BANNERS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM banners;" | xargs)
    COUPONS_COUNT=$(psql -h postgres -U postgres -d household_services -t -c "SELECT COUNT(*) FROM coupons;" | xargs)
    
    echo "✅ Migration complete: Categories=$CATEGORIES_COUNT, Services=$SERVICES_COUNT, Users=$USERS_COUNT, Banners=$BANNERS_COUNT, Coupons=$COUPONS_COUNT"
else
    echo "✅ Database already has complete data"
fi

echo "🚀 Migration check finished"