# Happy Homes - Household Services Platform

A comprehensive household services booking and management platform with React frontend and Python/Node.js backend.

## Features

- **Customer Portal**: Service booking, cart management, user profiles
- **Admin Panel**: Complete service management, orders, analytics
- **Dual Backend**: Python FastAPI + Node.js TypeScript implementations
- **Real-time**: WhatsApp integration, SMS notifications
- **Security**: HTTP-only cookies, XSS protection, role-based access

## Tech Stack

### Frontend
- React 19.1.1 + TypeScript
- Tailwind CSS 3.4.0
- Vite 7.1.2
- TanStack Query 5.17.0

### Backend
- Python FastAPI + SQLAlchemy
- Node.js + Express + TypeScript
- PostgreSQL Database
- Redis Cache

## Quick Start

### Frontend
```bash
npm install
npm run dev  # http://localhost:3001
```

### Backend (Python)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/main.py  # http://localhost:8000
```

### Backend (Node.js)
```bash
cd backend
npm install
npm run dev  # http://localhost:8001
```

## Admin Access

- **URL**: http://localhost:3001 → Profile Menu → Admin Panel
- **Credentials**: admin@happyhomes.com / admin123
- **Features**: Categories, Services, Orders, Analytics, SMS Config

## Production Features

- ✅ Backend API integration (no localStorage)
- ✅ HTTP-only cookie authentication  
- ✅ XSS/CSRF protection
- ✅ WhatsApp business integration
- ✅ SMS notifications (Twilio/TextLocal)
- ✅ Real-time admin dashboard
- ✅ GST-compliant pricing
- ✅ Professional service management

## License

Private - Happy Homes Services Platform
