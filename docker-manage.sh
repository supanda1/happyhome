#!/bin/bash

# Docker Management Script for Happy Homes Services
# Usage: ./docker-manage.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Show help
show_help() {
    echo "Happy Homes Services - Docker Management Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  up         Start all services in production mode"
    echo "  dev        Start all services in development mode (with hot reload)"
    echo "  down       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       View logs from all services"
    echo "  build      Build all containers"
    echo "  rebuild    Force rebuild all containers"
    echo "  clean      Remove all containers, networks, and volumes"
    echo "  status     Show status of all services"
    echo "  shell      Open shell in a service container"
    echo "  db         Database management commands"
    echo "  backup     Create database backup"
    echo "  restore    Restore database from backup"
    echo ""
    echo "Options:"
    echo "  -d, --detach    Run in detached mode"
    echo "  -f, --follow    Follow logs output"
    echo "  --no-cache     Build without cache"
    echo ""
    echo "Examples:"
    echo "  $0 up -d                    # Start in production mode (detached)"
    echo "  $0 dev                      # Start in development mode"
    echo "  $0 logs -f frontend         # Follow frontend logs"
    echo "  $0 shell api                # Open shell in API container"
    echo "  $0 db migrate              # Run database migrations"
}

# Start services in production mode
start_production() {
    log_info "Starting Happy Homes Services in production mode..."
    docker compose up "$@"
    log_success "Services started successfully!"
}

# Start services in development mode
start_development() {
    log_info "Starting Happy Homes Services in development mode..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up "$@"
    log_success "Development services started successfully!"
}

# Stop all services
stop_services() {
    log_info "Stopping Happy Homes Services..."
    docker compose down "$@"
    log_success "Services stopped successfully!"
}

# Restart services
restart_services() {
    log_info "Restarting Happy Homes Services..."
    docker compose restart "$@"
    log_success "Services restarted successfully!"
}

# Show logs
show_logs() {
    docker compose logs "$@"
}

# Build containers
build_containers() {
    log_info "Building containers..."
    docker compose build "$@"
    log_success "Containers built successfully!"
}

# Clean up everything
clean_all() {
    log_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker compose down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Show service status
show_status() {
    log_info "Service Status:"
    docker compose ps
}

# Open shell in container
open_shell() {
    local service="$1"
    if [ -z "$service" ]; then
        log_error "Please specify a service: frontend, api, or postgres"
        exit 1
    fi
    
    log_info "Opening shell in $service container..."
    docker compose exec "$service" /bin/sh
}

# Database management
manage_database() {
    local action="$1"
    case "$action" in
        "migrate")
            log_info "Running database migrations..."
            docker compose exec api npm run migrate
            ;;
        "seed")
            log_info "Seeding database..."
            docker compose exec api npm run seed
            ;;
        "reset")
            log_warning "This will reset the database. Are you sure? (y/N)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                docker compose exec api npm run db:reset
            fi
            ;;
        *)
            log_error "Unknown database action: $action"
            echo "Available actions: migrate, seed, reset"
            ;;
    esac
}

# Create database backup
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    log_info "Creating database backup: $backup_file"
    docker compose exec -T postgres pg_dump -U postgres household_services > "$backup_file"
    log_success "Database backup created: $backup_file"
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    if [ -z "$backup_file" ]; then
        log_error "Please specify backup file path"
        exit 1
    fi
    
    log_warning "This will restore database from $backup_file. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Restoring database from $backup_file..."
        docker compose exec -T postgres psql -U postgres household_services < "$backup_file"
        log_success "Database restored successfully!"
    fi
}

# Main script logic
main() {
    check_docker
    
    case "$1" in
        "up")
            shift
            start_production "$@"
            ;;
        "dev")
            shift
            start_development "$@"
            ;;
        "down")
            shift
            stop_services "$@"
            ;;
        "restart")
            shift
            restart_services "$@"
            ;;
        "logs")
            shift
            show_logs "$@"
            ;;
        "build")
            shift
            build_containers "$@"
            ;;
        "rebuild")
            shift
            build_containers --no-cache "$@"
            ;;
        "clean")
            clean_all
            ;;
        "status")
            show_status
            ;;
        "shell")
            shift
            open_shell "$@"
            ;;
        "db")
            shift
            manage_database "$@"
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            shift
            restore_database "$@"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"