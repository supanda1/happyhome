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

    // Calculate revenue based on business logic: only 'pending' orders are truly pending
    // 'scheduled', 'in_progress', 'confirmed', and 'completed' orders count as completed revenue
    const revenueResult = await pool.query(`
      SELECT 
        -- All-time completed revenue (includes scheduled, in_progress, confirmed, completed)
        COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as total_completed_revenue,
        -- Current month completed revenue (includes scheduled, in_progress, confirmed, completed)
        COALESCE(SUM(CASE 
          WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed')
          AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN total_amount ELSE 0 END), 0) as monthly_completed_revenue,
        -- Current month total order value (all statuses)
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN total_amount ELSE 0 END), 0) as monthly_total_value,
        -- Pending revenue (only truly pending orders)
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_revenue
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

    // Get recent bookings with user details (no need for service join since orders table has sufficient info)
    const recentBookingsResult = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.preferred_date,
        o.created_at,
        o.customer_name,
        o.customer_email
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Get monthly revenue data for chart (last 6 months)
    const monthlyRevenueResult = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    // Format the data to match DashboardStats interface
    const dashboardData = {
      totalServices: parseInt(servicesResult.rows[0].total_services) || 0,
      totalCategories: parseInt(categoriesResult.rows[0].total_categories) || 0,
      totalBookings: parseInt(ordersResult.rows[0].total_bookings) || 0,
      totalUsers: parseInt(usersResult.rows[0].total_users) || 0,
      totalCustomers: parseInt(usersResult.rows[0].total_users) || 0, // Changed from totalUsers to totalCustomers
      activeServices: parseInt(servicesResult.rows[0].active_services) || 0,
      pendingReviews: parseInt(reviewsResult.rows[0].pending_reviews) || 0,
      activeCoupons: parseInt(couponsResult.rows[0].active_coupons) || 0,
      todayBookings: parseInt(ordersResult.rows[0].today_bookings) || 0,
      totalRevenue: parseFloat(revenueResult.rows[0].total_completed_revenue) || 0,
      monthlyRevenue: parseFloat(revenueResult.rows[0].monthly_total_value) || 0,
      completedRevenue: parseFloat(revenueResult.rows[0].total_completed_revenue) || 0,
      pendingRevenue: parseFloat(revenueResult.rows[0].pending_revenue) || 0,
      // Format recent bookings to match Booking interface structure
      recentBookings: recentBookingsResult.rows.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        totalAmount: parseFloat(row.total_amount) || 0,
        status: row.status,
        scheduledDate: row.preferred_date || row.created_at,
        user: {
          firstName: row.customer_name?.split(' ')[0] || 'Customer',
          lastName: row.customer_name?.split(' ')[1] || '',
          email: row.customer_email || ''
        },
        service: {
          name: 'Service Order'
        },
        createdAt: row.created_at
      })),
      // Format top services to match Service interface structure  
      topServices: topServicesResult.rows.map((row: any) => ({
        id: `service-${row.name}`,
        name: String(row.name), // Ensure name is always a string
        basePrice: 0, // Default values for Service interface
        discountedPrice: 0,
        rating: 4.5,
        reviewCount: parseInt(row.bookings) || 0,
        category: { name: String(row.category || 'Unknown') }
      })),
      // Format monthly revenue chart data (different from scalar monthlyRevenue above)
      monthlyRevenueChart: monthlyRevenueResult.rows.map((row: any) => ({
        month: String(row.month),
        revenue: parseFloat(row.revenue) || 0
      })),
      // Add recent activity (mock for now - can be enhanced later)
      recentActivity: [
        {
          id: 'activity-1',
          type: 'booking',
          message: 'New order received - Order #HH00000014',
          timestamp: new Date().toISOString()
        },
        {
          id: 'activity-2', 
          type: 'service',
          message: 'Service updated - Plumbing Repair',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    // Debug logging to see exact structure and financial data
    console.log('🔍 Dashboard API Response Debug:', {
      totalServices: dashboardData.totalServices,
      totalBookings: dashboardData.totalBookings,
      totalRevenue: dashboardData.totalRevenue,
      monthlyRevenue: dashboardData.monthlyRevenue,
      completedRevenue: dashboardData.completedRevenue,
      pendingRevenue: dashboardData.pendingRevenue,
      revenueFromDB: {
        monthly_total_value: parseFloat(revenueResult.rows[0].monthly_total_value) || 0,
        total_completed_revenue: parseFloat(revenueResult.rows[0].total_completed_revenue) || 0,
        pending_revenue: parseFloat(revenueResult.rows[0].pending_revenue) || 0
      },
      revenueBusinessLogic: {
        completedStatuses: 'completed, scheduled, in_progress, confirmed',
        pendingStatuses: 'pending only',
        note: 'Business rule: scheduled/in_progress orders count as completed revenue'
      },
      topServicesCount: dashboardData.topServices.length,
      recentBookingsCount: dashboardData.recentBookings.length,
      monthlyRevenueChartCount: dashboardData.monthlyRevenueChart.length
    });

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