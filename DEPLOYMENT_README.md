# 🏠 Happy Homes - Mac Deployment Guide

## 📦 Deployment Package Contents

This deployment package contains everything needed to run the Household Services application on a new Mac using Docker Hub images.

### 📋 What You Need on the Target Mac:
- ✅ **Docker Desktop** (install from: https://www.docker.com/products/docker-desktop/)
- ✅ **Internet Connection** (to pull images from Docker Hub)
- ✅ **These Files**:
  - `docker-compose.production.yml`
  - `deploy-to-new-mac.sh`
  - `backend/migrations/` folder
  - `backend/scripts/` folder
  - `nginx.conf`

## 🚀 Quick Deployment (3 Steps)

### Step 1: Install Docker Desktop
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Verify it's running (you'll see Docker icon in system tray)

### Step 2: Copy Files
Copy this entire deployment folder to your new Mac

### Step 3: Run Deployment Script
```bash
cd path/to/deployment/folder
./deploy-to-new-mac.sh
```

## 🎯 What the Script Does

1. ✅ **Checks Docker** installation and status
2. 🔄 **Pulls Images** from Docker Hub:
   - `1934/myapp_api_v1:latest` (Backend API)
   - `1934/myapp_frontend_v1:latest` (React Frontend)
   - `postgres:15-alpine` (Database)
3. 🚀 **Starts Services** with health checks
4. 🧪 **Tests Endpoints** to verify deployment
5. 📋 **Shows Access URLs** and login credentials

## 🌐 Access URLs After Deployment

- **Frontend Application**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **Database**: localhost:5432

## 🔐 Login Credentials

- **Email**: admin@happyhomes.com
- **Password**: password123

## 📊 Engineers Workload Dashboard Features

After login, navigate to "Engineers Workload Dashboard" to test:

- ✅ **Current Workload View** - Real-time task distribution
- ✅ **Historical Reports** - Daily/Weekly/Monthly analytics
- ✅ **Date Filtering** - Custom date ranges & presets
- ✅ **CSV Export** - Comprehensive data export
- ✅ **Modern UI** - Beautiful animated interface

## 🆘 Troubleshooting

### If containers don't start:
```bash
# Check Docker is running
docker info

# View logs
docker compose -f docker-compose.production.yml logs

# Restart services
docker compose -f docker-compose.production.yml restart
```

### If images fail to pull:
- Check internet connection
- Verify Docker Hub is accessible
- Try manual pull: `docker pull 1934/myapp_api_v1:latest`

### If ports are in use:
```bash
# Kill processes using ports 3001, 8001, 5432
lsof -ti:3001 | xargs kill -9
lsof -ti:8001 | xargs kill -9  
lsof -ti:5432 | xargs kill -9
```

## 🏷️ Version Information

- **Version**: 1st-container-version
- **Images**: 
  - API: `1934/myapp_api_v1:latest`
  - Frontend: `1934/myapp_frontend_v1:latest`
  - Database: `postgres:15-alpine`
- **Deployment Date**: November 7, 2025

## 📞 Support

If you encounter issues:
1. Check Docker Desktop is running
2. Verify internet connection
3. Run the deployment script again
4. Check the troubleshooting section above

---

**Happy Testing! 🎉**