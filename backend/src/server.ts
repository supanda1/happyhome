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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
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

// Add specific routes for frontend compatibility (BEFORE general routes)
app.get('/api/v1/services/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        icon,
        image_paths,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM service_categories 
      ORDER BY sort_order ASC, name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service categories'
    });
  }
});

app.get('/api/v1/services/subcategories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ss.id,
        ss.name,
        ss.description,
        ss.icon,
        ss.is_active,
        ss.sort_order,
        ss.category_id,
        ss.created_at,
        ss.updated_at,
        sc.name as category_name,
        sc.icon as category_icon,
        sc.image_paths as category_image_path
      FROM service_subcategories ss
      LEFT JOIN service_categories sc ON ss.category_id = sc.id
      ORDER BY sc.sort_order ASC, ss.sort_order ASC, ss.name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service subcategories'
    });
  }
});

// =============================================================================
// API Routes - Production-Ready Structure
// =============================================================================

// Primary API routes (current version)
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes); // Alias for user routes
app.use('/api/contact-settings', contactSettingsRoutes);
app.use('/api/review-settings', reviewSettingsRoutes);
app.use('/api/offer-plans', offerPlansRoutes);
app.use('/api/sms-providers', smsProvidersRoutes);
app.use('/api/sms-config', smsConfigRoutes);
app.use('/api/super-admin', userManagementRoutes);

// Admin-specific routes (protected)
app.use('/api/admin/categories', categoriesRoutes);
app.use('/api/admin/subcategories', subcategoriesRoutes);
app.use('/api/admin/coupons', couponsRoutes);
app.use('/api/admin/banners', bannersRoutes);
app.use('/api/admin/contact-settings', contactSettingsRoutes);
app.use('/api/admin/sms-providers', smsProvidersRoutes);
app.use('/api/admin/sms-config', smsConfigRoutes);
app.use('/api/admin/user-management', userManagementRoutes);

// Legacy v1 API routes (for backward compatibility)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/subcategories', subcategoriesRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/coupons', couponsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/banners', bannersRoutes);
app.use('/api/v1/contact-settings', contactSettingsRoutes);
app.use('/api/v1/review-settings', reviewSettingsRoutes);
app.use('/api/v1/offer-plans', offerPlansRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/sms-providers', smsProvidersRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Household Services API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      employees: '/api/employees',
      categories: '/api/categories',
      subcategories: '/api/subcategories',
      coupons: '/api/coupons',
      cart: '/api/cart',
      services: '/api/services',
      dashboard: '/api/dashboard',
      banners: '/api/banners',
      contact_settings: '/api/contact-settings',
      review_settings: '/api/review-settings',
      offer_plans: '/api/offer-plans',
      user: '/api/user',
      analytics: '/api/analytics',
      sms_providers: '/api/sms-providers',
      health: '/health',
      database_health: '/health/db'
    },
    documentation: 'https://docs.happyhomes.com/api'
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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Household Services API server is running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Database health: http://localhost:${PORT}/health/db`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
  console.log(`🔗 Frontend CORS: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    pool.end();
    process.exit(0);
  });
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