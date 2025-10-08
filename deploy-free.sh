#!/bin/bash

# 100% Free Deployment Script
# Deploy frontend to Vercel (free) + backend to Railway (free tier)

set -e

echo "🆓 100% FREE Deployment Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Free Services Being Used:${NC}"
echo "✅ Frontend: Vercel (Free forever)"
echo "✅ Backend: Railway (Free $5 credit monthly)"
echo "✅ Database: Railway PostgreSQL (Free tier)"
echo ""

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo -e "${GREEN}🌐 Deploying Frontend to Vercel (FREE)...${NC}"
echo ""
echo "This will:"
echo "1. Deploy your React frontend to Vercel"
echo "2. Get a free .vercel.app domain"
echo "3. Auto-deploy on git push"
echo ""

# Deploy frontend to Vercel
vercel --prod

echo ""
echo -e "${GREEN}📱 Now deploy Backend to Railway:${NC}"
echo ""
echo "1. Go to: https://railway.app"
echo "2. Sign up with GitHub (free $5/month credit)"
echo "3. Click 'Deploy from GitHub repo'"
echo "4. Select your 'happyhome' repository"
echo "5. Choose 'backend' folder"
echo "6. Add PostgreSQL database (free tier)"
echo ""
echo -e "${YELLOW}📝 Railway Environment Variables to Set:${NC}"
echo "ENVIRONMENT=production"
echo "DEBUG=false"
echo "SECRET_KEY=$(openssl rand -base64 32)"
echo ""
echo -e "${BLUE}🔗 After both are deployed, update these:${NC}"
echo "1. Update CORS in backend to allow your Vercel domain"
echo "2. Update VITE_API_URL in Vercel to point to Railway backend"
echo ""
echo -e "${GREEN}✅ Total Cost: $0 (Both services have generous free tiers)${NC}"