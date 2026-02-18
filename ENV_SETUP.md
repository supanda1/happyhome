# Environment Configuration Guide

## 📁 Environment Files

- **`.env`** - Local development settings (localhost)
- **`.env.production`** - Production settings (Railway + Vercel)
- **Vercel Dashboard** - Production environment variables (overrides .env.production)

## 🖥️ Local Development

**Use `.env` file for local development:**
```bash
# .env (for localhost development)
VITE_API_BASE_URL=http://localhost:8001/api
VITE_BACKEND_PYTHON_URL=http://localhost:8000
VITE_BACKEND_NODE_URL=http://localhost:8001
VITE_HEALTH_CHECK_INTERVAL=30000  # Enable health monitoring
```

**Start local development:**
```bash
npm run dev  # Uses .env file
```

## 🌐 Production Deployment

**Vercel uses environment variables from dashboard:**
```bash
# Set in Vercel Dashboard → Settings → Environment Variables
VITE_API_BASE_URL=https://virtuous-rebirth-production-3277.up.railway.app
VITE_HEALTH_CHECK_INTERVAL=0  # Disable health monitoring
```

**Production build:**
```bash
npm run build  # Uses .env.production or Vercel env vars
```

## ⚙️ Current Setup

### Local Development:
- Frontend: http://localhost:3001  
- Python Backend: http://localhost:8000
- Node Backend: http://localhost:8001
- Health Monitoring: ✅ Enabled

### Production:
- Frontend: https://happyhome-zeta.vercel.app/
- Backend: https://virtuous-rebirth-production-3277.up.railway.app/
- Health Monitoring: ❌ Disabled (prevents localhost errors)

## 🔧 Admin Login (Both Environments):
- Email: `admin@happyhomes.com`
- Password: `anything` (validation disabled for testing)
- Superadmin: `superadmin@happyhomes.com`