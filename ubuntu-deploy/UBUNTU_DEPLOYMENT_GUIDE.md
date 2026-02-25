# Ubuntu 24.04 Production Deployment Guide
## Happy Homes Platform - Separate from Mac Development

---

## 🔍 **Platform Differences Overview**

| Aspect | Mac (Development) | Ubuntu 24.04 (Production) |
|--------|-------------------|---------------------------|
| **Architecture** | ARM64 (M1/M2) or AMD64 | linux/amd64 |
| **Docker Compose** | `docker-compose.yml` | `docker-compose.ubuntu.yml` |
| **Environment** | `.env` (development) | `.env.ubuntu` (production) |
| **Container Names** | `myapp_*` | `happyhomes_*_ubuntu` |
| **Network** | `myapp_net` | `happyhomes_net_ubuntu` |
| **Resource Limits** | None (unlimited) | Defined limits for production |
| **Security** | Development-friendly | Production-hardened |
| **SSL** | Not required | Let's Encrypt SSL |
| **Firewall** | macOS native | UFW configured |
| **Monitoring** | Manual | Automated health checks |
| **Backups** | Manual | Automated daily backups |

---

## 🚀 **Quick Start - Ubuntu 24.04 Server**

### Prerequisites
- Ubuntu 24.04 LTS server
- Root access (sudo)
- Domain pointed to server IP
- Minimum 4GB RAM, 2 CPU cores

### Step 1: Prepare Your Mac (Build Images)
```bash
cd /path/to/household-services

# Build and push Ubuntu-optimized images
./ubuntu-deploy/build-push-ubuntu.sh build
```

### Step 2: Transfer Files to Ubuntu Server
```bash
# Copy deployment files to your server
scp -r ubuntu-deploy/ root@your-server-ip:/tmp/

# Or clone the repo on server
git clone your-repo-url /opt/happyhomes-src
cp -r /opt/happyhomes-src/ubuntu-deploy/ /opt/
```

### Step 3: Run Initial Setup on Ubuntu Server
```bash
# SSH into your Ubuntu server
ssh root@your-server-ip

# Run the setup script
cd /tmp/ubuntu-deploy
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh setup
```

### Step 4: Configure Environment
```bash
# Edit production environment
nano /opt/happyhomes/.env.production

# Change these critical values:
# - POSTGRES_PASSWORD=your_strong_password_here
# - DB_PASSWORD=your_strong_password_here
# - JWT_SECRET=your_super_secret_jwt_key
# - Update ALLOWED_ORIGINS with your domain
```

### Step 5: Deploy Application
```bash
cd /opt/happyhomes
./deploy-ubuntu.sh deploy
```

### Step 6: Setup SSL (Optional but Recommended)
```bash
./deploy-ubuntu.sh ssl
```

---

## 📁 **File Structure Differences**

### Mac Development Structure
```
household-services/
├── docker-compose.yml          # Mac development
├── .env                       # Mac environment
├── backend/
│   └── Dockerfile.node        # Mac-compatible
└── Dockerfile                 # Mac frontend
```

### Ubuntu Production Structure
```
household-services/
├── ubuntu-deploy/                    # 🆕 Ubuntu-specific files
│   ├── deploy-ubuntu.sh             # 🆕 Ubuntu deployment script
│   ├── build-push-ubuntu.sh         # 🆕 Build & push script
│   └── UBUNTU_DEPLOYMENT_GUIDE.md   # 🆕 This guide
├── docker-compose.ubuntu.yml        # 🆕 Ubuntu compose file
├── .env.ubuntu                      # 🆕 Ubuntu environment
├── backend/
│   └── Dockerfile.ubuntu            # 🆕 Ubuntu-optimized backend
├── Dockerfile.ubuntu                # 🆕 Ubuntu-optimized frontend
└── nginx.ubuntu.conf                # 🆕 Ubuntu nginx config
```

