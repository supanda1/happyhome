# Railway.app Deployment Guide for Happy Homes Services

This guide will help you deploy both the React frontend and FastAPI backend to Railway.app for free hosting.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
3. **GitHub Repository**: Your code should be pushed to GitHub

## Step 1: Install Railway CLI

```bash
# Option 1: Using curl (recommended)
curl -fsSL https://railway.app/install.sh | sh

# Option 2: Using npm (if curl fails)
npm install -g @railway/cli

# Option 3: Using brew (macOS)
brew install railway/railway/railway
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser for GitHub authentication.

## Step 3: Deploy Backend (FastAPI)

### 3.1 Create Backend Project

```bash
# Navigate to backend directory  
cd backend

# Initialize Railway project
railway init

# Select "Deploy from GitHub repo" when prompted
# Choose your repository: supanda1/happyhome
# Set the root directory to: /backend
```

### 3.2 Add PostgreSQL Database

```bash
# Add PostgreSQL service to your backend project
railway add postgresql

# This creates a DATABASE_URL environment variable automatically
```

### 3.3 Set Backend Environment Variables

In Railway dashboard or via CLI:

```bash
# Set required environment variables
railway variables set SECRET_KEY="your-super-secret-key-here-at-least-32-characters-long"
railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set HOST="0.0.0.0"
railway variables set APP_NAME="Happy Homes Services API"
railway variables set FRONTEND_URL="https://your-frontend-domain.railway.app"
```

### 3.4 Deploy Backend

```bash
# Deploy the backend
railway up

# Check deployment status
railway status

# View logs
railway logs
```

**Your backend will be available at**: `https://your-backend-name.railway.app`

## Step 4: Deploy Frontend (React)

### 4.1 Create Frontend Project

```bash
# Navigate to project root (not backend folder)
cd ..

# Initialize new Railway project for frontend
railway init

# Select "Deploy from GitHub repo"
# Choose your repository: supanda1/happyhome  
# Set the root directory to: / (root)
```

### 4.2 Set Frontend Environment Variables

```bash
# Replace YOUR_BACKEND_URL with your actual backend Railway URL
railway variables set VITE_API_BASE_URL="https://your-backend-name.railway.app/api"
railway variables set VITE_BACKEND_PYTHON_URL="https://your-backend-name.railway.app"
railway variables set VITE_BACKEND_NODE_URL="https://your-backend-name.railway.app"
railway variables set NODE_ENV="production"
```

### 4.3 Deploy Frontend

```bash
# Deploy the frontend
railway up

# Check status
railway status
```

**Your frontend will be available at**: `https://your-frontend-name.railway.app`

## Step 5: Update CORS Settings

After both services are deployed, update the backend CORS settings:

```bash
# Navigate back to backend
cd backend

# Update FRONTEND_URL to your actual frontend Railway URL
railway variables set FRONTEND_URL="https://your-frontend-name.railway.app"

# Redeploy backend with updated CORS
railway up
```

## Step 6: Test End-to-End

1. **Visit your frontend URL**: `https://your-frontend-name.railway.app`
2. **Test backend health**: `https://your-backend-name.railway.app/ping`
3. **Test API docs**: `https://your-backend-name.railway.app/docs`
4. **Test user registration/login**
5. **Test service browsing and booking**

## Railway Configuration Files Created

- `backend/railway.toml` - Backend Railway configuration
- `railway.toml` - Frontend Railway configuration  
- `backend/start.sh` - Backend startup script
- `.env.railway` - Railway environment template

## Useful Railway Commands

```bash
# Check service status
railway status

# View real-time logs
railway logs --tail

# Connect to database
railway connect postgresql

# Open service in browser
railway open

# Delete service (be careful!)
railway delete

# List all your Railway projects
railway list

# Switch between projects
railway link
```

## Environment Variables Summary

### Backend Required Variables:
- `SECRET_KEY` - JWT secret (generate with `openssl rand -hex 32`)
- `ENVIRONMENT` - Set to "production"
- `DATABASE_URL` - Auto-provided by Railway PostgreSQL
- `FRONTEND_URL` - Your frontend Railway URL for CORS

### Frontend Required Variables:
- `VITE_API_BASE_URL` - Your backend Railway URL + /api
- `VITE_BACKEND_PYTHON_URL` - Your backend Railway URL
- `NODE_ENV` - Set to "production"

## Troubleshooting

### Backend Issues:
- **Database connection errors**: Ensure PostgreSQL service is added
- **CORS errors**: Check FRONTEND_URL environment variable
- **Build failures**: Check Python dependencies in requirements.txt
- **Port issues**: Railway automatically assigns PORT variable

### Frontend Issues:  
- **API connection errors**: Verify VITE_API_BASE_URL points to correct backend
- **Build failures**: Check Node.js version compatibility
- **Environment variables**: Ensure all VITE_ prefixed variables are set

### General:
- **Deployment failures**: Check Railway logs with `railway logs`
- **Service not starting**: Verify railway.toml configuration
- **Domain issues**: Wait a few minutes for DNS propagation

## Cost & Limits (Free Tier)

- **Execution Time**: 500 hours/month (shared across all services)
- **Memory**: 512MB per service
- **Storage**: 1GB per service  
- **Bandwidth**: 100GB/month
- **Custom domains**: Available on paid plans

## Next Steps for Production

1. **Custom Domain**: Add your own domain in Railway dashboard
2. **Monitoring**: Set up error tracking (Sentry integration available)
3. **Scaling**: Upgrade to paid plan for more resources
4. **Backup**: Configure database backups
5. **CI/CD**: Set up automatic deployments from GitHub

## Migration to AWS Later

The application is designed to easily migrate to AWS:
- **Frontend**: AWS Amplify or S3 + CloudFront
- **Backend**: AWS ECS, Lambda, or EC2
- **Database**: AWS RDS PostgreSQL
- **Environment variables**: AWS Systems Manager Parameter Store

For questions or issues, check:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://railway.app/discord
- Project Issues: https://github.com/supanda1/happyhome/issues