#!/bin/bash

# Environment Check Script for Development Setup
echo "🔍 Checking Development Environment"
echo "=================================="

# Check Docker
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker is installed and running"
        echo "   Version: $(docker --version)"
    else
        echo "❌ Docker is installed but not running"
        exit 1
    fi
else
    echo "❌ Docker is not installed"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    echo "✅ Docker Compose is available"
    echo "   Version: $(docker-compose --version)"
elif docker compose version >/dev/null 2>&1; then
    echo "✅ Docker Compose (plugin) is available"  
    echo "   Version: $(docker compose version)"
else
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Check required files
echo ""
echo "📁 Checking required files..."
required_files=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile.node"
    "Dockerfile"
    "Dockerfile.dev"
    "backend/migrations/final_complete_setup.sql"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check ports availability
echo ""
echo "🔌 Checking port availability..."
ports=(3001 8001 5432 5050 6379)
for port in "${ports[@]}"; do
    if ! netstat -ln 2>/dev/null | grep ":$port " >/dev/null && ! lsof -i :$port >/dev/null 2>&1; then
        echo "✅ Port $port is available"
    else
        echo "⚠️  Port $port is in use (may conflict)"
    fi
done

# Check disk space (warn if less than 2GB free)
echo ""
echo "💾 Checking disk space..."
available_space=$(df . | awk 'NR==2 {print $4}')
if [ "$available_space" -gt 2097152 ]; then  # 2GB in KB
    echo "✅ Sufficient disk space available"
else
    echo "⚠️  Low disk space - may cause issues"
fi

echo ""
echo "🎯 Environment Check Complete!"
echo ""
echo "To start development environment:"
echo "   ./start-dev.sh"
echo ""
echo "Manual commands:"
echo "   docker compose -f docker-compose.yml -f docker-compose.dev.yml up"