#!/bin/bash

# Railway startup script for Happy Homes Backend

echo "Starting Happy Homes Backend on Railway..."

# Set default port if not provided
export PORT=${PORT:-8000}

# Set production environment
export ENVIRONMENT=production
export DEBUG=false
export RELOAD=false

# Create uploads directory
mkdir -p /app/uploads

# Start the FastAPI application
echo "Starting FastAPI server on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1