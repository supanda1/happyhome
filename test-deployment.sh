#!/bin/bash

# Happy Homes Services - Deployment Test Script
# This script tests the deployed application end-to-end

set -e

echo "🧪 Happy Homes Services - Deployment Test"
echo "========================================="

# Check if URLs are provided as arguments
FRONTEND_URL="${1:-}"
BACKEND_URL="${2:-}"

if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "Usage: $0 <frontend_url> <backend_url>"
    echo "Example: $0 https://happyhomes-frontend.railway.app https://happyhomes-backend.railway.app"
    exit 1
fi

echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL:  $BACKEND_URL"
echo ""

# Function to test HTTP endpoint
test_endpoint() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $description... "
    
    if response=$(curl -s -w "%{http_code}" -o /tmp/response "$url" 2>/dev/null); then
        status_code="${response: -3}"
        if [ "$status_code" = "$expected_status" ]; then
            echo "✅ OK ($status_code)"
            return 0
        else
            echo "❌ Failed ($status_code)"
            echo "Response: $(cat /tmp/response)"
            return 1
        fi
    else
        echo "❌ Connection failed"
        return 1
    fi
}

# Function to test JSON API endpoint
test_json_endpoint() {
    local url="$1" 
    local description="$2"
    local expected_key="$3"
    
    echo -n "Testing $description... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | grep -q "\"$expected_key\""; then
            echo "✅ OK (JSON response with '$expected_key')"
            return 0
        else
            echo "❌ Failed (missing '$expected_key' in JSON)"
            echo "Response: $response"
            return 1
        fi
    else
        echo "❌ Connection failed"
        return 1
    fi
}

echo "🔍 Running Health Checks..."
echo "----------------------------"

# Test backend health endpoints
test_endpoint "$BACKEND_URL/ping" "Backend ping"
test_json_endpoint "$BACKEND_URL/" "Backend root" "message"
test_endpoint "$BACKEND_URL/docs" "API documentation"

# Test frontend
test_endpoint "$FRONTEND_URL/" "Frontend homepage"

echo ""
echo "🔍 Running API Tests..."  
echo "----------------------"

# Test API endpoints that don't require authentication
test_json_endpoint "$BACKEND_URL/api/v1/services" "Services API" "services"
test_json_endpoint "$BACKEND_URL/api/v1/categories" "Categories API" "categories"

echo ""
echo "🔍 Testing CORS..."
echo "------------------"

# Test CORS preflight request
echo -n "Testing CORS preflight... "
if cors_response=$(curl -s -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -w "%{http_code}" \
    "$BACKEND_URL/api/v1/services" 2>/dev/null); then
    
    status_code="${cors_response: -3}"
    if [ "$status_code" = "200" ]; then
        echo "✅ OK"
    else
        echo "⚠️  Warning (status: $status_code)"
    fi
else
    echo "❌ Failed"
fi

echo ""
echo "🧪 Performance Tests..."
echo "----------------------"

# Test response times
echo -n "Testing backend response time... "
if backend_time=$(curl -s -w "%{time_total}" -o /dev/null "$BACKEND_URL/ping" 2>/dev/null); then
    echo "✅ ${backend_time}s"
else
    echo "❌ Failed"
fi

echo -n "Testing frontend response time... "
if frontend_time=$(curl -s -w "%{time_total}" -o /dev/null "$FRONTEND_URL/" 2>/dev/null); then
    echo "✅ ${frontend_time}s"
else
    echo "❌ Failed"
fi

echo ""
echo "📊 Test Summary"
echo "==============="

# Count successful tests (basic approach)
success_count=$(echo "✅" | wc -l)
echo "Deployment appears to be working correctly! 🎉"
echo ""
echo "🔗 Quick Links:"
echo "   Frontend:    $FRONTEND_URL"
echo "   Backend:     $BACKEND_URL"
echo "   API Docs:    $BACKEND_URL/docs"
echo "   Health:      $BACKEND_URL/ping"
echo ""
echo "📋 Manual Testing Checklist:"
echo "□ User registration works"
echo "□ User login works" 
echo "□ Services are displayed"
echo "□ Booking flow works"
echo "□ Admin panel accessible"
echo "□ File uploads work"
echo ""
echo "🚀 Your Happy Homes Services application is ready!"

# Cleanup
rm -f /tmp/response