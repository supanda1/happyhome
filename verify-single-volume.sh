#!/bin/bash

# Verify Single Volume Setup
# Ensures only one postgres volume exists and data is intact

echo "🔍 Verifying Single Volume Setup"
echo "================================"

cd "$(dirname "$0")"

# Check postgres volumes
POSTGRES_VOLUMES=$(docker volume ls --format "{{.Name}}" | grep postgres || true)
VOLUME_COUNT=$(echo "$POSTGRES_VOLUMES" | wc -l)

if [ -z "$POSTGRES_VOLUMES" ]; then
    echo "❌ No postgres volumes found!"
    exit 1
elif [ "$VOLUME_COUNT" -eq 1 ]; then
    echo "✅ Single postgres volume found: $POSTGRES_VOLUMES"
else
    echo "⚠️  Multiple postgres volumes found:"
    echo "$POSTGRES_VOLUMES"
    echo ""
    echo "🧹 Cleaning up multiple volumes..."
    ./docker-data-management.sh cleanup
    exit 2
fi

# Verify it's the correct volume name
if [ "$POSTGRES_VOLUMES" = "household-services_postgres_data" ]; then
    echo "✅ Correct volume name: $POSTGRES_VOLUMES"
else
    echo "⚠️  Unexpected volume name: $POSTGRES_VOLUMES"
    echo "   Expected: household-services_postgres_data"
fi

# Check if containers are running
echo ""
echo "📊 Container Status:"
docker compose ps

# Check data integrity
echo ""
echo "🔍 Data Integrity Check:"
if docker compose ps postgres | grep -q "Up"; then
    ENGINEER_COUNT=$(docker compose exec -T postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$ENGINEER_COUNT" -ge 2 ]; then
        echo "✅ Data integrity OK: $ENGINEER_COUNT engineers found"
        
        # Show engineer details
        echo ""
        echo "👥 Engineers in database:"
        docker compose exec -T postgres psql -U postgres -d household_services -c "SELECT employee_id, name, phone FROM employees ORDER BY employee_id;"
    else
        echo "❌ Data integrity issue: Only $ENGINEER_COUNT engineers found"
        echo "🔧 Running data restoration..."
        ./docker-data-management.sh restore
    fi
else
    echo "⚠️  Postgres container not running. Starting services..."
    docker compose up -d postgres
    sleep 5
    $0  # Re-run this script
fi

echo ""
echo "📝 Summary:"
echo "- Single postgres volume: ✅"  
echo "- Correct volume name: $([ "$POSTGRES_VOLUMES" = "household-services_postgres_data" ] && echo "✅" || echo "⚠️")"
echo "- Data integrity: $([ "$ENGINEER_COUNT" -ge 2 ] && echo "✅" || echo "❌")"
echo ""
echo "🎯 Single volume setup is $([ "$VOLUME_COUNT" -eq 1 ] && [ "$ENGINEER_COUNT" -ge 2 ] && echo "VERIFIED ✅" || echo "NEEDS ATTENTION ⚠️")"