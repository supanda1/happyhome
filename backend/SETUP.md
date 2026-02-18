# 🏠 Household Services - Complete Setup Guide

This document provides a **one-click setup** for the complete Household Services application with all database tables, seed data, and services.

## 🚀 Quick Start (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Ports 8001, 5432, and 5050 available

### One-Click Setup
```bash
# Navigate to backend directory
cd backend

# Run the complete setup
./start-services.sh
```

That's it! The script will:
- ✅ Setup PostgreSQL database
- ✅ Run complete migration (all tables + seed data)
- ✅ Start the Node.js API server
- ✅ Verify all services are running

## 📊 What Gets Created

### Database Tables
- **Users & Authentication**: `users`, `refresh_tokens`, `user_addresses`
- **Service Management**: `service_categories`, `service_subcategories`, `services`, `service_variants`
- **Orders & Cart**: `orders`, `order_items`, `cart`, `cart_items`
- **Employee Management**: `employees`, `assignment_history`
- **Marketing**: `coupons`, `banners`, `contact_settings`

### Seed Data Included
- **7 Categories**: Plumbing, Electrical, Cleaning, Call A Service, Finance & Insurance, Personal Care, Civil Work
- **32 Subcategories**: All working subcategories with proper routing
- **15+ Services**: Sample services for each subcategory
- **3 Sample Employees**: With different expertise areas
- **3 Sample Coupons**: Welcome offers and discounts
- **Sample Banners**: Hero and promotional banners
- **Contact Settings**: Company information and social links
- **Default Admin User**: Ready-to-use admin account

## 🌐 Access Points

After setup completion:

| Service | URL | Credentials |
|---------|-----|------------|
| **API Server** | http://localhost:8001 | - |
| **API Health** | http://localhost:8001/health | - |
| **API Documentation** | http://localhost:8001/ | - |
| **pgAdmin** | http://localhost:5050 | admin@admin.com / admin |
| **Admin Login** | Frontend URL | admin@happyhomes.com / admin123 |

## 📋 API Endpoints

### Core Endpoints
- `GET /api/categories` - All service categories
- `GET /api/subcategories` - All service subcategories  
- `GET /api/services` - All available services
- `GET /api/employees` - All employees
- `GET /api/coupons` - All active coupons

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - User profile

### Orders & Cart
- `GET /api/cart/:userId` - User cart
- `POST /api/cart/:userId/items` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders/:userId` - User orders

## 🛠️ Management Commands

```bash
# View real-time logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Complete cleanup (removes all data)
docker-compose down --volumes

# Rebuild and restart
docker-compose up --build

# Access database directly
docker-compose exec postgres psql -U postgres -d household_services
```

## 🔍 Troubleshooting

### Common Issues

1. **Port 8001 already in use**
   ```bash
   # Find and kill process using port 8001
   lsof -ti:8001 | xargs kill -9
   ```

2. **Docker permission issues**
   ```bash
   # Ensure Docker is running and you have permissions
   docker info
   ```

3. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   ```

4. **API not starting**
   ```bash
   # Check API logs
   docker-compose logs api
   ```

### Fresh Start
If you encounter issues, do a complete reset:
```bash
# Stop and remove everything
docker-compose down --volumes --remove-orphans

# Clean up Docker system
docker system prune -f

# Start fresh
./start-services.sh
```

## 📁 File Structure

```
backend/
├── migrations/
│   └── 000_complete_setup.sql     # Complete database setup
├── scripts/
│   ├── init-database.sh          # Database initialization
│   └── ...
├── src/                          # Node.js TypeScript source
├── docker-compose.yml            # Docker services configuration
├── Dockerfile.node               # Node.js container setup
├── start-services.sh             # One-click startup script
└── SETUP.md                      # This file
```

## 🔧 Development Mode

For development with hot reload:
```bash
# Start in development mode
docker-compose up --build

# The API will auto-reload on file changes
# Frontend can connect to http://localhost:8001/api
```

## 🏗️ Production Deployment

For production deployment:
1. Update environment variables in `docker-compose.yml`
2. Change default passwords and secrets
3. Use proper SSL certificates
4. Configure reverse proxy (nginx)
5. Set up proper backup strategies

## 📊 Database Schema

The migration creates a complete relational database with:
- **UUID primary keys** for all entities
- **Proper foreign key relationships**
- **Indexed columns** for performance
- **JSONB fields** for flexible data storage
- **Enum types** for status management
- **Timestamp tracking** for all records

## 🎯 Key Features Included

- ✅ **Complete Service Management**: Categories, subcategories, and services
- ✅ **User Authentication**: JWT-based auth with refresh tokens
- ✅ **Order Management**: Full order lifecycle with status tracking
- ✅ **Employee Assignment**: Service assignment and tracking
- ✅ **Cart Functionality**: Shopping cart with multiple items
- ✅ **Coupon System**: Discount codes and promotions
- ✅ **Admin Panel Ready**: All admin endpoints configured
- ✅ **Mobile API Ready**: RESTful APIs for mobile apps
- ✅ **Scalable Architecture**: Microservices-ready structure

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Docker and API logs
3. Ensure all prerequisites are met
4. Try a fresh start with cleanup

The setup is designed to be **bulletproof** - it should work on any system with Docker installed! 🎉