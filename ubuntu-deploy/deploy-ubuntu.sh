#!/bin/bash
# Ubuntu 24.04 Deployment Script for Happy Homes
# Run this script on your Ubuntu 24.04 server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="happyhomes"
APP_DIR="/opt/happyhomes"
DOCKER_HUB_USER="1934"
BACKUP_DIR="/opt/happyhomes/backups"
LOG_DIR="/var/log/happyhomes"

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

check_ubuntu_version() {
    if ! grep -q "Ubuntu 24.04" /etc/os-release; then
        warning "This script is optimized for Ubuntu 24.04"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

install_dependencies() {
    log "Installing system dependencies..."

    apt update && apt upgrade -y

    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    else
        success "Docker already installed"
    fi

    # Install Docker Compose
    if ! docker compose version &> /dev/null; then
        log "Installing Docker Compose..."
        apt install -y docker-compose-plugin
    else
        success "Docker Compose already installed"
    fi

    # Install other dependencies
    apt install -y \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        curl \
        wget \
        git \
        htop \
        unzip \
        logrotate \
        fail2ban

    success "Dependencies installed successfully"
}

create_app_structure() {
    log "Creating application directory structure..."

    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$APP_DIR/data/postgres"
    mkdir -p "$APP_DIR/config"
    mkdir -p "$APP_DIR/scripts"

    # Set proper permissions
    chown -R root:root "$APP_DIR"
    chmod 755 "$APP_DIR"
    chmod 755 "$BACKUP_DIR"
    chmod 755 "$LOG_DIR"

    success "Directory structure created"
}

setup_environment() {
    log "Setting up environment configuration..."

    if [[ ! -f "$APP_DIR/.env.production" ]]; then
        log "Creating environment file..."
        cat > "$APP_DIR/.env.production" << 'EOF'
# Ubuntu Production Environment
POSTGRES_DB=household_services
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
POSTGRES_HOST_AUTH_METHOD=md5

NODE_ENV=production
DB_HOST=happyhomes_db_ubuntu
DB_PORT=5432
DB_NAME=household_services
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_PASSWORD
PORT=8001
JWT_SECRET=CHANGE_THIS_JWT_SECRET
ALLOWED_ORIGINS=https://happyhomesworld.com,https://www.happyhomesworld.com

VITE_API_BASE_URL=/api
VITE_APP_NAME=Happy Homes
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_MAINTENANCE_MODE=false

TZ=Asia/Kolkata
LOG_LEVEL=info
NODE_OPTIONS="--max-old-space-size=1536"
EOF

        warning "Environment file created at $APP_DIR/.env.production"
        warning "IMPORTANT: Edit this file and change the default passwords!"
        echo "Run: nano $APP_DIR/.env.production"
    else
        success "Environment file already exists"
    fi
}

setup_docker_compose() {
    log "Setting up Docker Compose configuration..."

    cat > "$APP_DIR/docker-compose.yml" << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    platform: linux/amd64
    container_name: happyhomes_db_ubuntu
    env_file: .env.production
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - happyhomes_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d household_services"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 90s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  api:
    image: 1934/myapp_api_v1:latest
    platform: linux/amd64
    container_name: happyhomes_api_ubuntu
    env_file: .env.production
    ports:
      - "127.0.0.1:8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - happyhomes_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 15s
      retries: 3
      start_period: 60s

  frontend:
    image: 1934/myapp_frontend_v1:latest
    platform: linux/amd64
    container_name: happyhomes_frontend_ubuntu
    env_file: .env.production
    ports:
      - "127.0.0.1:3001:80"
    depends_on:
      api:
        condition: service_healthy
    networks:
      - happyhomes_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

volumes:
  postgres_data:
    driver: local

networks:
  happyhomes_network:
    driver: bridge
    name: happyhomes_net_ubuntu
EOF

    success "Docker Compose configuration created"
}

setup_nginx() {
    log "Setting up Nginx reverse proxy..."

    cat > /etc/nginx/sites-available/happyhomes << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name happyhomesworld.com www.happyhomesworld.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Increase upload size
    client_max_body_size 20M;
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/happyhomes /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t && systemctl reload nginx

    success "Nginx configured successfully"
}

setup_firewall() {
    log "Setting up UFW firewall..."

    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing

    # Allow SSH, HTTP, HTTPS
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Block direct access to application ports
    ufw deny 5432
    ufw deny 8001
    ufw deny 3001

    ufw --force enable

    success "Firewall configured"
}

setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Setting up SSL certificate..."

        read -p "Enter your domain (e.g., happyhomesworld.com): " DOMAIN

        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"

        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

        success "SSL certificate installed and auto-renewal configured"
    fi
}

