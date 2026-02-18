# Database Migration - Single File Setup

## Overview
This directory contains the **single comprehensive migration and seed file** for the Household Services application.

## Files Structure

### ✅ Active Files
- **`final_complete_setup.sql`** - The ONLY file needed for complete database initialization
  - Contains complete schema creation
  - Includes all seed data (admin users, categories, services, coupons, etc.)
  - Handles database initialization, extensions, and permissions
  - Used by Docker container for database setup

### 📁 Supporting Files
- `README.md` - This documentation file

## Usage

The `final_complete_setup.sql` file is automatically executed by PostgreSQL when the Docker container starts:

```yaml
# docker-compose.yml
volumes:
  - ./backend/migrations/final_complete_setup.sql:/docker-entrypoint-initdb.d/01-complete-setup.sql
```

## Database Schema Highlights

### ✅ Correct Schema (Application Compatible)
- **user_addresses**: `type`, `title`, `full_address`, `postal_code` (NOT `address_type`, `full_name`, `pincode`)
- **orders**: No `coupon_code`/`coupon_id` columns (discount stored in `discount_amount`)
- **order_items**: `variant_id`, `variant_name`, `category_id`, `subcategory_id` (NOT `service_variant_id`)

### 📊 Seed Data Included
- **Admin Users**: Super admin and regular admin accounts
- **Service Categories**: 7 main categories (Plumbing, Electrical, Cleaning, etc.)
- **Subcategories**: 32 detailed subcategories
- **Services**: 28 sample services across all categories
- **Coupons**: 6 promotional coupons for testing
- **Banners**: 3 homepage banners
- **Contact Settings**: Company information

## Important Notes

1. **Single Source of Truth**: Only use `final_complete_setup.sql` - all other migration files have been removed
2. **Schema Compatibility**: This schema matches what the application code expects (fixed column name mismatches)
3. **Fresh Install**: Drops all existing tables before creating new ones
4. **Production Ready**: Includes proper indexes, constraints, and relationships

## Troubleshooting

If you encounter issues:
1. Ensure Docker container uses this file: `./backend/migrations/final_complete_setup.sql`
2. Check that no old migration files conflict
3. Verify database is completely recreated on container restart

This setup eliminates the persistence issues where fixes didn't survive container restarts.