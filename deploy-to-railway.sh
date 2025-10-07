#!/bin/bash

# Happy Homes Services - Railway Deployment Script
# This script helps deploy both frontend and backend to Railway.app

set -e  # Exit on any error

echo "🚀 Happy Homes Services - Railway Deployment Helper"
echo "=================================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    echo "   Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI found and authenticated"
echo ""

# Function to deploy backend
deploy_backend() {
    echo "🔧 Deploying Backend (FastAPI)..."
    echo "--------------------------------"
    
    cd backend
    
    echo "📦 Initializing Railway project for backend..."
    
    # Check if already linked to a project
    if ! railway status &> /dev/null; then
        echo "🔗 Linking to Railway project..."
        railway init
    fi
    
    echo "🗄️  Adding PostgreSQL database..."
    railway add postgresql || echo "ℹ️  Database might already exist"
    
    echo "⚙️  Setting environment variables..."
    railway variables set SECRET_KEY="$(openssl rand -hex 32)" || echo "ℹ️  SECRET_KEY might already be set"
    railway variables set ENVIRONMENT="production"
    railway variables set DEBUG="false" 
    railway variables set HOST="0.0.0.0"
    railway variables set APP_NAME="Happy Homes Services API"
    
    echo "🚀 Deploying backend..."
    railway up
    
    # Get the backend URL
    BACKEND_URL=$(railway domain)
    echo "✅ Backend deployed at: https://$BACKEND_URL"
    
    cd ..
    
    return 0
}

# Function to deploy frontend  
deploy_frontend() {
    echo ""
    echo "🎨 Deploying Frontend (React)..."
    echo "-------------------------------"
    
    # Check if already linked to a project
    if ! railway status &> /dev/null; then
        echo "🔗 Linking to Railway project..."
        railway init
    fi
    
    # Set frontend environment variables
    if [ -n "$BACKEND_URL" ]; then
        echo "⚙️  Setting environment variables..."
        railway variables set VITE_API_BASE_URL="https://$BACKEND_URL/api"
        railway variables set VITE_BACKEND_PYTHON_URL="https://$BACKEND_URL"
        railway variables set VITE_BACKEND_NODE_URL="https://$BACKEND_URL"
        railway variables set NODE_ENV="production"
    else
        echo "⚠️  Backend URL not available. You'll need to set VITE_API_BASE_URL manually."
    fi
    
    echo "🚀 Deploying frontend..."
    railway up
    
    # Get the frontend URL
    FRONTEND_URL=$(railway domain)
    echo "✅ Frontend deployed at: https://$FRONTEND_URL"
    
    return 0
}

# Function to update CORS settings
update_cors() {
    if [ -n "$FRONTEND_URL" ] && [ -n "$BACKEND_URL" ]; then
        echo ""
        echo "🔗 Updating CORS settings..."
        echo "----------------------------"
        
        cd backend
        railway variables set FRONTEND_URL="https://$FRONTEND_URL"
        railway up --detach
        cd ..
        
        echo "✅ CORS updated successfully"
    fi
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Deploy backend first
    deploy_backend
    
    # Deploy frontend
    deploy_frontend  
    
    # Update CORS settings
    update_cors
    
    echo ""
    echo "🎉 Deployment Complete!"
    echo "======================"
    echo ""
    echo "🌐 Frontend: https://$FRONTEND_URL"
    echo "🔧 Backend:  https://$BACKEND_URL"  
    echo "📚 API Docs: https://$BACKEND_URL/docs"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test the application end-to-end"
    echo "2. Set up custom domains (if needed)"
    echo "3. Configure monitoring and alerts"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   railway logs           # View logs"
    echo "   railway status         # Check status"
    echo "   railway open           # Open in browser"
    echo ""
}

# Check for help flag
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: $0 [--backend-only] [--frontend-only]"
    echo ""
    echo "Options:"
    echo "  --backend-only    Deploy only the backend"
    echo "  --frontend-only   Deploy only the frontend" 
    echo "  --help, -h        Show this help message"
    echo ""
    exit 0
fi

# Handle deployment options
if [[ "$1" == "--backend-only" ]]; then
    deploy_backend
elif [[ "$1" == "--frontend-only" ]]; then
    deploy_frontend
else
    main
fi