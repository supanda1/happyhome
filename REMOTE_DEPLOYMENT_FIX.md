# 🚨 Remote Deployment Fix Guide

## Issues Identified:
1. **Frontend Error**: `host not found in upstream "api"` - nginx can't find API container
2. **API Error**: `connect ECONNREFUSED ::1:5432` - API connecting to localhost instead of database container

## Root Cause:
Containers are not running on the same Docker network or using wrong compose file.

## ✅ Solution Steps:

### 1. Stop All Running Containers
```bash
# Stop any running containers
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker network prune -f
```

### 2. Use Correct Production Compose File
```bash
# Make sure you're using the production compose file
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### 3. Verify Network Connectivity
```bash
# Check if all containers are on the same network
docker network ls
docker network inspect myapp_net

# Test container connectivity
docker exec myapp_api ping postgres -c 3
docker exec myapp_frontend nslookup api
```

### 4. Check Environment Variables
```bash
# Verify API environment variables
docker exec myapp_api env | grep DB_

# Expected output:
# DB_HOST=postgres
# DB_PORT=5432
# DB_NAME=household_services
# DB_USER=postgres
# DB_PASSWORD=password
```

### 5. Monitor Startup Order
```bash
# Watch logs in real-time
docker compose -f docker-compose.production.yml logs -f

# Check service dependencies
docker compose -f docker-compose.production.yml ps
```

## 🔧 Emergency Quick Fix Script

Save this as `fix-deployment.sh`:

```bash
#!/bin/bash
echo "🚨 Fixing deployment issues..."

# Stop everything
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Clean networks
docker network prune -f

# Pull latest images
docker pull 1934/myapp_db_v1:latest
docker pull 1934/myapp_api_v1:latest
docker pull 1934/myapp_frontend_v1:latest

# Start with production compose
docker compose -f docker-compose.production.yml up -d

# Wait and check
sleep 30
docker compose -f docker-compose.production.yml ps

echo "✅ Deployment fix completed!"
echo "🌐 Check: http://YOUR_SERVER_IP:3001"
```

## 🔍 Verification Commands:

### Check Container Status:
```bash
docker compose -f docker-compose.production.yml ps
```

### Test API Connection:
```bash
curl http://localhost:8001/health
curl http://localhost:8001/health/db
```

### Test Frontend:
```bash
curl http://localhost:3001/health
```

### Check Network Resolution:
```bash
# From API container
docker exec myapp_api nslookup postgres

# From Frontend container  
docker exec myapp_frontend nslookup api
```

## 📋 Expected Healthy Output:

```bash
$ docker compose -f docker-compose.production.yml ps
NAME             IMAGE                      STATUS
myapp_api        1934/myapp_api_v1:latest   Up (healthy)
myapp_db         1934/myapp_db_v1:latest    Up (healthy)  
myapp_frontend   1934/myapp_frontend_v1:latest Up (healthy)
```

## 🚨 If Still Not Working:

1. **Check Docker Version**: `docker --version` (should be 20.10+)
2. **Check Compose Version**: `docker compose version`
3. **Check Available Memory**: `free -h`
4. **Check Disk Space**: `df -h`
5. **Check Ports**: `netstat -tulpn | grep -E "3001|8001|5432"`

## 📞 Debug Commands:

```bash
# Get detailed container info
docker inspect myapp_api | grep -E "NetworkMode|NetworkSettings" -A 10

# Check nginx config inside container
docker exec myapp_frontend cat /etc/nginx/conf.d/default.conf

# Check API environment
docker exec myapp_api printenv | grep -E "DB_|NODE_ENV"

# Test database from API container
docker exec myapp_api pg_isready -h postgres -p 5432
```