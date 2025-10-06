# PROJECT.md

This file provides comprehensive guidance and documentation for working with the Happy Homes project codebase.

## Project Overview

Happy Homes is a comprehensive household services booking platform with a React frontend and dual backend implementations (Python FastAPI + Node.js TypeScript). It provides service booking, cart management, admin panel, and real-time features.

## Development Commands

### Frontend (React + TypeScript + Vite)
```bash
# Development
npm install
npm run dev                    # Start dev server on http://localhost:3001

# Building & Testing
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run preview               # Preview production build

# Security & Quality
npm run security-check        # Custom security checks
npm run security-audit        # npm audit
npm run security-full         # Complete security suite
npm run pre-commit           # Pre-commit hooks (runs security-full)
```

### Backend Development
The project has two backend implementations that can run independently:

**Python FastAPI Backend (Primary - Port 8000/8001):**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate  
pip install -r requirements.txt
python app/main.py            # Start FastAPI server

# Development commands
npm run start:backend         # Start Python backend via npm
npm run start:backend:debug   # Start with debug logging
```

**Node.js TypeScript Backend (Alternative - Port 8001):**
```bash
cd backend
npm install
npm run dev                   # Development server with hot reload
npm run build                 # Compile TypeScript
npm run start                 # Production server

# Database operations
npm run db:migrate            # Run database migrations
npm run db:seed              # Seed database with initial data
npm run db:setup             # Run migrations + seed
```

### Full Stack Development
```bash
# Terminal 1: Start backend
npm run start:backend

# Terminal 2: Start frontend  
npm run dev

