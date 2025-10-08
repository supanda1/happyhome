#!/bin/bash

# Quick Update Deployment Script
# Updates existing Render services after code changes

set -e

echo "🔄 Updating Render Deployment..."
echo "==============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if render CLI is available
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}Installing Render CLI...${NC}"
    curl -fsSL https://cli-assets.render.com/install.sh | bash
fi

echo -e "${GREEN}📤 Pushing latest code to GitHub...${NC}"
git add .
git commit -m "Update deployment $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

echo -e "${GREEN}🚀 Triggering Render redeploy...${NC}"

# Redeploy backend
echo "Redeploying backend..."
render service deploy --service-name "household-services-api" --clear-cache

# Redeploy frontend  
echo "Redeploying frontend..."
render service deploy --service-name "household-services-frontend" --clear-cache

echo ""
echo -e "${GREEN}✅ Update deployment triggered!${NC}"
echo -e "${YELLOW}⏱️  Services will redeploy in ~5-10 minutes${NC}"
echo ""
echo -e "${YELLOW}📊 Check status:${NC}"
echo "render service status household-services-api"
echo "render service status household-services-frontend"
echo ""
echo -e "${YELLOW}🔍 Test when ready:${NC}"  
echo "./check-deployment.sh"