### Server Directory Structure (Created Automatically)
```
/opt/happyhomes/              # Main application directory
├── .env.production          # Production environment
├── docker-compose.yml       # Ubuntu compose (copied)
├── data/
│   └── postgres/           # Database persistent storage
├── backups/               # Automated database backups
├── scripts/
│   ├── backup-db.sh      # Backup script
│   └── health-check.sh   # Health monitoring
└── logs/                 # Application logs

/var/log/happyhomes/       # System logs
```

---

## 🔧 **Configuration Details**

### Environment Variables Differences

#### Mac Development (`.env`)
```bash
NODE_ENV=development
DB_HOST=postgres
POSTGRES_PASSWORD=password
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:80
```

#### Ubuntu Production (`.env.ubuntu`)
```bash
NODE_ENV=production
DB_HOST=happyhomes_db_ubuntu
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
ALLOWED_ORIGINS=https://happyhomesworld.com,https://www.happyhomesworld.com
TZ=Asia/Kolkata
LOG_LEVEL=info
```

### Docker Compose Differences

#### Mac (`docker-compose.yml`)
- No resource limits
- Development volumes (live reload)
- Simple networking
- Development-friendly settings

#### Ubuntu (`docker-compose.ubuntu.yml`)
- Resource limits defined
- Production volumes (no live reload)
- Security-hardened networking
- Production optimizations

### Container Naming Convention

| Service | Mac Development | Ubuntu Production |
|---------|----------------|-------------------|
| Database | `myapp_db` | `happyhomes_db_ubuntu` |
| API | `myapp_api` | `happyhomes_api_ubuntu` |
| Frontend | `myapp_frontend` | `happyhomes_frontend_ubuntu` |
| Network | `myapp_net` | `happyhomes_net_ubuntu` |

---

## 🛠 **Deployment Commands**

### On Mac (Build & Push)
```bash
# Build Ubuntu-optimized images
./ubuntu-deploy/build-push-ubuntu.sh build

# Build specific components
./ubuntu-deploy/build-push-ubuntu.sh build-api
./ubuntu-deploy/build-push-ubuntu.sh build-frontend
./ubuntu-deploy/build-push-ubuntu.sh build-db

# Push only (if already built)
./ubuntu-deploy/build-push-ubuntu.sh push-only
```

### On Ubuntu Server
```bash
# Initial setup (run once)
sudo ./deploy-ubuntu.sh setup

# Deploy application
sudo ./deploy-ubuntu.sh deploy

# Setup SSL certificate
sudo ./deploy-ubuntu.sh ssl

# Application management
sudo ./deploy-ubuntu.sh status    # Check status
sudo ./deploy-ubuntu.sh logs     # View logs
sudo ./deploy-ubuntu.sh restart  # Restart services
sudo ./deploy-ubuntu.sh update   # Pull latest images & restart
sudo ./deploy-ubuntu.sh backup   # Manual backup
```

---

## 🔐 **Security Features (Ubuntu Only)**

### Firewall Configuration (UFW)
```bash
# Allowed ports
22/tcp   (SSH)
80/tcp   (HTTP)
443/tcp  (HTTPS)

# Blocked ports
5432     (PostgreSQL - internal only)
8001     (API - internal only)
3001     (Frontend - internal only)
```

### SSL/TLS (Let's Encrypt)
- Automatic certificate generation
- Auto-renewal configured
- HTTPS redirect enabled
- Strong cipher suites

### Container Security
- Non-root users in containers
- Resource limits enforced
- Read-only volumes where applicable
- Security headers configured

---

## 📊 **Monitoring & Maintenance**

### Automated Backups
```bash
# Daily database backup (2 AM)
/opt/happyhomes/scripts/backup-db.sh

# Backup retention: 30 days
# Location: /opt/happyhomes/backups/
```

### Health Monitoring
```bash
# Every 5 minutes check:
# - Container status
# - API health endpoint
# - Frontend availability
# - Auto-restart failed containers
```

