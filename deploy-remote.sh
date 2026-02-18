#!/bin/bash

# 🚀 Remote Deployment Script
# Deploy Household Services to a remote server

# Configuration - Edit these values
SERVER_IP=""
SERVER_USER=""
SERVER_PORT="22"
APP_DIR="household-services"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required variables are set
check_config() {
    if [ -z "$SERVER_IP" ] || [ -z "$SERVER_USER" ]; then
        print_error "Please edit this script and set SERVER_IP and SERVER_USER variables"
        echo "Example:"
        echo "  SERVER_IP=\"192.168.1.100\""
        echo "  SERVER_USER=\"ubuntu\""
        exit 1
    fi
}

# Function to test SSH connection
test_ssh() {
    print_status "Testing SSH connection to $SERVER_USER@$SERVER_IP..."
    if ssh -p $SERVER_PORT -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
        print_success "SSH connection successful"
        return 0
    else
        print_error "Cannot connect to server. Please check:"
        echo "  - Server IP: $SERVER_IP"
        echo "  - Username: $SERVER_USER"
        echo "  - SSH key is set up"
        echo "  - Server is accessible"
        return 1
    fi
}

# Function to install Docker on remote server
install_docker() {
    print_status "Installing Docker on remote server..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'EOF'
        # Check if Docker is already installed
        if command -v docker &> /dev/null; then
            echo "Docker is already installed"
            docker --version
            exit 0
        fi

        # Update system
        sudo apt update && sudo apt upgrade -y

        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh

        # Install Docker Compose
        sudo apt install docker-compose-plugin -y

        # Add user to docker group
        sudo usermod -aG docker $USER

        # Clean up
        rm get-docker.sh

        echo "Docker installation completed"
        docker --version
        docker compose version
EOF

    if [ $? -eq 0 ]; then
        print_success "Docker installed successfully"
    else
        print_error "Docker installation failed"
        return 1
    fi
}

# Function to copy files to server
copy_files() {
    print_status "Copying application files to server..."
    
    # Create remote directory
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "mkdir -p $APP_DIR"
    
    # Copy files (excluding unnecessary directories)
    rsync -avz --progress --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'build' \
          -e "ssh -p $SERVER_PORT" \
          ./ $SERVER_USER@$SERVER_IP:$APP_DIR/
    
    if [ $? -eq 0 ]; then
        print_success "Files copied successfully"
    else
        print_error "File copy failed"
        return 1
    fi
}

# Function to deploy application
deploy_app() {
    print_status "Deploying application..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << EOF
        cd $APP_DIR
        
        # Make scripts executable
        chmod +x setup-docker.sh docker-dev.sh
        
        # Run setup
        ./setup-docker.sh
        
        # Check if deployment was successful
        if docker compose ps | grep -q "Up"; then
            echo "Deployment successful!"
        else
            echo "Deployment may have issues. Check logs:"
            docker compose logs --tail=20
            exit 1
        fi
EOF

    if [ $? -eq 0 ]; then
        print_success "Application deployed successfully"
    else
        print_error "Deployment failed"
        return 1
    fi
}

# Function to show deployment info
show_info() {
    print_success "Deployment completed!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend: http://$SERVER_IP:3001"
    echo "   Backend:  http://$SERVER_IP:8001"
    echo ""
    echo "🔧 Management commands (run on server):"
    echo "   View status:    docker compose ps"
    echo "   View logs:      docker compose logs -f"
    echo "   Restart:        docker compose restart"
    echo "   Stop:           docker compose down"
    echo "   Start:          docker compose up -d"
    echo ""
    echo "🔐 SSH into server:"
    echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP"
    echo "   cd $APP_DIR"
    echo ""
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --config-only    Only check configuration, don't deploy"
    echo "  --docker-only    Only install Docker, don't deploy"
    echo "  --files-only     Only copy files, don't deploy"
    echo "  --deploy-only    Only deploy (assumes files are already copied)"
    echo "  --help           Show this help message"
    echo ""
    echo "Before running this script, edit it and set:"
    echo "  SERVER_IP=\"your-server-ip\""
    echo "  SERVER_USER=\"your-username\""
    echo ""
}

# Main deployment function
main() {
    echo "🚀 Household Services Remote Deployment"
    echo "========================================"
    
    case "$1" in
        --help)
            show_usage
            exit 0
            ;;
        --config-only)
            check_config && test_ssh
            exit $?
            ;;
        --docker-only)
            check_config && test_ssh && install_docker
            exit $?
            ;;
        --files-only)
            check_config && test_ssh && copy_files
            exit $?
            ;;
        --deploy-only)
            check_config && test_ssh && deploy_app && show_info
            exit $?
            ;;
        "")
            # Full deployment
            print_status "Starting full deployment..."
            
            # Step 1: Check configuration
            check_config || exit 1
            
            # Step 2: Test SSH connection
            test_ssh || exit 1
            
            # Step 3: Install Docker
            install_docker || exit 1
            
            # Step 4: Copy files
            copy_files || exit 1
            
            # Step 5: Deploy application
            deploy_app || exit 1
            
            # Step 6: Show info
            show_info
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"