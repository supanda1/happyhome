# 🚀 Safe Deployment Checklist

## Before Making Changes

- [ ] Create backup branch: `git checkout -b backup/$(date +%Y%m%d-%H%M)`
- [ ] Create feature branch: `git checkout -b fix/description-of-fix`
- [ ] Document what you're changing and why

## Development Process

- [ ] Make small, incremental changes
- [ ] Test each change immediately: `npm run build && npm start`
- [ ] Run model validation: `node scripts/test-models.js`
- [ ] Check browser console for errors
- [ ] Test core user flows (order creation, admin functions)

## Pre-Deployment Validation

- [ ] Backend builds successfully: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Database connectivity test passes
- [ ] Order creation works in browser
- [ ] Admin panel loads without errors

## Deployment Steps

```bash
# 1. Build and test
npm run build
npm start  # Test in separate terminal

# 2. If everything works, commit
git add .
git commit -m "fix: describe your change"

# 3. Merge to main (only if tests pass)
git checkout main
git merge fix/your-branch-name

# 4. Deploy
npm run build
# Restart your production server
```

## Emergency Rollback

If something breaks after deployment:

```bash
# Quick rollback to last working state
git reset --hard HEAD~1  # Undo last commit
# OR
git checkout backup/YYYYMMDD-HHMM  # Use backup branch

# Rebuild and restart
npm run build
npm start
```

## Current Working State

✅ **Order Creation**: Fixed race condition with timestamp-based numbering
✅ **Order Status**: Orders start in pending state (no auto-assignment)  
✅ **Backend API**: All endpoints responding correctly
✅ **Database**: PostgreSQL integration working

## Testing Commands

```bash
# Test database connection
node scripts/test-models.js

# Test order creation (in browser)
# 1. Add items to cart
# 2. Go to checkout  
# 3. Complete payment
# 4. Verify order appears in admin panel with "pending" status

# Test admin functions
# 1. Login to admin panel
# 2. View orders list
# 3. Change order status to "confirmed"
# 4. Assign engineer (auto or manual)
# 5. Test "Start Work" button
```