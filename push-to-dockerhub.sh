#!/bin/bash

# =============================================================================
# Docker Hub Push Script for Household Services
# Images: 1934/myapp_api_v1, 1934/myapp_frontend_v1
# =============================================================================

echo "🐳 Docker Hub Push Script"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📋 Images to push:${NC}"
echo "   - 1934/myapp_db_v1:latest"
echo "   - 1934/myapp_api_v1:latest"
echo "   - 1934/myapp_frontend_v1:latest"
echo ""

echo -e "${YELLOW}🔐 Step 1: Login to Docker Hub${NC}"
echo "Username: 1934"
echo "Password: Lipu@1934"
echo ""
echo "Running: docker login -u 1934"
docker login -u 1934

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
else
    echo "❌ Login failed. Please check credentials."
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 Step 2: Pushing Database image${NC}"
echo "Running: docker push 1934/myapp_db_v1:latest"
docker push 1934/myapp_db_v1:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database image pushed successfully${NC}"
else
    echo "❌ Database image push failed"
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 Step 3: Pushing API image${NC}"
echo "Running: docker push 1934/myapp_api_v1:latest"
docker push 1934/myapp_api_v1:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API image pushed successfully${NC}"
else
    echo "❌ API image push failed"
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 Step 4: Pushing Frontend image${NC}"
echo "Running: docker push 1934/myapp_frontend_v1:latest"
docker push 1934/myapp_frontend_v1:latest

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend image pushed successfully${NC}"
else
    echo "❌ Frontend image push failed"
    exit 1
fi

echo ""
echo "🎉 All images pushed to Docker Hub successfully!"
echo ""
echo "📋 Published Images:"
echo "   🔗 https://hub.docker.com/r/1934/myapp_db_v1"
echo "   🔗 https://hub.docker.com/r/1934/myapp_api_v1"
echo "   🔗 https://hub.docker.com/r/1934/myapp_frontend_v1"
echo ""
echo "📦 Total image sizes:"
docker images | grep "1934/"
echo ""
echo "✅ Ready for deployment on other Mac!"
echo ""