setup_backups() {
    log "Setting up database backups..."

    cat > "$APP_DIR/scripts/backup-db.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/happyhomes/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="happyhomes_db_ubuntu"

mkdir -p "$BACKUP_DIR"

# Create backup
docker exec "$CONTAINER_NAME" pg_dump -U postgres household_services | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

    chmod +x "$APP_DIR/scripts/backup-db.sh"

    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup-db.sh >> $LOG_DIR/backup.log 2>&1") | crontab -

    success "Database backup configured (daily at 2 AM)"
}

deploy_application() {
    log "Deploying application..."

    cd "$APP_DIR"

    # Pull latest images
    docker compose pull

    # Start services
    docker compose up -d

    # Wait for services to be healthy
    log "Waiting for services to start..."
    sleep 30

    # Check service status
    docker compose ps

    success "Application deployed successfully"
}

setup_monitoring() {
    log "Setting up basic monitoring..."

    cat > "$APP_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/happyhomes/health.log"

# Check if containers are running
CONTAINERS=("happyhomes_db_ubuntu" "happyhomes_api_ubuntu" "happyhomes_frontend_ubuntu")

for container in "${CONTAINERS[@]}"; do
    if ! docker ps | grep -q "$container"; then
        echo "$(date): ERROR - Container $container is not running" >> "$LOG_FILE"
        # Restart the service
        cd /opt/happyhomes && docker compose restart "$container"
    fi
done

# Check API health
if ! curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo "$(date): ERROR - API health check failed" >> "$LOG_FILE"
fi

# Check frontend
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "$(date): ERROR - Frontend health check failed" >> "$LOG_FILE"
fi
EOF

    chmod +x "$APP_DIR/scripts/health-check.sh"

    # Add to crontab (check every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/scripts/health-check.sh") | crontab -

    success "Health monitoring configured"
}

main() {
    log "Starting Ubuntu 24.04 deployment for Happy Homes..."

    check_root
    check_ubuntu_version

    install_dependencies
    create_app_structure
    setup_environment
    setup_docker_compose
    setup_nginx
    setup_firewall
    setup_backups
    setup_monitoring

    log "Core setup completed!"

    warning "IMPORTANT NEXT STEPS:"
    echo "1. Edit environment file: nano $APP_DIR/.env.production"
    echo "2. Change default passwords and JWT secret"
    echo "3. Update domain name in nginx config if needed"
    echo "4. Deploy application: cd $APP_DIR && ./deploy-ubuntu.sh deploy"
    echo "5. Setup SSL: ./deploy-ubuntu.sh ssl"

    success "Ubuntu deployment setup completed!"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "deploy")
        deploy_application
        ;;
    "ssl")
        setup_ssl
        ;;
    "backup")
        "$APP_DIR/scripts/backup-db.sh"
        ;;
    "logs")
        cd "$APP_DIR" && docker compose logs -f
        ;;
    "status")
        cd "$APP_DIR" && docker compose ps
        ;;
    "restart")
        cd "$APP_DIR" && docker compose restart
        ;;
    "update")
        cd "$APP_DIR" && docker compose pull && docker compose up -d
        ;;
    *)
        echo "Usage: $0 {setup|deploy|ssl|backup|logs|status|restart|update}"
        echo ""
        echo "Commands:"
        echo "  setup   - Initial server setup (run once)"
        echo "  deploy  - Deploy/start application"
        echo "  ssl     - Setup SSL certificate"
        echo "  backup  - Manual database backup"
        echo "  logs    - View application logs"
        echo "  status  - Check service status"
        echo "  restart - Restart all services"
        echo "  update  - Pull latest images and restart"
        exit 1
        ;;
esac