# 🚀 Deployment Guide - Running on Separate Machine

This guide covers deploying your Household Services application on any new machine (laptop, server, cloud instance).

---

## **📋 Prerequisites**

### **Target Machine Requirements:**
- **Operating System**: Linux, macOS, or Windows
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 10GB free space
- **Network**: Internet connection for initial setup

### **Software Requirements:**
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning repository

---

## **🏗️ Method 1: Fresh Installation (Recommended)**

### **Step 1: Install Docker**

#### **Linux (Ubuntu/Debian):**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

#### **macOS:**
```bash
# Install Docker Desktop
# Download from: https://docs.docker.com/docker-for-mac/install/
# Or using Homebrew:
brew install --cask docker

# Verify installation
docker --version
docker compose version
```

#### **Windows:**
```bash
# Install Docker Desktop
# Download from: https://docs.docker.com/docker-for-windows/install/
# Follow the installer instructions

# Verify in PowerShell/CMD
docker --version
docker compose version
```

### **Step 2: Clone and Setup**
```bash
# Clone your repository
git clone <your-repository-url>
cd household-services

# Make scripts executable (Linux/macOS)
chmod +x setup-docker.sh docker-dev.sh

# Run the setup script
./setup-docker.sh

# Wait for setup to complete (5-10 minutes)
```

### **Step 3: Verify Installation**
```bash
# Check if all services are running
docker compose ps

# Test the applications
curl http://localhost:3001  # Frontend
curl http://localhost:8001/health  # Backend API

# View in browser
# Frontend: http://localhost:3001
# Backend API: http://localhost:8001
```

---

## **🌐 Method 2: Server/Cloud Deployment**

### **Step 1: Prepare Server**
```bash
# Connect to your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin
```

### **Step 2: Configure Firewall**
```bash
# Allow necessary ports
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3001    # Frontend
sudo ufw allow 8001    # Backend API
sudo ufw enable
```

### **Step 3: Deploy Application**
```bash
# Clone repository
git clone <your-repository-url>
cd household-services

# Create production environment file
cp .env .env.production

# Edit production settings
nano .env.production
```

#### **Production Environment (.env.production):**
```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=household_services
DB_USER=admin
DB_PASSWORD=your_strong_password_here

# Backend Configuration
NODE_ENV=production
PORT=8001
API_BASE_URL=http://your-domain.com:8001/api

# Frontend Configuration
VITE_API_BASE_URL=http://your-domain.com:8001/api

# Security (generate random strings)
JWT_SECRET=your_jwt_secret_here
COOKIE_SECRET=your_cookie_secret_here

# Email Configuration (if applicable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### **Step 4: Deploy with Production Config**
```bash
# Deploy with production environment
docker compose --env-file .env.production up -d

# Check deployment
docker compose ps
docker compose logs -f
```

---

## **⚙️ Configuration Adjustments**

### **Custom Ports**
Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "80:3001"     # Use port 80 for frontend
  backend:
    ports:
      - "8080:8001"   # Use port 8080 for backend
```

### **Custom Domain Setup**
```bash
# Update environment variables
VITE_API_BASE_URL=http://yourdomain.com:8080/api

# Update nginx.conf for domain
server_name yourdomain.com;
```

### **SSL/HTTPS Setup (Production)**
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update docker-compose.yml to use SSL
# Add volume mapping for certificates
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

## **🔧 Deployment Scripts**

### **Remote Deployment Script**
Create `deploy-remote.sh`:
```bash
#!/bin/bash

# Remote deployment script
SERVER_IP="your-server-ip"
SERVER_USER="your-username"
APP_DIR="/home/$SERVER_USER/household-services"

echo "🚀 Deploying to $SERVER_IP..."

# Copy files to server
scp -r . $SERVER_USER@$SERVER_IP:$APP_DIR/

# Run deployment on server
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd household-services
chmod +x setup-docker.sh docker-dev.sh
./setup-docker.sh
EOF

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://$SERVER_IP:3001"
echo "🔧 Backend: http://$SERVER_IP:8001"
```

### **Update Script**
Create `update-remote.sh`:
```bash
#!/bin/bash

# Update existing deployment
SERVER_IP="your-server-ip"
SERVER_USER="your-username"

echo "🔄 Updating application on $SERVER_IP..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd household-services
git pull origin main
docker compose build --no-cache
docker compose up -d
EOF

echo "✅ Update complete!"
```

---

## **📊 Monitoring & Maintenance**