### Log Management
```bash
# Application logs
/var/log/happyhomes/

# Docker logs
docker compose logs -f

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log
```

---

## 🔄 **Updates & Maintenance**

### Updating Images (Mac → Ubuntu)
```bash
# On Mac: Build new images
./ubuntu-deploy/build-push-ubuntu.sh build

# On Ubuntu: Pull and deploy
sudo ./deploy-ubuntu.sh update
```

### Rolling Back
```bash
# Tag previous working images first
docker tag current_image:latest current_image:backup

# Then deploy new version
# If issues occur, revert:
docker tag current_image:backup current_image:latest
sudo ./deploy-ubuntu.sh restart
```

---

## 🚨 **Troubleshooting**

### Common Issues

#### 1. Images Not Found
```bash
# Ensure images are pushed from Mac
./ubuntu-deploy/build-push-ubuntu.sh build

# Check Docker Hub
docker pull 1934/happyhomes_api_ubuntu:latest
```

#### 2. Permission Issues
```bash
# Fix data directory permissions
sudo chown -R 999:999 /opt/happyhomes/data/postgres
```

#### 3. Database Connection Issues
```bash
# Check if database is healthy
docker compose ps
docker compose logs postgres

# Check environment variables
cat .env.production | grep -E "(DB_|POSTGRES_)"
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check nginx configuration
sudo nginx -t
```

### Health Checks
```bash
# API health
curl http://localhost:8001/health

# Frontend health
curl http://localhost:3001/health

# Database health
docker exec happyhomes_db_ubuntu pg_isready -U postgres
```

---

## 📋 **Deployment Checklist**

### Pre-Deployment (Mac)
- [ ] Build Ubuntu images: `./ubuntu-deploy/build-push-ubuntu.sh build`
- [ ] Verify images pushed to Docker Hub
- [ ] Copy `ubuntu-deploy/` to server

### Server Setup (Ubuntu)
- [ ] Run initial setup: `sudo ./deploy-ubuntu.sh setup`
- [ ] Edit `.env.production` with secure values
- [ ] Configure domain DNS (A record)
- [ ] Deploy application: `sudo ./deploy-ubuntu.sh deploy`
- [ ] Setup SSL: `sudo ./deploy-ubuntu.sh ssl`
- [ ] Test application access

### Post-Deployment
- [ ] Verify all services running: `sudo ./deploy-ubuntu.sh status`
- [ ] Test application functionality
- [ ] Verify automated backups working
- [ ] Document admin credentials
- [ ] Setup monitoring alerts (optional)

---

## 🆘 **Emergency Procedures**

### Complete Service Restart
```bash
cd /opt/happyhomes
sudo docker compose down
sudo docker compose up -d
```

### Database Recovery
```bash
# Stop services
sudo docker compose down

# Restore from backup
sudo gunzip < /opt/happyhomes/backups/db_backup_YYYYMMDD.sql.gz | \
sudo docker exec -i happyhomes_db_ubuntu psql -U postgres -d household_services

# Start services
sudo docker compose up -d
```

### Emergency Rollback
```bash
# Use previous working images
sudo docker compose down
sudo docker compose pull  # Or restore specific image tags
sudo docker compose up -d
```

---

## 📞 **Support Information**

- **Logs Location**: `/var/log/happyhomes/`
- **Backup Location**: `/opt/happyhomes/backups/`
- **Configuration**: `/opt/happyhomes/.env.production`
- **Scripts Location**: `/opt/happyhomes/scripts/`

### Key Commands for Support
```bash
# Service status
sudo ./deploy-ubuntu.sh status

# View logs
sudo ./deploy-ubuntu.sh logs

# Manual backup
sudo ./deploy-ubuntu.sh backup

# System health
sudo docker system df
sudo df -h
sudo free -h
```

---

**🎉 Your Ubuntu 24.04 deployment is now completely separate from your Mac development environment!**

Both can run simultaneously without conflicts. Mac for development, Ubuntu for production.