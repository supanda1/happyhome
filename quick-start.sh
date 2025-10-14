#!/bin/bash

# 🚀 Happy Homes - One-Command Setup
# Run this script to get the entire application running in minutes!

set -e  # Exit on any error

echo "🏠 Happy Homes - One-Command Setup"
echo "=================================="
echo "This script will set up your complete household services platform."
echo ""

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}🔹 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should NOT be run as root!"
   print_info "Run it as a regular user: ./quick-start.sh"
   exit 1
fi

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macOS"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        DISTRO="Windows"
    else
        OS="unknown"
        DISTRO="Unknown"
    fi
    
    print_info "Detected: $DISTRO ($OS)"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Docker on different systems
install_docker() {
    print_step "Installing Docker and Docker Compose..."
    
    case $OS in
        "linux")
            # Update package manager
            if command_exists apt-get; then
                sudo apt-get update
                # Install Docker
                if ! command_exists docker; then
                    print_info "Installing Docker via convenience script..."
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    rm get-docker.sh
                    
                    # Add user to docker group
                    sudo usermod -aG docker $USER
                    print_warning "You may need to log out and back in for Docker permissions to take effect."
                fi
                
                # Install Docker Compose plugin if not available
                if ! docker compose version >/dev/null 2>&1; then
                    sudo apt-get install -y docker-compose-plugin
                fi
                
            elif command_exists yum; then
                # RedHat/CentOS/Fedora
                sudo yum update -y
                sudo yum install -y docker docker-compose
                sudo systemctl start docker
                sudo systemctl enable docker
                sudo usermod -aG docker $USER
                
            else
                print_error "Unsupported Linux distribution. Please install Docker manually."
                exit 1
            fi
            ;;
            
        "macos")
            if command_exists brew; then
                brew install --cask docker
                print_info "Docker Desktop installed. Please start Docker Desktop application."
            else
                print_warning "Homebrew not found. Please install Docker Desktop manually:"
                print_info "https://docs.docker.com/docker-for-mac/install/"
                exit 1
            fi
            ;;
            
        "windows")
            print_warning "Windows detected. Please install Docker Desktop manually:"
            print_info "https://docs.docker.com/docker-for-windows/install/"
            print_info "After installation, run this script in Git Bash or WSL."
            exit 1
            ;;
            
        *)
            print_error "Unsupported operating system. Please install Docker manually."
            exit 1
            ;;
    esac
}

# Wait for Docker to be ready
wait_for_docker() {
    print_step "Waiting for Docker to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while ! docker version >/dev/null 2>&1; do
        if [ $attempt -ge $max_attempts ]; then
            print_error "Docker is not responding after $max_attempts attempts."
            print_info "Try starting Docker Desktop or running: sudo systemctl start docker"
            exit 1
        fi
        
        echo -ne "\rAttempting to connect to Docker... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "" # New line after progress
    print_success "Docker is ready!"
}

# Create environment file
create_environment() {
    print_step "Creating environment configuration..."
    
    # Generate random passwords if not exist
    DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)}
    JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 64 2>/dev/null || date +%s | sha256sum | base64 | head -c 64)}
    
    cat > .env << EOF
# 🏠 Happy Homes Environment Configuration
# Generated on: $(date)

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=household_services
DB_USER=admin
DB_PASSWORD=$DB_PASSWORD

# Backend Configuration
NODE_ENV=production
PORT=8001
API_BASE_URL=http://localhost:8001/api

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8001/api

# Security Configuration
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)

# Features Configuration
ENABLE_WHATSAPP=true
ENABLE_SMS=true
ENABLE_EMAIL=true

# Development Configuration
LOG_LEVEL=info
DEBUG_MODE=false

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=10
EOF

    print_success "Environment file created!"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check for Git
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    # Check for curl
    if ! command_exists curl; then
        missing_deps+=("curl")
    fi
    
    # Check for Docker
    if ! command_exists docker; then
        print_warning "Docker not found. Will install automatically."
        INSTALL_DOCKER=true
    else
        # Check Docker Compose
        if ! docker compose version >/dev/null 2>&1; then
            print_warning "Docker Compose not found. Will install automatically."
            INSTALL_DOCKER=true
        else
            print_success "Docker and Docker Compose are available!"
            INSTALL_DOCKER=false
        fi
    fi
    
    # Install missing dependencies
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        
        case $OS in
            "linux")
                if command_exists apt-get; then
                    sudo apt-get update
                    sudo apt-get install -y "${missing_deps[@]}"
                elif command_exists yum; then
                    sudo yum install -y "${missing_deps[@]}"
                fi
                ;;
            "macos")
                if command_exists brew; then
                    brew install "${missing_deps[@]}"
                fi
                ;;
        esac
    fi
    
    print_success "All prerequisites checked!"
}

