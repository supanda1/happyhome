#!/bin/bash

# Fly.io Deployment Script
# Run this script to deploy to Fly.io quickly

set -e

echo "🚀 Quick Fly.io Deployment for Household Services Backend"
echo "=============================================="

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Login to Fly.io
echo "📝 Logging into Fly.io..."
flyctl auth login

# Create app (will skip if already exists)
echo "🎯 Creating/checking app..."
flyctl apps create household-services-api --org personal || true

# Create PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
flyctl postgres create --name household-services-db --org personal --region iad --vm-size shared-cpu-1x --volume-size 1 || true

# Attach database to app
echo "🔗 Attaching database to app..."
flyctl postgres attach household-services-db --app household-services-api || true

# Set secrets
echo "🔐 Setting production secrets..."
flyctl secrets set SECRET_KEY="$(openssl rand -base64 32)" --app household-services-api

# Deploy the application
echo "🚀 Deploying application..."
flyctl deploy --remote-only --app household-services-api

# Show deployment info
echo "✅ Deployment complete!"
echo "🌐 Your app is available at:"
flyctl apps list | grep household-services-api
echo ""
echo "📋 Useful commands:"
echo "   flyctl logs --app household-services-api"
echo "   flyctl ssh console --app household-services-api"
echo "   flyctl status --app household-services-api"