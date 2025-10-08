#!/bin/bash

# Automated Render.com Deployment Script
# Deploys both frontend and backend automatically

set -e

echo "🚀 Automated Render.com Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Render CLI...${NC}"
    # Install Render CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl -fsSL https://cli-assets.render.com/install.sh | bash
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://cli-assets.render.com/install.sh | bash
    else
        echo -e "${RED}❌ Please install Render CLI manually: https://render.com/docs/cli${NC}"
        exit 1
    fi
fi

# Login to Render
echo -e "${YELLOW}🔑 Please login to Render.com...${NC}"
render auth login

# Generate a secure secret key
SECRET_KEY=$(openssl rand -base64 32)

echo -e "${GREEN}🗄️  Creating PostgreSQL database...${NC}"
# Create database
render postgres create \
  --name "household-services-db" \
  --plan "starter" \
  --region "oregon" \
  --database-name "household_services" \
  --database-user "postgres"

echo -e "${GREEN}📱 Creating backend API service...${NC}"
# Create backend service
render service create web \
  --name "household-services-api" \
  --repo "https://github.com/$(git config user.name)/$(basename $(git rev-parse --show-toplevel))" \
  --branch "main" \
  --build-command "" \
  --start-command "gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:\$PORT" \
  --env-vars "ENVIRONMENT=production,DEBUG=false,LOG_LEVEL=INFO,SECRET_KEY=${SECRET_KEY}" \
  --root-dir "./backend" \
  --runtime "docker" \
  --plan "starter" \
  --region "oregon"

echo -e "${GREEN}🌐 Creating frontend web app...${NC}"
# Create frontend service  
render service create static \
  --name "household-services-frontend" \
  --repo "https://github.com/$(git config user.name)/$(basename $(git rev-parse --show-toplevel))" \
  --branch "main" \
  --build-command "npm ci && npm run build" \
  --publish-path "./dist" \
  --env-vars "VITE_API_URL=https://household-services-api.onrender.com" \
  --plan "starter" \
  --region "oregon"

echo -e "${GREEN}🔗 Linking database to backend...${NC}"
# Link database to backend service
render env set \
  --service-name "household-services-api" \
  DATABASE_URL="\$(render postgres connection-string household-services-db)"

echo -e "${GREEN}🎯 Setting CORS origins...${NC}"
# Update backend CORS
render env set \
  --service-name "household-services-api" \
  ALLOWED_ORIGINS="https://household-services-frontend.onrender.com"

echo -e "${GREEN}🚀 Triggering deployments...${NC}"
# Deploy backend
render service deploy --service-name "household-services-api"

# Deploy frontend  
render service deploy --service-name "household-services-frontend"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🎉 Your services are being deployed:${NC}"
echo ""
echo -e "${YELLOW}📱 Backend API:${NC} https://household-services-api.onrender.com"
echo -e "${YELLOW}🌐 Frontend App:${NC} https://household-services-frontend.onrender.com"  
echo -e "${YELLOW}🗄️  Database:${NC} PostgreSQL (auto-connected)"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "   render service logs household-services-api"
echo "   render service logs household-services-frontend"
echo "   render service list"
echo "   render postgres info household-services-db"
echo ""
echo -e "${GREEN}⏱️  Deployment will take 10-15 minutes. Check status with:${NC}"
echo "   render service status household-services-api"
echo "   render service status household-services-frontend"