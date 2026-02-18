#!/bin/bash

# 🐳 Docker Development Helper Script
# Quick commands for daily development

case "$1" in
    "start")
        echo "🚀 Starting all services..."
        docker-compose up -d
        echo "✅ Services started!"
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔧 Backend: http://localhost:8001"
        ;;
    
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    
    "restart")
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted!"
        ;;
    
    "logs")
        echo "📋 Showing live logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    "status")
        echo "📊 Service Status:"
        docker-compose ps
        ;;
    
    "build")
        echo "🔨 Rebuilding containers..."
        docker-compose build --no-cache
        docker-compose up -d
        echo "✅ Rebuild complete!"
        ;;
    
    "db")
        echo "🗄️ Connecting to database..."
        docker-compose exec postgres psql -U admin -d household_services
        ;;
    
    "backup")
        DATE=$(date +%Y%m%d_%H%M%S)
        mkdir -p backups
        echo "💾 Creating backup: backup_$DATE.sql"
        docker-compose exec -T postgres pg_dump -U admin household_services > backups/backup_$DATE.sql
        echo "✅ Backup complete!"
        ;;
    
    "seed")
        echo "🌱 Generating seed script from admin changes..."
        SEED_SCRIPT=$(docker-compose exec -T postgres psql -U admin household_services -t -c "SELECT generate_seed_script('manual_export', 'Manually exported seed data');" 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "$SEED_SCRIPT" > "backups/seed_export_$(date +%Y%m%d_%H%M%S).sql"
            echo "✅ Seed script exported to backups/"
        else
            echo "❌ Failed to generate seed script"
        fi
        ;;
    
    "changes")
        echo "📋 Recent admin changes:"
        docker-compose exec -T postgres psql -U admin household_services -c "SELECT table_name, record_name, operation_type, changed_by, created_at FROM admin_recent_changes LIMIT 10;"
        ;;
    
    "stats")
        echo "📊 Database Statistics:"
        docker-compose exec -T postgres psql -U admin household_services -c "
        SELECT 
            'Categories' as type, COUNT(*) as count FROM service_categories WHERE is_active = true
        UNION ALL SELECT 'Subcategories', COUNT(*) FROM service_subcategories WHERE is_active = true  
        UNION ALL SELECT 'Services', COUNT(*) FROM services WHERE is_active = true
        UNION ALL SELECT 'Employees', COUNT(*) FROM employees WHERE is_active = true
        UNION ALL SELECT 'Orders', COUNT(*) FROM orders
        UNION ALL SELECT 'Coupons', COUNT(*) FROM coupons WHERE is_active = true;"
        ;;
    
    "clean")
        echo "🧹 Cleaning up Docker (removes unused containers, images, volumes)..."
        docker-compose down -v
        docker system prune -f
        echo "✅ Cleanup complete!"
        ;;
    
    "reset")
        echo "⚠️  This will delete ALL data and start fresh. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo "🔥 Resetting everything..."
            docker-compose down -v --rmi all
            docker system prune -a -f
            ./setup-docker.sh
            echo "✅ Reset complete!"
        else
            echo "❌ Reset cancelled."
        fi
        ;;
    
    *)
        echo "🐳 Docker Development Helper"
        echo "Usage: $0 {command}"
        echo
        echo "Available commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show live logs"
        echo "  status   - Check service status"
        echo "  build    - Rebuild containers"
        echo "  db       - Connect to database"
        echo "  backup   - Backup database"
        echo "  seed     - Generate seed script from admin changes"
        echo "  changes  - Show recent admin changes"
        echo "  stats    - Show database statistics"
        echo "  clean    - Clean up unused Docker resources"
        echo "  reset    - Complete reset (DANGER: deletes all data)"
        echo
        echo "Examples:"
        echo "  $0 start     # Start your app"
        echo "  $0 logs      # Debug issues"
        echo "  $0 build     # After code changes"
        echo "  $0 seed      # Export admin changes as seed script"
        echo "  $0 stats     # View database statistics"
        ;;
esac