# Access points:
# Frontend: http://localhost:3001
# Backend API: http://localhost:8001/api
# Health Check: http://localhost:8001/health
```

## Architecture Overview

### Frontend Architecture
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2 with path aliases (@components, @pages, etc.)
- **Styling**: Tailwind CSS 3.4.0 with PostCSS
- **State Management**: TanStack Query 5.17.0 for server state + React Context for app state
- **Routing**: React Router DOM (custom navigation system in App.tsx)
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
**Dual Backend System:**
1. **Python FastAPI** (`/backend/`): Primary API with SQLAlchemy, PostgreSQL
2. **Node.js Express** (`/backend/src/`): Alternative implementation with TypeScript

**Key Backend Features:**
- PostgreSQL database with connection pooling
- JWT authentication with HTTP-only cookies
- Role-based access control (customer, admin, super_admin)
- Comprehensive middleware (CORS, security headers, rate limiting)
- Structured logging and error handling
- API versioning (/api/v1)

### Database Schema
**Core Tables:**
- `categories` → `subcategories` → `services` (hierarchical service structure)
- `users` → `bookings/orders` (customer management)
- `employees` → `assignments` (staff management)  
- `coupons`, `cart_items`, `reviews`, `notifications`

**Image Management:**
- Service images stored in `/public/images/subcategories/`
- Fallback system with category-based image resolution
- Dynamic image component with error handling

### State Management Patterns
**Frontend State:**
- Server state: TanStack Query with 5-minute stale time
- Navigation: Custom page-based routing in App.tsx 
- Authentication: AuthContext with user session management
- Cart: Real-time cart state with backend persistence
- Admin data: adminDataManager.ts with backend sync

**Key State Files:**
- `/src/contexts/AuthContext.tsx` - User authentication
- `/src/utils/adminDataManager.ts` - Admin data management  
- `/src/hooks/useBackendData.ts` - Server data fetching
- `/src/contexts/ServiceContext.tsx` - Service-specific state

## Key Components Structure

### Admin System (`/src/pages/admin/`)
Complete admin panel with separate pages for each management area:
- **AdminDashboard.tsx** - Main dashboard with stats
- **ServicesManagement.tsx** - Service CRUD operations
- **CategoriesManagement.tsx** - Category hierarchy management
- **OrdersManagement.tsx** - Order processing and assignment
- **EmployeesManagement.tsx** - Staff management with skill assignments
- **AnalyticsDashboard.tsx** - Business intelligence and reporting

### Customer System (`/src/pages/customer/`)
- **HomePage.tsx** - Category browsing with dynamic service loading
- **ServiceDetailPage.tsx** - Detailed service view with booking
- **CartPage.tsx** - Cart management and checkout preparation
- **CheckoutPage.tsx** - Order placement with address management
- **MyBookingsPage.tsx** - Order history and tracking

### Shared Components (`/src/components/`)
- **UI Components** (`/ui/`): Reusable components (Button, Modal, Loading, etc.)
- **SmartImage.tsx** - Intelligent image loading with fallbacks
- **CartSidebarFixed.tsx** - Persistent cart sidebar for category pages
- **ErrorBoundary.tsx** - Error handling wrapper

## Backend API Structure

### Authentication Flow
- JWT tokens stored as HTTP-only cookies
- Refresh token rotation for security
- Role-based middleware protection
- Session management with Redis (optional)

### API Endpoints Pattern
```
GET    /api/health                 # Health check
POST   /api/auth/login             # User authentication  
GET    /api/categories             # Get all categories
GET    /api/services               # Get services with filtering
POST   /api/cart/add               # Add item to cart
GET    /api/orders                 # Get user orders
POST   /api/admin/services         # Admin: Create service
PUT    /api/admin/services/:id     # Admin: Update service
```

### Database Connection
- **Python Backend**: SQLAlchemy with asyncpg for PostgreSQL
- **Node.js Backend**: node-postgres (pg) with connection pooling
- Migration system for schema management
- Database health checks at `/health/db`

## Development Workflow

### Adding New Services
1. **Admin Panel**: Use ServicesManagement to add via UI
2. **Database**: Services auto-link to categories/subcategories  
3. **Images**: Add to `/public/images/subcategories/[category]/`
4. **Frontend**: Services appear automatically via backend API

### Adding New Pages
1. Create component in appropriate `/src/pages/` directory
2. Add route handling in `App.tsx` navigation system
3. Update navigation bar if needed (header section)
4. Add TypeScript types in `/src/types/`

### Environment Configuration
- **Development**: Copy `.env.example` to `.env.local`
- **API Base URL**: Configure `VITE_API_BASE_URL` for backend communication
- **Database**: Set `DATABASE_URL` for PostgreSQL connection
- **Ports**: Frontend (3001), Backend (8000/8001)

### Image Management System
Images are resolved in this priority order:
1. Specific service images in `/public/images/subcategories/[category]/[service]/`
2. Category-level images in `/public/images/categories/[category]/`
3. Fallback emoji icons from database
4. Default placeholder image

The `ServiceImage` component handles this resolution automatically.

### Cart and Checkout Flow
1. **Add to Cart**: Services added via `addToCart()` in adminDataManager
2. **Cart Sidebar**: Real-time cart updates on category pages  
3. **Checkout**: Address management → payment → order creation
4. **Order Processing**: Admin assignment system for service delivery

## Testing and Quality

### Code Quality Tools
- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Security**: Custom security checks in pre-commit hooks
- **Pre-commit**: Automated security and quality checks

### Error Handling Patterns
- **Frontend**: ErrorBoundary components with graceful fallbacks
- **Backend**: Structured error responses with proper HTTP codes
- **Database**: Connection retry logic and health monitoring
- **Images**: Fallback system for missing service images

### Performance Optimization
- **Vite**: Optimized bundling with code splitting
- **TanStack Query**: Intelligent caching and background updates
- **Images**: Lazy loading with fallback system
- **Database**: Connection pooling and query optimization

## Important Notes

### Dual Backend System
The project maintains two backend implementations for flexibility:
- **Python FastAPI**: More feature-complete, recommended for production
- **Node.js Express**: Alternative implementation, fully functional

Both backends expose the same API contracts and can be used interchangeably.

### Image Path Management
Service images must follow the exact directory structure:
```
/public/images/subcategories/[category-name]/[service-name]/
```

The system automatically handles name normalization and fallback resolution.

### Admin Access
- Default admin credentials: admin@happyhomes.com / admin123
- Access via Profile Menu → Admin Panel
- Role-based permissions: customer, admin, super_admin

### Real-time Features  
- Cart updates sync immediately across components
- Admin changes reflect in customer interface without refresh
- Service availability updates in real-time via API polling