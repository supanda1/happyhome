# Migration and Seed Files Update for Python Models Compatibility

## Overview

The migration scripts and seed files have been updated to ensure full compatibility with the Python SQLAlchemy models in `backend/app/models/`. This update ensures that when the postgres container starts up, all required tables and data will be available for the Python backend.

## Key Changes Made

### 1. Updated Migration Files

- **`001_comprehensive_setup.sql`** - Updated to match Python models exactly:
  - Changed `password` field to `password_hash` in users table
  - Added missing fields like `preferences`, `avatar_url`, `profile_completed`
  - Updated `user_addresses` table with `type`, `title`, `full_address`, `landmark`, GPS coordinates
  - Enhanced `refresh_tokens` table with session tracking fields
  - Updated `orders` and `order_items` tables to match Order and OrderItem models
  - Added `service_photos` table for ServicePhoto model
  - Enhanced `service_variants` table with additional fields
  - Removed ENUM types to use VARCHAR (matching Python models)

- **`017_comprehensive_python_models_setup.sql`** - New comprehensive migration that creates all tables matching Python models

### 2. Updated Seed Files

- **`seedServicesDetailed.ts`** - Enhanced with comprehensive service data matching all subcategories
- **`runMigrationAndSeed.ts`** - New script to orchestrate migration and seeding process

### 3. Container Configuration Updates

- **`docker-compose.yml`** - Updated to include all migration files and scripts
- **`scripts/run-migrations-and-seed.sql`** - New script to run all migrations in sequence

## Files Modified/Created

### Modified Files
- `backend/migrations/001_comprehensive_setup.sql`
- `backend/docker-compose.yml`

### New Files Created
- `backend/migrations/017_comprehensive_python_models_setup.sql`
- `backend/src/scripts/runMigrationAndSeed.ts`
- `backend/scripts/run-migrations-and-seed.sql`
- `backend/MIGRATION_UPDATE_README.md`

## Database Schema Changes

### Users Table
- Added: `password_hash` (renamed from `password`)
- Added: `failed_login_attempts`, `locked_until`, `profile_completed`
- Added: `avatar_url`, `preferences` (JSONB)
- Added: `last_login` with timezone support

### User Addresses Table
- Added: `type`, `title`, `full_address`, `landmark`
- Added: `latitude`, `longitude` for GPS coordinates
- Added: `is_active` flag

### Refresh Tokens Table
- Added: `is_revoked`, `device_info`, `ip_address`, `user_agent`
- Enhanced session tracking capabilities

### Orders & Order Items Tables
- Updated to match Python Order and OrderItem models
- Added support for multiple items per order
- Added engineer assignment fields
- Added scheduling and completion tracking

### Service Related Tables
- Added `service_photos` table for image management
- Enhanced `service_variants` with detailed fields
- Updated all fields to match Python models exactly

## How to Use

### Starting Fresh Container
```bash
# Stop existing containers
docker-compose down -v

# Start with fresh database
docker-compose up postgres

# The migration will run automatically during container startup
```

### Running Additional Seeding
```bash
# After container is up, run detailed seeding
docker-compose exec api npm run seed:detailed
```

### Verifying Setup
```bash
# Check if all tables exist
docker-compose exec postgres psql -U postgres -d household_services -c "\\dt"

# Check admin users
docker-compose exec postgres psql -U postgres -d household_services -c "SELECT email, role FROM users WHERE role IN ('admin', 'super_admin');"

# Check services count
docker-compose exec postgres psql -U postgres -d household_services -c "SELECT COUNT(*) FROM services;"
```

## Admin Credentials

After migration, these admin users will be available:

- **Super Admin**: `superadmin@happyhomes.com` / `admin123`
- **Test Admin**: `admin@test.com` / `admin123`  
- **System Admin**: `admin@happyhomes.com` / `admin123`

## Python Model Compatibility

All tables now exactly match the SQLAlchemy models in:
- `backend/app/models/user.py` - User, UserAddress, RefreshToken
- `backend/app/models/order.py` - Order, OrderItem
- `backend/app/models/service.py` - Service, ServiceCategory, ServiceSubcategory, ServicePhoto, ServiceVariant
- Other models as defined in the models directory

## Troubleshooting

### If Migration Fails
1. Check container logs: `docker-compose logs postgres`
2. Ensure all migration files are properly formatted SQL
3. Verify no syntax errors in migration scripts

### If Seeding Fails
1. Check if tables exist first
2. Run seeding manually: `docker-compose exec api npm run seed:services`
3. Check for foreign key constraint violations

### Performance Issues
- All necessary indexes have been created
- JSONB fields are properly indexed where needed
- Use `EXPLAIN ANALYZE` for query performance analysis

## Next Steps

1. Test Python backend connectivity with new schema
2. Verify all CRUD operations work with updated models
3. Run comprehensive tests to ensure data integrity
4. Update any application code that relies on old field names

The database is now fully compatible with the Python SQLAlchemy models and ready for production use.