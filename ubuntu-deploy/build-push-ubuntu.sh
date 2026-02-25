#!/bin/bash
# Build and Push Ubuntu-specific Docker Images
# Run this script on your Mac to build and push Ubuntu-optimized images

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_HUB_USER="1934"
APP_VERSION="ubuntu-v1.0"
PLATFORM="linux/amd64"

# Image names
DB_IMAGE="$DOCKER_HUB_USER/happyhomes_db_ubuntu:$APP_VERSION"
API_IMAGE="$DOCKER_HUB_USER/happyhomes_api_ubuntu:$APP_VERSION"
FRONTEND_IMAGE="$DOCKER_HUB_USER/happyhomes_frontend_ubuntu:$APP_VERSION"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi

    if ! docker buildx version &> /dev/null; then
        error "Docker buildx is not available"
    fi

    success "Docker and buildx are available"
}

docker_login() {
    log "Logging into Docker Hub..."

    if ! docker info | grep -q "Username:"; then
        warning "Not logged into Docker Hub"
        read -p "Enter Docker Hub username: " username
        docker login -u "$username"
    fi

    success "Docker Hub login successful"
}

build_database_image() {
    log "Building PostgreSQL database image for Ubuntu..."

    # Create a temporary directory for database build
    mkdir -p ./ubuntu-deploy/db-build

    cat > ./ubuntu-deploy/db-build/Dockerfile << 'EOF'
# Ubuntu-optimized PostgreSQL with initial data
FROM postgres:15-alpine

# Set platform
LABEL platform="linux/amd64"
LABEL environment="ubuntu-production"

# Install additional tools
RUN apk add --no-cache \
    curl \
    wget \
    bash \
    tzdata

# Set timezone
RUN cp /usr/share/zoneinfo/Asia/Kolkata /etc/localtime && \
    echo "Asia/Kolkata" > /etc/timezone

# Copy initialization scripts
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Set proper permissions
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD pg_isready -U postgres || exit 1

EXPOSE 5432
EOF

    # Copy database initialization files
    mkdir -p ./ubuntu-deploy/db-build/init-scripts
    if [ -f "./backend/migrations/final_complete_setup.sql" ]; then
        cp ./backend/migrations/final_complete_setup.sql ./ubuntu-deploy/db-build/init-scripts/01-setup.sql
    else
        warning "Database setup file not found, creating minimal setup"
        echo "SELECT 1;" > ./ubuntu-deploy/db-build/init-scripts/01-setup.sql
    fi

    # Build database image
    docker buildx build \
        --platform "$PLATFORM" \
        --file ./ubuntu-deploy/db-build/Dockerfile \
        --tag "$DB_IMAGE" \
        --tag "$DOCKER_HUB_USER/happyhomes_db_ubuntu:latest" \
        ./ubuntu-deploy/db-build

    success "Database image built successfully"
}

build_api_image() {
    log "Building API image for Ubuntu..."

    docker buildx build \
        --platform "$PLATFORM" \
        --file ./backend/Dockerfile.ubuntu \
        --tag "$API_IMAGE" \
        --tag "$DOCKER_HUB_USER/happyhomes_api_ubuntu:latest" \
        ./backend

    success "API image built successfully"
}

build_frontend_image() {
    log "Building Frontend image for Ubuntu..."

    docker buildx build \
        --platform "$PLATFORM" \
        --file ./Dockerfile.ubuntu \
        --tag "$FRONTEND_IMAGE" \
        --tag "$DOCKER_HUB_USER/happyhomes_frontend_ubuntu:latest" \
        .

    success "Frontend image built successfully"
}

push_images() {
    log "Pushing images to Docker Hub..."

    # Push all images
    docker push "$DB_IMAGE"
    docker push "$DOCKER_HUB_USER/happyhomes_db_ubuntu:latest"

    docker push "$API_IMAGE"
    docker push "$DOCKER_HUB_USER/happyhomes_api_ubuntu:latest"

    docker push "$FRONTEND_IMAGE"
    docker push "$DOCKER_HUB_USER/happyhomes_frontend_ubuntu:latest"

    success "All images pushed to Docker Hub"
}

verify_images() {
    log "Verifying built images..."

    # Check if images exist locally
    for image in "$DB_IMAGE" "$API_IMAGE" "$FRONTEND_IMAGE"; do
        if docker images | grep -q "$image"; then
            success "Image exists: $image"
        else
            error "Image missing: $image"
        fi
    done
}

cleanup() {
    log "Cleaning up temporary files..."
    rm -rf ./ubuntu-deploy/db-build
    success "Cleanup completed"
}

show_deployment_info() {
    echo ""
    echo "=========================================="
    echo "Ubuntu Images Built Successfully!"
    echo "=========================================="
    echo ""
    echo "Images pushed to Docker Hub:"
    echo "  Database:  $DB_IMAGE"
    echo "  API:       $API_IMAGE"
    echo "  Frontend:  $FRONTEND_IMAGE"
    echo ""
    echo "To deploy on Ubuntu server:"
    echo "1. Copy ubuntu-deploy/ folder to your server"
    echo "2. Run: sudo ./ubuntu-deploy/deploy-ubuntu.sh setup"
    echo "3. Edit: /opt/happyhomes/.env.production"
    echo "4. Run: sudo ./ubuntu-deploy/deploy-ubuntu.sh deploy"
    echo ""
    echo "Docker Compose file will pull these images:"
    echo "  postgres: $DOCKER_HUB_USER/happyhomes_db_ubuntu:latest"
    echo "  api:      $DOCKER_HUB_USER/happyhomes_api_ubuntu:latest"
    echo "  frontend: $DOCKER_HUB_USER/happyhomes_frontend_ubuntu:latest"
    echo ""
}

main() {
    log "Building Ubuntu-optimized Docker images..."

    check_docker
    docker_login

    # Create buildx builder if not exists
    docker buildx create --name ubuntu-builder --use 2>/dev/null || docker buildx use ubuntu-builder 2>/dev/null || true

    build_database_image
    build_api_image
    build_frontend_image

    verify_images
    push_images

    cleanup
    show_deployment_info

    success "Ubuntu image build and push completed!"
}

# Handle script arguments
case "${1:-build}" in
    "build")
        main
        ;;
    "push-only")
        docker_login
        push_images
        ;;
    "build-db")
        check_docker
        build_database_image
        ;;
    "build-api")
        check_docker
        build_api_image
        ;;
    "build-frontend")
        check_docker
        build_frontend_image
        ;;
    "clean")
        cleanup
        log "Removing local Ubuntu images..."
        docker rmi "$DB_IMAGE" "$API_IMAGE" "$FRONTEND_IMAGE" 2>/dev/null || true
        success "Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {build|push-only|build-db|build-api|build-frontend|clean}"
        echo ""
        echo "Commands:"
        echo "  build          - Build all images and push to Docker Hub"
        echo "  push-only      - Push existing local images to Docker Hub"
        echo "  build-db       - Build only database image"
        echo "  build-api      - Build only API image"
        echo "  build-frontend - Build only frontend image"
        echo "  clean          - Remove local images and temp files"
        exit 1
        ;;
esac