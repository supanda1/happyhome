# 🐳 Docker Installation Guide - Household Services

## **Why Docker? Your Problems = Solved! ✅**

| Problem You Faced | Docker Solution |
|-------------------|-----------------|
| ❌ "Works on my machine" issues | ✅ Same environment everywhere |
| ❌ Complex setup on new laptops | ✅ One command installation |
| ❌ Database setup headaches | ✅ Auto-configured PostgreSQL |
| ❌ Node.js version conflicts | ✅ Isolated Node.js environment |
| ❌ Environment variable issues | ✅ Consistent configuration |
| ❌ Deployment rollbacks | ✅ Reliable, tested containers |

---

## **🚀 Quick Start (Any Laptop)**

### 1. **One-Time Setup**
```bash
# Install Docker (one time only)
# macOS: Download from https://docs.docker.com/docker-for-mac/install/
# Windows: Download from https://docs.docker.com/docker-for-windows/install/
# Linux: sudo apt install docker.io docker-compose

# Clone your project and run setup
git clone <your-repo>
cd household-services
./setup-docker.sh
```

### 2. **Daily Usage**
```bash
# Start everything
docker-compose up -d

# View your app
# Frontend: http://localhost:3001
# Backend: http://localhost:8001
# Database: localhost:5432
```

**That's it! 🎉**

---

## **📋 Complete Commands Reference**

### **Development Commands**
```bash
# Start all services
docker-compose up -d

# Stop all services  
docker-compose down

# View logs
docker-compose logs -f

# Restart after code changes
docker-compose restart backend frontend

# Rebuild after major changes
docker-compose build --no-cache
docker-compose up -d
```

### **Database Commands**
```bash
# Access database
docker-compose exec postgres psql -U admin -d household_services

# Backup database
docker-compose exec postgres pg_dump -U admin household_services > backup.sql

# Restore database
docker-compose exec -T postgres psql -U admin household_services < backup.sql
```

### **Troubleshooting Commands**
```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart backend

# Clean up everything (nuclear option)
docker-compose down -v --rmi all
docker system prune -a
```

---

## **🏗️ Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (React)       │    │   (Node.js)     │    │   (Database)    │
│   Port: 3001    │───▶│   Port: 8001    │───▶│   Port: 5432    │
│   Nginx         │    │   TypeScript    │    │   Auto-setup    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Caching)     │
                    │   Port: 6379    │
                    └─────────────────┘
```

---

## **📁 File Structure**

```
household-services/
├── docker-compose.yml          # Main Docker configuration
├── setup-docker.sh            # One-command setup script
├── .env                       # Environment variables
├── nginx.conf                 # Frontend web server config
├── Dockerfile.frontend        # Frontend container definition
├── backend/
│   ├── Dockerfile.nodejs      # Backend container definition
│   ├── .dockerignore         # Optimize builds
│   └── src/                  # Your backend code
├── database/
│   └── init/                 # Database initialization scripts
└── backups/                  # Database backups
```

---

## **🔧 Customization**

### **Environment Variables (.env)**
```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=household_services
DB_USER=admin
DB_PASSWORD=admin123

# Backend Configuration  
NODE_ENV=production
PORT=8001

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8001/api
```

### **Port Changes**
Edit `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Change frontend port to 3002
  - "8002:8001"  # Change backend port to 8002
```

---

## **🚀 Production Deployment**

### **Cloud Deployment**
```bash
# AWS/DigitalOcean/etc
scp -r household-services/ server:/app/
ssh server "cd /app && ./setup-docker.sh"
```

### **Environment-Specific Configs**
```bash
# Create production environment
cp .env .env.production
# Edit .env.production with production values

# Use production environment
docker-compose --env-file .env.production up -d
```

---

## **📊 Monitoring & Health Checks**

### **Built-in Health Checks**
```bash
# Check all service health
docker-compose ps

# Manual health checks
curl http://localhost:8001/health  # Backend
curl http://localhost:3001/health  # Frontend
```

### **View Resource Usage**
```bash
# System resources
docker stats

# Service-specific resources
docker-compose top
```

---

## **🔄 Backup & Recovery**

### **Complete System Backup**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$DATE

# Backup database
docker-compose exec -T postgres pg_dump -U admin household_services > backups/$DATE/database.sql

# Backup uploaded files
docker cp household_backend:/app/uploads backups/$DATE/

# Backup configuration
cp .env docker-compose.yml backups/$DATE/

echo "Backup completed: backups/$DATE"
EOF

chmod +x backup.sh
./backup.sh
```

### **Recovery**
```bash
# Restore from backup
BACKUP_DATE="20241010_143022"  # Your backup date
docker-compose exec -T postgres psql -U admin household_services < backups/$BACKUP_DATE/database.sql
docker cp backups/$BACKUP_DATE/uploads household_backend:/app/
```

---

## **🎯 Benefits You'll Love**

| Benefit | Description |
|---------|-------------|
| **🚀 Fast Setup** | New laptop? 5 minutes to full setup |
| **🔄 Consistent Environment** | Same Node.js, PostgreSQL, configs everywhere |
| **📦 Easy Updates** | `git pull && docker-compose build && docker-compose up -d` |
| **🛡️ Isolated Services** | Backend issues won't crash your database |
| **📊 Easy Monitoring** | Built-in health checks and logging |
| **🔧 Simple Scaling** | Add more backend instances easily |
| **💾 Reliable Backups** | Automated database and file backups |
| **🌐 Production Ready** | Same containers for dev and production |

---

## **❓ FAQ**

**Q: What if I want to go back to non-Docker setup?**
A: Just run `docker-compose down` and use `npm start` as before. Docker doesn't change your source code.

**Q: How do I add new dependencies?**
A: Add to `package.json`, then run `docker-compose build backend` and `docker-compose up -d`

**Q: Can I still edit code normally?**
A: Yes! Edit your code, then restart with `docker-compose restart backend`

**Q: How do I debug issues?**
A: Use `docker-compose logs -f backend` to see real-time logs

**Q: What about database changes?**
A: Database persists between restarts. Use migration scripts in `database/init/`

---

## **🎉 Next Steps**

1. **Try it now**: `./setup-docker.sh`
2. **Test your app**: Visit http://localhost:3001
3. **Make a change**: Edit code, restart container
4. **Share with team**: They just need to run setup script
5. **Deploy to production**: Same containers, different server

**You'll never go back to manual setup! 🚀**