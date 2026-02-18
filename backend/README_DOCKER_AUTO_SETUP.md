# 🚀 Automatic Database Setup with Docker Compose

This setup ensures that your PostgreSQL database is automatically populated with all necessary data whenever the container starts fresh.

## 📋 What's Included

### Automatic Data Loading
When the PostgreSQL container starts up, it automatically runs:

1. **Basic Initialization** (`01-init-db.sql`)
   - Creates database extensions (UUID, full-text search)
   - Sets up permissions
   - Prepares database for application use

2. **Comprehensive Setup** (`02-comprehensive-setup.sql`)
   - **7 Service Categories** with proper hierarchy
   - **32 Subcategories** with detailed descriptions
   - **28 Active Services** with realistic pricing and features
   - **3 Admin Users** with secure password hashes
   - **3 Sample Employees** with expertise areas
   - **6 Promotional Coupons** with various discount types
   - **Banners, contact settings, and legacy compatibility**

## 🔧 How It Works

The Docker Compose configuration automatically mounts both initialization scripts:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init-db.sql
  - ./migrations/001_comprehensive_setup.sql:/docker-entrypoint-initdb.d/02-comprehensive-setup.sql
```

Scripts execute in alphabetical order during first container startup.

## 🚀 Usage

### Fresh Start (Complete Reset)
```bash
# Stop and remove containers & volumes
docker compose down
docker volume rm backend_postgres_data

# Start fresh with auto-populated data
docker compose up postgres -d

# Verify data loaded correctly
psql -h localhost -U postgres -d household_services -c "
SELECT 'Categories' as table, count(*) FROM service_categories 
UNION SELECT 'Services', count(*) FROM services 
UNION SELECT 'Users', count(*) FROM users;"
```

### Normal Development
```bash
# Regular startup (preserves existing data)
docker compose up -d
```

## 👥 Default Admin Accounts

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `superadmin@happyhomes.com` | `admin123` | super_admin | Primary super administrator |
| `admin@test.com` | `admin123` | admin | Test admin account |
| `admin@happyhomes.com` | `admin123` | super_admin | System administrator |

## 📊 Sample Data Loaded

- **Categories**: Plumbing, Electrical, Cleaning, Call A Service, Finance & Insurance, Personal Care, Civil Work
- **Services**: 28 active services with realistic pricing (₹149 - ₹7999)
- **Featured Services**: Bath fittings, toilet installation, wiring, lighting, etc.
- **Employees**: Sample technicians with expertise areas
- **Coupons**: WELCOME50 (50% off), SAVE100 (₹100 off), NEWUSER25 (25% off), etc.

## 🔍 Verification

After container startup, verify the setup:

```bash
# Check container logs
docker logs household_services_postgres

# Test API endpoints
curl http://localhost:8001/api/categories
curl http://localhost:8001/api/services

# Query database directly
psql -h localhost -U postgres -d household_services \
  -c "SELECT name, base_price, discounted_price FROM services WHERE is_featured = true;"
```

## 📁 File Structure

```
backend/
├── docker-compose.yml          # Auto-loading configuration
├── scripts/
│   └── init-db.sql            # Basic database initialization
├── migrations/
│   └── 001_comprehensive_setup.sql  # Complete data setup
└── README_DOCKER_AUTO_SETUP.md     # This documentation
```

## ⚡ Benefits

✅ **Zero Manual Setup** - Fresh databases automatically populated  
✅ **Consistent Environment** - Same data across all deployments  
✅ **Development Ready** - Immediate access to realistic test data  
✅ **Production Compatible** - Real-world service categories and pricing  
✅ **Easy Reset** - Complete environment refresh in seconds  

## 🔧 Customization

To modify the default data:
1. Edit `migrations/001_comprehensive_setup.sql`
2. Restart with fresh volumes to apply changes
3. Data persists until volumes are explicitly removed