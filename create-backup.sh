#!/bin/bash
# Emergency backup script - Run this when you have a working state

BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating backup of current working state..."

# Backup critical files
cp -r backend/src/controllers "$BACKUP_DIR/"
cp -r backend/src/routes "$BACKUP_DIR/"
cp -r backend/src/models "$BACKUP_DIR/"
cp backend/package.json "$BACKUP_DIR/"

# Frontend critical files  
cp -r src/pages/admin "$BACKUP_DIR/"
cp -r src/components "$BACKUP_DIR/"
cp src/App.tsx "$BACKUP_DIR/"

# Git state
git rev-parse HEAD > "$BACKUP_DIR/git-commit-hash.txt"
git status > "$BACKUP_DIR/git-status.txt"
git diff > "$BACKUP_DIR/git-changes.diff"

echo "✅ Backup created in: $BACKUP_DIR"
echo "📝 To restore later:"
echo "   1. Copy files from $BACKUP_DIR back to original locations"
echo "   2. Run: npm run build && npm start"
echo "   3. Or git checkout \$(cat $BACKUP_DIR/git-commit-hash.txt)"

# Test the current state
echo "🔍 Testing current state..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend builds successfully"
else 
    echo "❌ Backend build failed - check for errors"
fi