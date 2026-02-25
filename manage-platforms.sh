#!/bin/bash
# Platform Management Script
# Helps manage Mac (development) and Ubuntu (production) environments

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

show_help() {
    cat << EOF
Platform Management Script for Happy Homes

USAGE:
    $0 <platform> <action>

PLATFORMS:
    mac     - Mac development environment
    ubuntu  - Ubuntu production environment

ACTIONS:
    start   - Start the platform services
    stop    - Stop the platform services
    build   - Build images for the platform
    logs    - Show logs for the platform
    status  - Show status of services
    clean   - Clean up platform resources

EXAMPLES:
    $0 mac start          # Start Mac development environment
    $0 ubuntu build       # Build Ubuntu production images
    $0 mac logs           # Show Mac development logs
    $0 ubuntu status      # Check Ubuntu production status

PLATFORM DIFFERENCES:
    Mac (Development):
        - Uses docker-compose.yml
        - ARM64/AMD64 compatible
        - Development volumes (live reload)
        - No resource limits
        - Container names: myapp_*
        - Network: myapp_net

    Ubuntu (Production):
        - Uses docker-compose.ubuntu.yml
        - linux/amd64 optimized
        - Production volumes (no live reload)
        - Resource limits enforced
        - Container names: happyhomes_*_ubuntu
        - Network: happyhomes_net_ubuntu

FILES BY PLATFORM:
    Mac Development:
        - docker-compose.yml
        - .env
        - backend/Dockerfile.node
        - Dockerfile
        - nginx.conf

    Ubuntu Production:
        - docker-compose.ubuntu.yml
        - .env.ubuntu
        - backend/Dockerfile.ubuntu
        - Dockerfile.ubuntu
        - nginx.ubuntu.conf
        - ubuntu-deploy/deploy-ubuntu.sh
        - ubuntu-deploy/build-push-ubuntu.sh
EOF
}

mac_start() {
    log "Starting Mac development environment..."

    if [[ ! -f "docker-compose.yml" ]]; then
        error "docker-compose.yml not found. Are you in the correct directory?"
    fi

    docker compose -f docker-compose.yml up -d
    success "Mac development environment started"

    echo ""
    echo "Development URLs:"
    echo "  Frontend: http://localhost:3001"
    echo "  API:      http://localhost:8001"
    echo "  Database: localhost:5432"
}

mac_stop() {
    log "Stopping Mac development environment..."
    docker compose -f docker-compose.yml down
    success "Mac development environment stopped"
}

mac_build() {
    log "Building Mac development images..."
    docker compose -f docker-compose.yml build
    success "Mac development images built"
}

mac_logs() {
    log "Showing Mac development logs..."
    docker compose -f docker-compose.yml logs -f
}

mac_status() {
    log "Mac development status:"
    docker compose -f docker-compose.yml ps
}

mac_clean() {
    warning "This will remove all Mac development containers and volumes"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f docker-compose.yml down -v --remove-orphans
        docker system prune -f
        success "Mac development environment cleaned"
    fi
}

ubuntu_start() {
    error "Ubuntu start must be run on the Ubuntu server using: sudo ./ubuntu-deploy/deploy-ubuntu.sh deploy"
}

ubuntu_stop() {
    error "Ubuntu stop must be run on the Ubuntu server using: cd /opt/happyhomes && sudo docker compose down"
}

ubuntu_build() {
    log "Building Ubuntu production images on Mac..."

    if [[ ! -f "ubuntu-deploy/build-push-ubuntu.sh" ]]; then
        error "Ubuntu build script not found"
    fi

    ./ubuntu-deploy/build-push-ubuntu.sh build
    success "Ubuntu production images built and pushed to Docker Hub"

    echo ""
    echo "Next steps:"
    echo "1. Copy ubuntu-deploy/ to your Ubuntu server"
    echo "2. Run: sudo ./ubuntu-deploy/deploy-ubuntu.sh deploy"
}

ubuntu_logs() {
    error "Ubuntu logs must be viewed on the Ubuntu server using: sudo ./ubuntu-deploy/deploy-ubuntu.sh logs"
}

ubuntu_status() {
    error "Ubuntu status must be checked on the Ubuntu server using: sudo ./ubuntu-deploy/deploy-ubuntu.sh status"
}

ubuntu_clean() {
    warning "This will remove Ubuntu build files and local images"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./ubuntu-deploy/build-push-ubuntu.sh clean 2>/dev/null || true
        success "Ubuntu build files cleaned"
    fi
}

show_platform_info() {
    echo ""
    echo "================================================="
    echo "           Platform Information"
    echo "================================================="
    echo ""
    echo "Current Platform Detection:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  OS: macOS (Darwin)"
        echo "  Architecture: $(uname -m)"
        echo "  Recommended: Use 'mac' platform for development"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  OS: Linux"
        echo "  Architecture: $(uname -m)"
        if grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
            echo "  Distribution: Ubuntu"
            echo "  Recommended: Use 'ubuntu' platform for production"
        else
            echo "  Distribution: Other Linux"
            echo "  Note: Ubuntu platform optimized for Ubuntu 24.04"
        fi
    else
        echo "  OS: Unknown ($OSTYPE)"
        echo "  Note: This script is optimized for macOS and Ubuntu"
    fi
    echo ""
    echo "Available Platforms:"
    echo "  mac    - Development environment (ARM64/AMD64)"
    echo "  ubuntu - Production environment (linux/amd64)"
    echo ""
}

main() {
    local platform="${1:-}"
    local action="${2:-}"

    if [[ $# -eq 0 ]]; then
        show_platform_info
        show_help
        exit 0
    fi

    if [[ "$platform" == "help" ]] || [[ "$platform" == "--help" ]] || [[ "$platform" == "-h" ]]; then
        show_help
        exit 0
    fi

    if [[ -z "$platform" ]] || [[ -z "$action" ]]; then
        error "Both platform and action are required. Use '$0 help' for usage information."
    fi

    case "$platform" in
        "mac")
            case "$action" in
                "start") mac_start ;;
                "stop") mac_stop ;;
                "build") mac_build ;;
                "logs") mac_logs ;;
                "status") mac_status ;;
                "clean") mac_clean ;;
                *) error "Unknown action '$action' for mac platform. Use '$0 help' for available actions." ;;
            esac
            ;;
        "ubuntu")
            case "$action" in
                "start") ubuntu_start ;;
                "stop") ubuntu_stop ;;
                "build") ubuntu_build ;;
                "logs") ubuntu_logs ;;
                "status") ubuntu_status ;;
                "clean") ubuntu_clean ;;
                *) error "Unknown action '$action' for ubuntu platform. Use '$0 help' for available actions." ;;
            esac
            ;;
        *)
            error "Unknown platform '$platform'. Use 'mac' or 'ubuntu'."
            ;;
    esac
}

main "$@"