### **Health Check Script**
Create `health-check.sh`:
```bash
#!/bin/bash

echo "🔍 Health Check Report"
echo "====================="

# Check Docker services
echo "📦 Docker Services:"
docker compose ps

# Check application health
echo -e "\n🌐 Frontend Health:"
curl -s http://localhost:3001/health || echo "❌ Frontend not responding"

echo -e "\n🔧 Backend Health:"
curl -s http://localhost:8001/health || echo "❌ Backend not responding"

# Check database
echo -e "\n🗄️ Database Health:"
docker compose exec postgres pg_isready -U admin -d household_services || echo "❌ Database not responding"

# Check disk space
echo -e "\n💽 Disk Usage:"
df -h

# Check memory usage
echo -e "\n🧠 Memory Usage:"
free -h

echo -e "\n✅ Health check complete!"
```

### **Backup Script for Production**
Create `backup-production.sh`:
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$DATE"
mkdir -p $BACKUP_DIR

echo "💾 Creating backup: $BACKUP_DIR"

# Backup database
docker compose exec -T postgres pg_dump -U admin household_services > $BACKUP_DIR/database.sql

# Backup uploaded files
docker cp household_backend:/app/uploads $BACKUP_DIR/

# Backup configuration
cp .env.production docker-compose.yml $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR/
rm -rf $BACKUP_DIR/

echo "✅ Backup completed: $BACKUP_DIR.tar.gz"

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR.tar.gz s3://your-backup-bucket/
```

---

## **🚨 Troubleshooting**

### **Common Issues & Solutions**

#### **Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :3001
sudo lsof -i :8001

# Stop conflicting services
sudo systemctl stop apache2  # If Apache is running
sudo systemctl stop nginx    # If Nginx is running

# Or change ports in docker-compose.yml
ports:
  - "3002:3001"  # Use different port
```

#### **Permission Denied**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER household-services/
chmod +x *.sh
```

#### **Database Connection Issues**
```bash
# Check database container
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d

# Check database connectivity
docker compose exec postgres pg_isready -U admin
```

#### **Build Failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache

# Check available disk space
df -h
```

#### **Memory Issues**
```bash
# Check memory usage
docker stats

# Increase swap if needed (Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## **📱 Different Deployment Scenarios**

### **Scenario 1: Local Development Machine**
```bash
# Standard setup
./setup-docker.sh

# Access via localhost
Frontend: http://localhost:3001
Backend: http://localhost:8001
```

### **Scenario 2: Team Development Server**
```bash
# Use custom ports to avoid conflicts
# Edit docker-compose.yml
ports:
  - "4001:3001"  # Frontend on 4001
  - "4002:8001"  # Backend on 4002

# Deploy
docker compose up -d

# Access via server IP
Frontend: http://server-ip:4001
Backend: http://server-ip:4002
```

### **Scenario 3: Production Server**
```bash
# Use production environment
docker compose --env-file .env.production up -d

# Use reverse proxy (nginx)
# Frontend: http://yourdomain.com
# Backend: http://api.yourdomain.com
```

### **Scenario 4: Cloud Instance (AWS/DigitalOcean)**
```bash
# Create cloud instance
# SSH into instance
# Follow server deployment steps
# Configure domain and SSL
# Set up automated backups
```

---

## **📋 Deployment Checklist**

### **Pre-Deployment**
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Firewall rules set (if applicable)
- [ ] Domain DNS configured (if applicable)

### **During Deployment**
- [ ] Run `./setup-docker.sh`
- [ ] Check all services are running: `docker compose ps`
- [ ] Test frontend: `curl http://localhost:3001`
- [ ] Test backend: `curl http://localhost:8001/health`
- [ ] Test database connectivity
- [ ] Check logs for errors: `docker compose logs`

### **Post-Deployment**
- [ ] Create first admin user
- [ ] Test complete user flow (registration → order → payment)
- [ ] Set up monitoring/alerts
- [ ] Configure automated backups
- [ ] Document access credentials
- [ ] Set up SSL certificate (production)

---

## **🎯 Quick Commands Reference**

```bash
# Start application
./docker-dev.sh start

# Stop application
./docker-dev.sh stop

# View logs
./docker-dev.sh logs

# Update after code changes
git pull && ./docker-dev.sh build

# Backup database
./docker-dev.sh backup

# Connect to database
./docker-dev.sh db

# Complete reset (careful!)
./docker-dev.sh reset
```

---

## **📞 Support**

If you encounter issues:

1. **Check logs**: `docker compose logs -f`
2. **Check service status**: `docker compose ps`
3. **Restart services**: `docker compose restart`
4. **Clean rebuild**: `docker compose build --no-cache && docker compose up -d`
5. **Check system resources**: `docker stats`

**Remember**: The beauty of Docker is that it works the same everywhere! If it works on your machine, it will work on any other machine with Docker installed. 🚀