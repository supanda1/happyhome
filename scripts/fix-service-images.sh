#!/bin/bash
# Fix Service Images Script
# Applies the image fix migration to the database

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Configuration
POSTGRES_CONTAINER="myapp_db"
DB_NAME="household_services"
DB_USER="postgres"

check_docker() {
    if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
        error "PostgreSQL container '$POSTGRES_CONTAINER' is not running. Please start your development environment first."
    fi
    success "PostgreSQL container is running"
}

apply_image_fixes() {
    log "Applying service image fixes..."

    # Get the directory where this script is located
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    MIGRATION_FILE="$PROJECT_DIR/backend/migrations/fix-service-images.sql"

    if [[ ! -f "$MIGRATION_FILE" ]]; then
        error "Migration file not found: $MIGRATION_FILE"
    fi

    # Apply the migration
    docker exec -i "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_FILE"

    if [[ $? -eq 0 ]]; then
        success "Service image fixes applied successfully"
    else
        error "Failed to apply service image fixes"
    fi
}

verify_changes() {
    log "Verifying service images..."

    # Query to check service images
    local query="SELECT name, json_array_length(image_paths) as image_count, image_paths FROM services WHERE image_paths != '[]'::jsonb ORDER BY name LIMIT 10;"

    echo "Sample services with images:"
    docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$query"

    # Count services with images
    local count_query="SELECT COUNT(*) as services_with_images FROM services WHERE image_paths != '[]'::jsonb;"

    echo ""
    echo "Total services with images:"
    docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$count_query"
}

create_missing_image_placeholders() {
    log "Creating missing image placeholders..."

    # Get project directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    PUBLIC_DIR="$PROJECT_DIR/public"

    # Create category images if they don't exist
    mkdir -p "$PUBLIC_DIR/images/categories"

    # Create a simple placeholder image for general services (using existing image as source)
    if [[ ! -f "$PUBLIC_DIR/images/categories/general-service.jpg" ]]; then
        if [[ -f "$PUBLIC_DIR/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg" ]]; then
            cp "$PUBLIC_DIR/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg" \
               "$PUBLIC_DIR/images/categories/general-service.jpg"
            log "Created general service placeholder image"
        fi
    fi

    # Ensure plumbing category image exists
    if [[ ! -f "$PUBLIC_DIR/images/categories/plumbing.jpg" ]]; then
        if [[ -f "$PUBLIC_DIR/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg" ]]; then
            cp "$PUBLIC_DIR/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg" \
               "$PUBLIC_DIR/images/categories/plumbing.jpg"
            log "Created plumbing category image"
        fi
    fi

    success "Image placeholders created"
}

show_service_mapping() {
    log "Current service to image mapping:"

    local query="
    SELECT
        s.name,
        s.image_paths->>0 as primary_image
    FROM services s
    WHERE s.image_paths != '[]'::jsonb
    ORDER BY s.name;"

    docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$query"
}

main() {
    echo "=============================================="
    echo "        Service Images Fix Script"
    echo "=============================================="
    echo ""

    check_docker
    create_missing_image_placeholders
    apply_image_fixes
    verify_changes

    echo ""
    echo "=============================================="
    show_service_mapping
    echo "=============================================="
    echo ""
    success "Service images have been fixed!"
    echo ""
    echo "🎯 What was fixed:"
    echo "  ✅ Each service now has unique images"
    echo "  ✅ Plumbing services have plumbing images"
    echo "  ✅ Electrical services have electrical images"
    echo "  ✅ Cleaning services have cleaning images"
    echo "  ✅ No more bath service images for all services"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Restart your frontend: docker compose restart frontend"
    echo "  2. Clear browser cache and refresh http://localhost:3001"
    echo "  3. Check that services now show different images"
}

main "$@"