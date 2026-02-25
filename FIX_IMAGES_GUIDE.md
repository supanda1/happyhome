# 🖼️ Fix Service Images Guide

## Problem
All services are showing the same bath service images instead of unique images for each service category.

## Root Cause
- Database `services` table has empty `image_paths` arrays for all services
- Services are likely falling back to default/placeholder images
- All services defaulting to bath-fittings images

## Solution
Run the image fix script to assign proper, unique images to each service based on their category.

---

## 🚀 Quick Fix (Recommended)

### Step 1: Ensure Mac Development is Running
```bash
# Make sure your Mac development environment is running
./manage-platforms.sh mac start

# Or use docker compose directly
docker compose up -d
```

### Step 2: Run the Fix Script
```bash
# From your project root directory
./scripts/fix-service-images.sh
```

### Step 3: Restart Frontend
```bash
# Restart frontend to clear any caches
docker compose restart frontend

# Wait a few seconds, then test
open http://localhost:3001
```

---

## 🔍 What the Fix Does

### Before Fix
- ❌ All services show bath-fittings images
- ❌ `image_paths` in database: `[]` (empty)
- ❌ No visual distinction between services

### After Fix
- ✅ **Plumbing services** → Plumbing images (taps, sinks, toilets, pipes)
- ✅ **Electrical services** → Electrical images (wiring, switches, fans)
- ✅ **Cleaning services** → Cleaning images (house, bathroom, kitchen cleaning)
- ✅ **Civil Work services** → Civil work images (painting, waterproofing)
- ✅ **Finance services** → Finance images (ITR, GST, legal docs)

---

## 📋 Manual Verification

### Check Database Updates
```bash
# Connect to database and verify images are assigned
docker exec -it myapp_db psql -U postgres -d household_services

# Run this query to see service images
SELECT name, image_paths FROM services WHERE image_paths != '[]'::jsonb LIMIT 5;
```

### Check Frontend
Visit http://localhost:3001 and verify:
1. ✅ **Home page services** show different images
2. ✅ **Featured services** have unique images
3. ✅ **Service categories** display appropriate visuals
4. ✅ No more identical bath service images

---

## 🛠️ If Script Fails

### Check Prerequisites
```bash
# 1. Verify database is running
docker ps | grep myapp_db

# 2. Check database connection
docker exec myapp_db pg_isready -U postgres

# 3. Verify images exist
ls public/images/subcategories/plumbing/bath-fittings/
ls public/images/subcategories/electrical/
```

### Manual Database Update
```bash
# Apply the SQL migration manually
docker exec -i myapp_db psql -U postgres -d household_services < backend/migrations/fix-service-images.sql
```

---

## 📊 Image Assignments

| Service Category | Sample Images |
|------------------|---------------|
| **Plumbing** | bath-fittings, basin-sink, toilets, pipes, water-tank, grouting |
| **Electrical** | wiring-installation, switch-socket, appliance-repair, fan-installation |
| **Cleaning** | house-cleaning, bathroom-cleaning, kitchen-cleaning, sofa-cleaning |
| **Civil Work** | painting, waterproofing |
| **Finance** | itr-filing, gst-registration, stamp-paper-agreement |

---

## 🎯 Expected Results

After running the fix:

### Homepage (http://localhost:3001)
- **Bathroom Tap Installation** → Shows bath fittings images
- **Kitchen Sink Installation** → Shows basin/sink images
- **Toilet Installation** → Shows toilet images
- **Electrical Wiring** → Shows wiring installation images
- **House Cleaning** → Shows house cleaning images
- **Painting Services** → Shows painting images

### Service Details
- Each service will have 2-3 unique images in their gallery
- Images will be contextually relevant to the service
- No more generic bath service images everywhere

---

## 🔄 If You Need to Revert

To revert all services back to empty images:
```sql
-- Connect to database
docker exec -it myapp_db psql -U postgres -d household_services

-- Clear all image paths
UPDATE services SET image_paths = '[]'::jsonb;
```

---

## ✅ Success Indicators

✅ Services display unique, relevant images
✅ No identical images across different service categories
✅ Image paths in database are populated
✅ Frontend loads without image errors
✅ Each service category is visually distinct

**🎉 Your service images are now fixed and unique!**