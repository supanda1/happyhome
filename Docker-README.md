# 🐳 Docker Setup for Happy Homes Services

This guide explains how to run the Happy Homes Services application using Docker containers.

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+
- At least 4GB RAM available for containers
- Ports 3001, 8001, 5432, and 5050 available

## 🏗️ Architecture

The application consists of 4 main services:

- **Frontend**: React + Vite app served by Nginx (Port 3001)
- **API**: Node.js + TypeScript backend (Port 8001)  
- **Database**: PostgreSQL 15 (Port 5432)
- **PgAdmin**: Database management UI (Port 5050) - Development only

## 🚀 Quick Start

### Option 1: Using Docker Management Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x docker-manage.sh

# Start in production mode
./docker-manage.sh up -d

# Start in development mode (with hot reload)
./docker-manage.sh dev

# View all available commands
./docker-manage.sh help
```

### Option 2: Using Docker Compose Directly

```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 📊 Access URLs

Once containers are running:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **PgAdmin** (dev only): http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

## 🛠️ Management Commands

### Basic Operations

```bash
# Start all services
./docker-manage.sh up

# Start in development mode (hot reload)
./docker-manage.sh dev

# Stop all services
./docker-manage.sh down

# Restart services
./docker-manage.sh restart

# View logs
./docker-manage.sh logs

# View logs for specific service
./docker-manage.sh logs frontend
```

### Building and Maintenance

```bash
# Build containers
./docker-manage.sh build

# Force rebuild (no cache)
./docker-manage.sh rebuild

# Show service status
./docker-manage.sh status

# Clean up everything (removes all containers, volumes)
./docker-manage.sh clean
```

### Database Management

```bash
# Run migrations
./docker-manage.sh db migrate

# Seed database
./docker-manage.sh db seed

# Reset database (WARNING: removes all data)
./docker-manage.sh db reset

# Create backup
./docker-manage.sh backup

# Restore from backup
./docker-manage.sh restore backup_20241029_143000.sql
```

### Container Access

```bash
# Open shell in frontend container
./docker-manage.sh shell frontend

# Open shell in API container
./docker-manage.sh shell api

# Open shell in database container
./docker-manage.sh shell postgres
```

## 🔧 Configuration

### Environment Variables

The containers use environment variables from:
- `.env` - Main configuration
- `backend/.env` - Backend specific config

Key variables:
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=household_services
DB_USER=postgres
DB_PASSWORD=password

# Frontend
VITE_API_BASE_URL=/api
VITE_APP_NAME=Happy Homes

# Backend
NODE_ENV=development
PORT=8001
JWT_SECRET=household-services-super-secret-jwt-key-2024
```

### Port Mapping

| Service  | Container Port | Host Port | Description |
|----------|----------------|-----------|-------------|
| Frontend | 80             | 3001      | React app   |
| API      | 8001           | 8001      | Backend API |
| Database | 5432           | 5432      | PostgreSQL  |
| PgAdmin  | 80             | 5050      | DB Admin    |

## 🔄 Development Workflow

### Hot Reload Setup

Development mode enables hot reload for both frontend and backend:

```bash
# Start development environment
./docker-manage.sh dev

# The following directories are watched for changes:
# - Frontend: ./src, ./public
# - Backend: ./backend/src
```

### Making Changes

1. **Frontend changes**: Edit files in `./src/` - changes reflect immediately
2. **Backend changes**: Edit files in `./backend/src/` - server restarts automatically
3. **Package changes**: Run `./docker-manage.sh rebuild` to reinstall dependencies

## 📁 File Structure

```
household-services/
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development overrides
├── Dockerfile                  # Frontend production image
├── Dockerfile.dev             # Frontend development image
├── nginx.conf                 # Nginx configuration
├── docker-manage.sh           # Management script
├── .dockerignore              # Docker ignore file
├── backend/
│   ├── Dockerfile.node        # Backend image
│   └── docker-compose.yml     # Backend-only compose (legacy)
└── src/                       # Frontend source code
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3001
   lsof -i :8001
   
   # Stop conflicting processes or change ports in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check database health
   ./docker-manage.sh logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Frontend not loading**
   ```bash
   # Check nginx logs
   ./docker-manage.sh logs frontend
   
   # Rebuild frontend
   ./docker-manage.sh rebuild frontend
   ```

4. **API not responding**
   ```bash
   # Check API logs
   ./docker-manage.sh logs api
   
   # Check if database is ready
   ./docker-manage.sh status
   ```

### Health Checks

All services have health checks configured:

```bash
# View health status
docker-compose ps

# Services should show "healthy" status
```

### Volume Issues

If you encounter permission or volume issues:

```bash
# Clean and restart
./docker-manage.sh clean
./docker-manage.sh build
./docker-manage.sh up
```

## 🔒 Security Notes

- Default passwords are for development only
- Change all credentials in production
- Use Docker secrets for sensitive data in production
- Consider using a reverse proxy (nginx/traefik) for production

## 📝 Logs and Monitoring

```bash
# View all logs
./docker-manage.sh logs

# Follow logs in real-time
./docker-manage.sh logs -f

# View specific service logs
./docker-manage.sh logs api
./docker-manage.sh logs frontend
./docker-manage.sh logs postgres
```

## 🚢 Production Deployment

For production deployment:

1. Update environment variables
2. Use production compose file only
3. Configure proper secrets management
4. Set up SSL/TLS termination
5. Configure backup strategies

```bash
# Production deployment
docker-compose up -d
```

## 💾 Data Persistence

- **Database data**: Stored in `postgres_data` volume
- **PgAdmin data**: Stored in `pgadmin_data` volume
- **Redis data**: Stored in `redis_data` volume

Data persists between container restarts unless volumes are explicitly removed.

---

## 🆘 Need Help?

- Check the logs: `./docker-manage.sh logs`
- Restart services: `./docker-manage.sh restart`
- Full reset: `./docker-manage.sh clean && ./docker-manage.sh up`
- View service status: `./docker-manage.sh status`