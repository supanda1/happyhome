#!/bin/bash

# Docker Data Management for Household Services
# Prevents data loss and manages volume conflicts

set -e

# Ensure we're in the correct project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Run this script from the project root directory."
    exit 1
fi

PROJECT_NAME="household-services"
DB_VOLUME="household-services_postgres_data"
EXPECTED_VOLUME="$DB_VOLUME"

echo "🔧 Household Services - Docker Data Management"
echo "=============================================="

# Function to check data integrity
check_data_integrity() {
    echo "🔍 Checking data integrity..."
    
    if ! docker compose ps postgres &>/dev/null; then
        echo "❌ Postgres container not running"
        return 1
    fi
    
    ENGINEERS_COUNT=$(docker compose exec -T postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$ENGINEERS_COUNT" -ge 2 ]; then
        echo "✅ Data integrity OK: $ENGINEERS_COUNT engineers found"
        return 0
    else
        echo "⚠️  Data integrity issue: Only $ENGINEERS_COUNT engineers found (expected 2+)"
        return 1
    fi
}

# Function to restore essential data  
restore_essential_data() {
    echo "🔄 Restoring essential data..."
    
    docker compose exec -T postgres psql -U postgres -d household_services << 'EOF'
-- Restore engineers (idempotent)
INSERT INTO public.employees (id, employee_id, name, expertise, phone, email, address, is_active, created_at, updated_at) 
SELECT gen_random_uuid(), 'EPM001', 'Sunil Kumar', 
       '["AC Cleaning","Appliance Repair","Basin & Sink","Bath Fittings","Bathroom Cleaning","CAB Booking","Car Wash","Courier Service","Electrical Safety Check","Fan Installation","GST Registration","Grouting","Health Checkup"]', 
       '9731739111', 'sunil1@gmail.com', 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_id = 'EPM001');

INSERT INTO public.employees (id, employee_id, name, expertise, phone, email, address, is_active, created_at, updated_at) 
SELECT gen_random_uuid(), 'EMP002', 'Debashis', 
       '["Home Repairs","House Painting","ITR Filing","Lighting Solutions","Medicine Delivery","PAN Card Services","Photographer","Pipes","Salon at Home","Stamp Paper & Agreement","Septic Tank Cleaning","Switch & Socket","Tile Work","Toilets","Vehicle Breakdown","Water Purifier Cleaning","Water Tank","Water Tank Cleaning","Wiring Installation"]', 
       '9731739222', 'debasish@gmail.com', 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_id = 'EMP002');

-- Show final status
SELECT employee_id, name, phone FROM employees WHERE employee_id IN ('EPM001', 'EMP002');
EOF
    
    echo "✅ Essential data restoration completed"
}

# Function to clean up orphaned volumes
cleanup_orphaned_volumes() {
    echo "🧹 Cleaning up orphaned postgres volumes..."
    
    # Stop containers first to avoid conflicts
    echo "Stopping containers to safely remove volumes..."
    docker compose down 2>/dev/null || true
    
    # List all postgres volumes
    POSTGRES_VOLUMES=$(docker volume ls --format "{{.Name}}" | grep postgres || true)
    
    if [ -n "$POSTGRES_VOLUMES" ]; then
        echo "Found postgres volumes:"
        echo "$POSTGRES_VOLUMES"
        
        # Keep only the current project volume
        for vol in $POSTGRES_VOLUMES; do
            if [ "$vol" != "$EXPECTED_VOLUME" ]; then
                echo "🗑️  Removing orphaned volume: $vol"
                docker volume rm "$vol" 2>/dev/null || echo "   (Volume in use or already removed)"
            else
                echo "✅ Keeping correct volume: $vol"
            fi
        done
    else
        echo "No postgres volumes found."
    fi
    
    # Show final volume state
    echo "📊 Final postgres volumes:"
    docker volume ls | grep postgres || echo "No postgres volumes remaining"
    
    echo "✅ Volume cleanup completed"
}

# Function to backup current data
backup_data() {
    BACKUP_FILE="household-services-backup-$(date +%Y%m%d-%H%M%S).sql"
    echo "💾 Creating backup: $BACKUP_FILE"
    
    docker compose exec -T postgres pg_dump -U postgres -d household_services > "$BACKUP_FILE"
    echo "✅ Backup saved: $BACKUP_FILE"
}

# Main menu
case "${1:-menu}" in
    "check")
        check_data_integrity
        ;;
    "restore")
        restore_essential_data
        ;;
    "cleanup")
        cleanup_orphaned_volumes
        ;;
    "backup")
        backup_data
        ;;
    "full-recovery")
        echo "🚑 Full recovery process..."
        cleanup_orphaned_volumes
        docker compose up -d postgres
        sleep 10
        restore_essential_data
        check_data_integrity
        ;;
    "status")
        echo "📊 Current status:"
        echo "- Project: $PROJECT_NAME"
        echo "- DB Volume: $DB_VOLUME"
        docker compose ps
        echo ""
        docker volume ls | grep postgres
        echo ""
        check_data_integrity
        ;;
    *)
        echo "Usage: $0 {check|restore|cleanup|backup|full-recovery|status}"
        echo ""
        echo "Commands:"
        echo "  check        - Check data integrity"
        echo "  restore      - Restore missing essential data"
        echo "  cleanup      - Remove orphaned postgres volumes"  
        echo "  backup       - Create database backup"
        echo "  full-recovery - Complete recovery process"
        echo "  status       - Show current system status"
        ;;
esac