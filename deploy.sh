#!/bin/bash

# Deployment script for Railway and Vercel

echo "🚀 Starting deployment process..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf backend/dist

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Build backend
echo "🏗️ Building backend..."
cd backend && npm run build && cd ..

# Test builds
echo "🧪 Testing builds..."
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

if [ ! -d "backend/dist" ]; then
    echo "❌ Backend build failed - backend/dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"

# Check for deployment configurations
echo "🔍 Checking deployment configurations..."

if [ -f "railway.json" ]; then
    echo "✅ Railway configuration found"
else
    echo "⚠️ Railway configuration not found"
fi

if [ -f "vercel.json" ]; then
    echo "✅ Vercel configuration found"
else
    echo "⚠️ Vercel configuration not found"
fi

if [ -f ".env.example" ]; then
    echo "✅ Environment template found"
else
    echo "⚠️ Environment template not found"
fi

echo "
📋 Deployment Checklist:
1. ✅ Frontend build successful
2. ✅ Backend build successful
3. ✅ Deployment configurations created
4. 📝 Next steps:
   
   For Railway:
   - git add .
   - git commit -m 'Fix deployment configurations'
   - git push
   - Connect your Railway service to this repository
   
   For Vercel:
   - Install Vercel CLI: npm i -g vercel
   - Run: vercel --prod
   
   Environment Variables:
   - Copy .env.example to your deployment platform
   - Set DATABASE_URL for your database
   - Set other environment variables as needed

🎉 Deployment preparation complete!
"