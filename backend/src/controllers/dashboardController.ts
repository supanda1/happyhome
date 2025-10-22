import { Request, Response } from 'express';
import pool from '../config/database';
import dbAdapter from '../config/databaseAdapter';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Initialize database adapter for safe queries
    await dbAdapter.initialize();

    // Get total services count
    const servicesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_services,
        COUNT(*) FILTER (WHERE is_active = true) as active_services
      FROM services
    `);

    // Get total categories count
    const categoriesResult = await pool.query(`
      SELECT COUNT(*) as total_categories
      FROM service_categories 
      WHERE is_active = true
    `);

    // Get total orders/bookings count
    const ordersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_bookings
      FROM orders
    `);

    // Get total users count
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total_users
      FROM users
      WHERE is_active = true
    `);

    // Get pending reviews count (unapproved reviews) - reviews table doesn't exist yet
    // const reviewsResult = await pool.query(`
    //   SELECT COUNT(*) as pending_reviews
    //   FROM reviews 
    //   WHERE is_approved = false
    // `);
    const reviewsResult = { rows: [{ pending_reviews: '0' }] };

    // Get active coupons count
    const couponsResult = await pool.query(`
      SELECT COUNT(*) as active_coupons
      FROM coupons 
      WHERE is_active = true AND valid_until >= NOW()
    `);

    // Calculate revenue consistently with order management system
    const revenueResult = await pool.query(`
      SELECT 
        -- All-time completed revenue (matches Order Management)
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_completed_revenue,
        -- Current month completed revenue
        COALESCE(SUM(CASE 
          WHEN status = 'completed' 
          AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN total_amount ELSE 0 END), 0) as monthly_completed_revenue,
        -- Current month total order value (all statuses)
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN total_amount ELSE 0 END), 0) as monthly_total_value,
        -- Pending revenue (all-time)
        COALESCE(SUM(CASE WHEN status IN ('pending', 'scheduled', 'in_progress') THEN total_amount ELSE 0 END), 0) as pending_revenue
      FROM orders
    `);

    // Get top services by booking count (simplified for now)
    const topServicesResult = await pool.query(`
      SELECT 
        s.name,
        'Unknown' as category,
        0 as bookings
      FROM services s
      WHERE s.is_active = true
      ORDER BY s.name
      LIMIT 5
    `);

    // Get recent activity (orders) - user-friendly format
    const recentActivityResult = await pool.query(`
      SELECT 
        'booking' as type,
        CASE 
          WHEN o.customer_name IS NOT NULL THEN CONCAT('New booking by ', o.customer_name)
          ELSE CONCAT('New booking (Order: ', o.order_number, ')')
        END as message,
        o.created_at as timestamp
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Format the data with consistent revenue calculations
    const dashboardData = {
      totalServices: parseInt(servicesResult.rows[0].total_services) || 0,
      totalCategories: parseInt(categoriesResult.rows[0].total_categories) || 0,
      totalBookings: parseInt(ordersResult.rows[0].total_bookings) || 0,
      totalUsers: parseInt(usersResult.rows[0].total_users) || 0,
      activeServices: parseInt(servicesResult.rows[0].active_services) || 0,
      pendingReviews: parseInt(reviewsResult.rows[0].pending_reviews) || 0,
      activeCoupons: parseInt(couponsResult.rows[0].active_coupons) || 0,
      todayBookings: parseInt(ordersResult.rows[0].today_bookings) || 0,
      // Revenue fields - now consistent with Order Management
      monthlyRevenue: parseFloat(revenueResult.rows[0].monthly_completed_revenue) || 0, // Current month completed orders only
      totalRevenue: parseFloat(revenueResult.rows[0].total_completed_revenue) || 0, // All-time completed orders (matches Order Management)
      monthlyTotalValue: parseFloat(revenueResult.rows[0].monthly_total_value) || 0, // Current month all orders
      pendingRevenue: parseFloat(revenueResult.rows[0].pending_revenue) || 0, // All-time pending orders
      topServices: topServicesResult.rows.map((row: any) => ({
        name: row.name,
        bookings: parseInt(row.bookings) || 0,
        category: row.category || 'Unknown'
      })),
      recentActivity: recentActivityResult.rows.map((row: any, index: number) => ({
        id: `activity-${index + 1}`,
        type: row.type,
        message: row.message,
        timestamp: formatTimeAgo(row.timestamp)
      }))
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

// Helper function to format timestamps
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMilliseconds = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return past.toLocaleDateString();
  }
}

// Get system health status
export const getSystemHealth = async (_req: Request, res: Response) => {
  try {

    // Check database connection
    await pool.query('SELECT 1');

    // Get various system stats
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        connectionPool: {
          totalConnections: pool.totalCount,
          idleConnections: pool.idleCount,
          waitingClients: pool.waitingCount
        }
      },
      services: {
        apiVersion: process.env.API_VERSION || '1.0.0',
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime())
      }
    };

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'System health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
};