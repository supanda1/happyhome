#!/bin/bash

# Deployment Status Checker
# Verifies if both frontend and backend are working

echo "🔍 Checking Deployment Status..."
echo "==============================="

# URLs to check
BACKEND_URL="https://household-services-api.onrender.com"
FRONTEND_URL="https://household-services-frontend.onrender.com"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Testing Backend API...${NC}"

# Test backend health
if curl -f -s "${BACKEND_URL}/ping" > /dev/null; then
    echo -e "${GREEN}✅ Backend API is UP: ${BACKEND_URL}/ping${NC}"
    
    # Test API endpoints
    if curl -f -s "${BACKEND_URL}/debug" > /dev/null; then
        echo -e "${GREEN}✅ Debug endpoint working: ${BACKEND_URL}/debug${NC}"
    fi
    
    if curl -f -s "${BACKEND_URL}/" > /dev/null; then
        echo -e "${GREEN}✅ Root endpoint working: ${BACKEND_URL}/${NC}"
    fi
else
    echo -e "${RED}❌ Backend API is DOWN: ${BACKEND_URL}/ping${NC}"
fi

echo ""
echo -e "${YELLOW}🔍 Testing Frontend App...${NC}"

# Test frontend
if curl -f -s "${FRONTEND_URL}" > /dev/null; then
    echo -e "${GREEN}✅ Frontend App is UP: ${FRONTEND_URL}${NC}"
else
    echo -e "${RED}❌ Frontend App is DOWN: ${FRONTEND_URL}${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Service Status Summary:${NC}"

# Get detailed backend info
echo -e "${YELLOW}Backend Info:${NC}"
curl -s "${BACKEND_URL}/debug" 2>/dev/null | jq '.' 2>/dev/null || echo "Debug info not available"

echo ""
echo -e "${YELLOW}🌐 URLs:${NC}"
echo -e "Backend:  ${BACKEND_URL}"
echo -e "Frontend: ${FRONTEND_URL}"
echo -e "API Docs: ${BACKEND_URL}/docs"
echo -e "Health:   ${BACKEND_URL}/ping"

echo ""
echo -e "${YELLOW}📋 Useful Commands:${NC}"
echo "render service logs household-services-api"
echo "render service logs household-services-frontend"
echo "render service status household-services-api"
echo "render service status household-services-frontend"