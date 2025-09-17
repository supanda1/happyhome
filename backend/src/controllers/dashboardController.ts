import { Request, Response } from 'express';
import pool from '../config/database';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {

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

    // Get pending reviews count (unapproved reviews)
    const reviewsResult = await pool.query(`
      SELECT COUNT(*) as pending_reviews
      FROM reviews 
      WHERE is_approved = false
    `);

    // Get active coupons count
    const couponsResult = await pool.query(`
      SELECT COUNT(*) as active_coupons
      FROM coupons 
      WHERE is_active = true AND valid_until >= NOW()
    `);

    // Calculate monthly revenue (current month) - including all orders as most are pending
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN final_amount ELSE 0 END), 0) as completed_revenue,
        COALESCE(SUM(final_amount), 0) as total_order_value,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'scheduled', 'in_progress') THEN final_amount ELSE 0 END), 0) as pending_revenue
      FROM orders 
      WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    // Get top services by booking count
    const topServicesResult = await pool.query(`
      SELECT 
        s.name,
        sc.name as category,
        COUNT(oi.id) as bookings
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN order_items oi ON s.id = oi.service_id
      WHERE s.is_active = true
      GROUP BY s.id, s.name, sc.name
      ORDER BY bookings DESC
      LIMIT 5
    `);

    // Get recent activity (orders and reviews)
    const recentActivityResult = await pool.query(`
      (
        SELECT 
          'booking' as type,
          CONCAT('New booking for ', s.name, ' by ', u.first_name, ' ', u.last_name) as message,
          o.created_at as timestamp,
          o.created_at
        FROM orders o
        JOIN users u ON o.customer_id = u.id
        JOIN order_items oi ON o.id = oi.order_id
        JOIN services s ON oi.service_id = s.id
        ORDER BY o.created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'review' as type,
          CONCAT('New ', r.rating, '-star review received for ', s.name) as message,
          r.created_at as timestamp,
          r.created_at
        FROM reviews r
        JOIN services s ON r.service_id = s.id
        ORDER BY r.created_at DESC
        LIMIT 2
      )
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Format the data
    const dashboardData = {
      totalServices: parseInt(servicesResult.rows[0].total_services) || 0,
      totalCategories: parseInt(categoriesResult.rows[0].total_categories) || 0,
      totalBookings: parseInt(ordersResult.rows[0].total_bookings) || 0,
      totalUsers: parseInt(usersResult.rows[0].total_users) || 0,
      activeServices: parseInt(servicesResult.rows[0].active_services) || 0,
      pendingReviews: parseInt(reviewsResult.rows[0].pending_reviews) || 0,
      activeCoupons: parseInt(couponsResult.rows[0].active_coupons) || 0,
      todayBookings: parseInt(ordersResult.rows[0].today_bookings) || 0,
      monthlyRevenue: parseFloat(revenueResult.rows[0].total_order_value) || 0,
      completedRevenue: parseFloat(revenueResult.rows[0].completed_revenue) || 0,
      pendingRevenue: parseFloat(revenueResult.rows[0].pending_revenue) || 0,
      topServices: topServicesResult.rows.map(row => ({
        name: row.name,
        bookings: parseInt(row.bookings) || 0,
        category: row.category || 'Unknown'
      })),
      recentActivity: recentActivityResult.rows.map((row, index) => ({
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
export const getSystemHealth = async (req: Request, res: Response) => {
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