# Setup application
setup_application() {
    print_step "Setting up Happy Homes application..."
    
    # Make scripts executable
    chmod +x setup-docker.sh docker-dev.sh 2>/dev/null || true
    
    # Run the comprehensive setup
    if [ -f "setup-docker.sh" ]; then
        print_info "Running comprehensive Docker setup..."
        ./setup-docker.sh
    else
        print_info "Running direct Docker setup..."
        
        # Create necessary directories
        mkdir -p database/init backend/uploads backups
        
        # Create environment if not exists
        if [ ! -f ".env" ]; then
            create_environment
        fi
        
        # Start with Docker Compose
        docker compose build --no-cache
        docker compose up -d
        
        # Wait for services
        print_info "Waiting for services to start..."
        sleep 30
        
        # Health checks
        print_info "Performing health checks..."
        
        # Check database
        if docker compose exec -T postgres pg_isready -U admin -d household_services >/dev/null 2>&1; then
            print_success "Database is ready!"
        else
            print_warning "Database might still be starting..."
        fi
        
        # Check backend
        if curl -s http://localhost:8001/health >/dev/null 2>&1; then
            print_success "Backend API is ready!"
        else
            print_warning "Backend API might still be starting..."
        fi
        
        # Check frontend
        if curl -s http://localhost:3001 >/dev/null 2>&1; then
            print_success "Frontend is ready!"
        else
            print_warning "Frontend might still be starting..."
        fi
    fi
}

# Display final information
show_completion_info() {
    echo ""
    echo "🎉🎉🎉 SETUP COMPLETE! 🎉🎉🎉"
    echo "=================================="
    echo ""
    
    print_success "Your Happy Homes platform is ready!"
    echo ""
    
    echo -e "${CYAN}📱 Access Your Application:${NC}"
    echo -e "   🌐 Frontend:     ${GREEN}http://localhost:3001${NC}"
    echo -e "   🔧 Backend API:  ${GREEN}http://localhost:8001${NC}"
    echo -e "   🗄️  Database:     ${GREEN}localhost:5432${NC}"
    echo ""
    
    echo -e "${CYAN}👤 Admin Access:${NC}"
    echo -e "   📧 Email:        ${GREEN}admin@happyhomes.com${NC}"
    echo -e "   🔑 Password:     ${GREEN}admin123${NC}"
    echo -e "   🔗 URL:          ${GREEN}http://localhost:3001${NC} → Profile Menu → Admin Panel"
    echo ""
    
    echo -e "${CYAN}🔧 Quick Commands:${NC}"
    echo -e "   Start services:  ${YELLOW}./docker-dev.sh start${NC}"
    echo -e "   Stop services:   ${YELLOW}./docker-dev.sh stop${NC}"
    echo -e "   View logs:       ${YELLOW}./docker-dev.sh logs${NC}"
    echo -e "   Database shell:  ${YELLOW}./docker-dev.sh db${NC}"
    echo -e "   Service status:  ${YELLOW}./docker-dev.sh status${NC}"
    echo ""
    
    echo -e "${CYAN}📊 What's Included:${NC}"
    echo -e "   ✅ Complete household services platform"
    echo -e "   ✅ Customer & Admin portals"
    echo -e "   ✅ Payment gateway integration"
    echo -e "   ✅ Real-time notifications"
    echo -e "   ✅ Service booking & management"
    echo -e "   ✅ Analytics dashboard"
    echo -e "   ✅ Employee management"
    echo ""
    
    echo -e "${CYAN}🚀 Next Steps:${NC}"
    echo -e "   1. Visit ${GREEN}http://localhost:3001${NC} in your browser"
    echo -e "   2. Login as admin to configure services"
    echo -e "   3. Test the customer booking flow"
    echo -e "   4. Customize branding and settings"
    echo ""
    
    echo -e "${PURPLE}💡 Tips:${NC}"
    echo -e "   • All data persists between restarts"
    echo -e "   • Check './docker-dev.sh' for useful commands"
    echo -e "   • Logs are available via 'docker-compose logs'"
    echo -e "   • Configuration is in '.env' file"
    echo ""
    
    print_info "Enjoy building your household services business! 🏠✨"
}

# Main execution
main() {
    echo ""
    detect_os
    echo ""
    
    # Ask for confirmation
    echo -e "${YELLOW}This will install Docker (if needed) and set up the complete Happy Homes platform.${NC}"
    echo -e "${YELLOW}Estimated time: 5-10 minutes depending on your internet connection.${NC}"
    echo ""
    read -p "Continue? (Y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
        print_info "Setup cancelled by user."
        exit 0
    fi
    
    echo ""
    print_step "Starting automated setup..."
    echo ""
    
    # Execute setup steps
    check_prerequisites
    
    if [ "$INSTALL_DOCKER" = true ]; then
        install_docker
        wait_for_docker
    else
        wait_for_docker
    fi
    
    create_environment
    setup_application
    
    echo ""
    show_completion_info
    
    # Final check
    echo ""
    print_step "Performing final system check..."
    sleep 3
    
    local all_good=true
    
    # Check if containers are running
    if ! docker compose ps | grep -q "Up"; then
        print_error "Some containers are not running!"
        all_good=false
    fi
    
    # Check frontend accessibility
    if ! curl -s http://localhost:3001 >/dev/null 2>&1; then
        print_warning "Frontend not accessible yet. It might need a few more seconds."
    fi
    
    # Check backend accessibility
    if ! curl -s http://localhost:8001/health >/dev/null 2>&1; then
        print_warning "Backend not accessible yet. It might need a few more seconds."
    fi
    
    if [ "$all_good" = true ]; then
        print_success "All systems are operational! 🚀"
    else
        print_warning "Some services might still be starting. Wait 1-2 minutes and check:"
        echo "  docker compose ps"
        echo "  docker compose logs"
    fi
    
    echo ""
    echo -e "${GREEN}🎊 Happy coding! 🎊${NC}"
}

# Run main function
main "$@"