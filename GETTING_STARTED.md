# 🚀 Getting Started - One Command Setup

Get your **Happy Homes Household Services Platform** running in under 5 minutes!

## 🎯 Quick Start (Recommended)

**One command to rule them all:**

```bash
chmod +x quick-start.sh && ./quick-start.sh
```

That's it! 🎉 The script will:
- ✅ Install Docker (if needed)
- ✅ Set up the complete platform
- ✅ Start all services automatically
- ✅ Verify everything is working

---

## 🖥️ What You'll Get

After running the setup:

- **🌐 Frontend**: http://localhost:3001
- **🔧 Backend API**: http://localhost:8001  
- **👤 Admin Login**: admin@happyhomes.com / admin123
- **🗄️ Database**: PostgreSQL with sample data

---

## 📋 System Requirements

- **OS**: Linux, macOS, or Windows (with WSL/Git Bash)
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 10GB free space
- **Network**: Internet for initial setup

---

## 🛠️ Alternative Setup Methods

### Method 1: Docker Setup (Manual)
```bash
./setup-docker.sh
```

### Method 2: Development Mode
```bash
# Frontend (Terminal 1)
npm install
npm run dev  # http://localhost:3001

# Backend (Terminal 2)  
cd backend
pip install -r requirements.txt
python app/main.py  # http://localhost:8000
```

---

## 🎮 Daily Commands

Once set up, use these commands for daily development:

```bash
./docker-dev.sh start     # Start services
./docker-dev.sh stop      # Stop services  
./docker-dev.sh logs      # View logs
./docker-dev.sh status    # Check status
./docker-dev.sh build     # Rebuild after changes
```

---

## 🚨 Troubleshooting

### If setup fails:
```bash
# Check Docker
docker --version
docker compose version

# Reset everything
./docker-dev.sh reset

# Check logs
./docker-dev.sh logs
```

### Port conflicts:
```bash
# Check what's using ports
sudo lsof -i :3001
sudo lsof -i :8001

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### Permission issues (Linux):
```bash
sudo usermod -aG docker $USER
newgrp docker
chmod +x *.sh
```

---

## 📱 Using the Platform

### Customer Flow:
1. Visit http://localhost:3001
2. Browse services → Add to cart → Checkout
3. Track booking status

### Admin Flow:  
1. Login with admin@happyhomes.com / admin123
2. Manage services, orders, employees
3. View analytics and reports

---

## 🌟 Features Included

- ✅ **Customer Portal**: Service browsing, booking, payments
- ✅ **Admin Dashboard**: Complete management interface  
- ✅ **Payment Integration**: Multiple gateway support
- ✅ **Real-time Updates**: Live order tracking
- ✅ **SMS/WhatsApp**: Automated notifications
- ✅ **Analytics**: Business intelligence dashboard
- ✅ **Employee Management**: Staff assignment system

---

## 📞 Support

**Having issues?** Check these in order:

1. **Check service status**: `./docker-dev.sh status`
2. **View logs**: `./docker-dev.sh logs`  
3. **Restart services**: `./docker-dev.sh restart`
4. **Complete reset**: `./docker-dev.sh reset`

**Still stuck?** Common solutions:
- Restart Docker Desktop (macOS/Windows)
- Run `sudo systemctl start docker` (Linux)
- Check available disk space: `df -h`
- Update Docker to latest version

---

## 🎉 Success Indicators

You'll know setup is complete when:

- ✅ `docker compose ps` shows all services "Up"
- ✅ http://localhost:3001 loads the homepage
- ✅ http://localhost:8001/health returns `{"status": "healthy"}`
- ✅ Admin login works at http://localhost:3001

---

**🏠 Ready to launch your household services business? Let's go! 🚀**