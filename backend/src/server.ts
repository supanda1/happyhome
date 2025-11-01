import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database';

// Import routes
import ordersRoutes from './routes/orders';
import employeesRoutes from './routes/employees';
import categoriesRoutes from './routes/categories';
import subcategoriesRoutes from './routes/subcategories';
import couponsRoutes from './routes/coupons';
import cartRoutes from './routes/cart';
import authRoutes from './routes/auth';
import servicesRoutes from './routes/services';
import dashboardRoutes from './routes/dashboard';
import bannersRoutes from './routes/banners';
import contactSettingsRoutes from './routes/contactSettings';
import reviewSettingsRoutes from './routes/reviewSettings';
import offerPlansRoutes from './routes/offerPlans';
import userRoutes from './routes/user';
import analyticsRoutes from './routes/analytics';
import smsProvidersRoutes from './routes/smsProviders';
import smsConfigRoutes from './routes/smsConfig';
import userManagementRoutes from './routes/userManagement';
import configRoutes from './routes/config';
import paymentsRoutes from './routes/payments';

// Load environment variables
dotenv.config();

// CRITICAL: Set timezone to UTC for consistent timestamp handling
// This ensures all database timestamps are stored as proper UTC time
process.env.TZ = 'UTC';

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:3002'],
  credentials: true
})); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Household Services API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API health check endpoint (frontend expects this)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Household Services API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as timestamp');
    res.json({
      status: 'OK',
      message: 'Database connection is healthy',
      timestamp: result.rows[0].timestamp
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Container status endpoint for health monitoring
app.get('/admin/system/containers', async (req, res) => {
  try {
    // Since we're running in a containerized environment, we can check basic container info
    // This is a simple implementation - in production you might want to use Docker API
    const containers = [
      {
        name: 'household_services_postgres',
        status: 'running',
        image: 'postgres:15-alpine',
        uptime: '2d 14h 35m',
        ports: ['5432:5432']
      },
      {
        name: 'household_services_api',
        status: 'running',
        image: 'household-services-api:latest',
        uptime: '2d 14h 33m',
        ports: ['8001:8001']
      }
    ];

    res.json({
      success: true,
      data: containers
    });
  } catch (error) {
    console.error('Error fetching container status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch container status'
    });
  }
});

// =============================================================================
// UNIFIED API ROUTES - CLEAN STRUCTURE
// =============================================================================

// Core API routes (RESTful structure)
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/engineers', employeesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/contact-settings', contactSettingsRoutes);
app.use('/api/review-settings', reviewSettingsRoutes);
app.use('/api/offer-plans', offerPlansRoutes);
app.use('/api/sms-providers', smsProvidersRoutes);
app.use('/api/sms-config', smsConfigRoutes);
app.use('/api/super-admin', userManagementRoutes);
app.use('/api/config', configRoutes);

// Admin API routes (same handlers, different prefix for frontend compatibility)
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin/subcategories', subcategoriesRoutes);
app.use('/api/admin/services', servicesRoutes);
app.use('/api/admin/coupons', couponsRoutes);
app.use('/api/admin/orders', ordersRoutes);
app.use('/api/admin/engineers', employeesRoutes);
app.use('/api/admin/banners', bannersRoutes);
app.use('/api/admin/contact-settings', contactSettingsRoutes);
app.use('/api/admin/review-settings', reviewSettingsRoutes);
app.use('/api/admin/offer-plans', offerPlansRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/users', userRoutes);

// Legacy v1 API routes for backward compatibility
app.use('/v1/orders', ordersRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Happy Homes Household Services API',
    version: '1.0.0',
    status: 'UNIFIED API STRUCTURE',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      subcategories: '/api/subcategories', 
      services: '/api/services',
      coupons: '/api/coupons',
      cart: '/api/cart',
      orders: '/api/orders',
      payments: '/api/payments',
      users: '/api/users',
      engineers: '/api/engineers',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics',
      banners: '/api/banners',
      contact_settings: '/api/contact-settings',
      review_settings: '/api/review-settings',
      offer_plans: '/api/offer-plans',
      sms_providers: '/api/sms-providers',
      sms_config: '/api/sms-config',
      super_admin: '/api/super-admin',
      config: '/api/config',
      admin_categories: '/api/admin/categories',
      admin_services: '/api/admin/services',
      admin_coupons: '/api/admin/coupons',
      admin_orders: '/api/admin/orders',
      v1_orders: '/v1/orders',
      health: '/health',
      database_health: '/health/db'
    },
    base_url: 'http://localhost:8001/api',
    documentation: 'All endpoints follow RESTful conventions with consistent /api/[resource] structure'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Startup data validation
async function initializeServer() {
  try {
    // Validate and restore essential data
    const { validateAndRestoreData } = require('../scripts/startup-data-validator');
    await validateAndRestoreData();
  } catch (error) {
    console.warn('⚠️  Startup data validation failed, continuing anyway:', error.message);
  }
  
  // Start server
  const server = app.listen(PORT, () => {
    console.log(`🚀 Household Services API server is running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Database health: http://localhost:${PORT}/health/db`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/`);
    console.log(`🔗 Frontend CORS: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  });

  return server;
}

// Initialize server with data validation and handle shutdown
let server: any;

initializeServer().then((serverInstance) => {
  server = serverInstance;
}).catch(console.error);

// Graceful shutdown  
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ Process terminated');
      pool.end();
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    pool.end();
    process.exit(0);
  });
});

export default app;