#!/bin/bash

# System Health Monitor for Household Services
# Runs continuous checks and alerts on issues

LOGFILE="system-health.log"
CHECK_INTERVAL=300  # 5 minutes

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

check_system_health() {
    log_message "🔍 Running system health check..."
    
    # Check containers
    if ! docker compose ps --services --filter "status=running" | grep -q postgres; then
        log_message "❌ ALERT: Postgres container not running!"
        return 1
    fi
    
    if ! docker compose ps --services --filter "status=running" | grep -q api; then
        log_message "❌ ALERT: API container not running!" 
        return 1
    fi
    
    # Check data integrity
    ENGINEERS_COUNT=$(docker compose exec -T postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$ENGINEERS_COUNT" -lt 2 ]; then
        log_message "❌ ALERT: Data loss detected! Only $ENGINEERS_COUNT engineers found. Running recovery..."
        
        # Auto-recovery
        ./docker-data-management.sh restore
        
        # Re-check
        ENGINEERS_COUNT=$(docker compose exec -T postgres psql -U postgres -d household_services -t -c "SELECT COUNT(*) FROM employees;" 2>/dev/null | tr -d ' ' || echo "0")
        
        if [ "$ENGINEERS_COUNT" -ge 2 ]; then
            log_message "✅ Auto-recovery successful: $ENGINEERS_COUNT engineers restored"
        else
            log_message "❌ CRITICAL: Auto-recovery failed!"
            return 1
        fi
    else
        log_message "✅ Data integrity OK: $ENGINEERS_COUNT engineers found"
    fi
    
    # Check volume usage
    VOLUME_USAGE=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}" | grep Volumes | awk '{print $4}')
    log_message "📊 Volume usage: $VOLUME_USAGE reclaimable"
    
    return 0
}

# Run once or continuously
case "${1:-once}" in
    "continuous")
        log_message "🚀 Starting continuous monitoring (every ${CHECK_INTERVAL}s)"
        while true; do
            check_system_health
            sleep $CHECK_INTERVAL
        done
        ;;
    "once")
        check_system_health
        ;;
    *)
        echo "Usage: $0 {once|continuous}"
        echo "  once       - Run health check once"
        echo "  continuous - Run continuous monitoring"
        ;;
esac