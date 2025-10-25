import { Request, Response } from 'express';
import pool from '../config/database';

// Analytics interfaces matching frontend expectations
interface RevenueBySubcategory {
  name: string;
  subcategoryId: string;
  revenue: number;
  orders: number;
  growth: number;
}

interface RevenueByCategory {
  category: string;
  categoryId: string;
  totalRevenue: number;
  totalOrders: number;
  growth: number;
  subcategories: RevenueBySubcategory[];
}

interface TimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  monthlyGrowth: number;
  topCategories: RevenueByCategory[];
  timeSeriesData: TimeSeriesPoint[];
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Analytics Controller
 * Handles analytics data retrieval and export functionality with real database integration
 */
export class AnalyticsController {
  
  /**
   * Get analytics overview with revenue breakdown by categories and subcategories
   */
  static async getAnalyticsOverview(req: Request, res: Response): Promise<void> {
    try {
      // Get period parameter for time series filtering
      const period = (req.query.period as string) || 'monthly';
      console.log('📊 Analytics period requested:', period);
      

      // First, check if we have any orders at all
      const orderCountQuery = `SELECT COUNT(*) as count FROM orders`;
      const orderCountResult = await pool.query(orderCountQuery);
      const hasOrders = parseInt(orderCountResult.rows[0].count) > 0;
      
      if (!hasOrders) {
        
        // Return empty but valid analytics data structure
        const analyticsData: AnalyticsOverview = {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
          monthlyGrowth: 0,
          topCategories: [],
          timeSeriesData: []
        };

        res.json({
          success: true,
          message: 'Analytics overview retrieved (no orders found)',
          data: analyticsData
        });
        return;
      }

      // Calculate date ranges for current period (simplified)
      const now = new Date();
      // Note: Date range variables available for future period filtering
      // const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      // const currentEnd = new Date(now);
      
      // Get basic totals from orders table - consistent with dashboard revenue logic
      // Business rule: 'completed', 'scheduled', 'in_progress', 'confirmed' orders count as completed revenue
      const totalsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as total_revenue,
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress', 'confirmed')) as completed_orders,
          COALESCE(AVG(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE NULL END), 0) as avg_order_value
        FROM orders 
        WHERE status NOT IN ('cancelled')
      `;
      
      const totalsResult = await pool.query(totalsQuery);
      const totals = totalsResult.rows[0];
      
      // Debug logging for analytics data
      console.log('🔍 Analytics API Debug:', {
        totalRevenue: parseFloat(totals.total_revenue) || 0,
        totalOrders: parseInt(totals.total_orders) || 0,
        completedOrders: parseInt(totals.completed_orders) || 0,
        avgOrderValue: parseFloat(totals.avg_order_value) || 0,
        businessLogic: 'completed, scheduled, in_progress, confirmed orders count as revenue'
      });

      // Get categories with any revenue data
      const categoryQuery = `
        SELECT 
          c.id,
          c.name,
          c.icon,
          c.sort_order
        FROM service_categories c
        ORDER BY c.sort_order ASC, c.name ASC
      `;
      
      const categoryResult = await pool.query(categoryQuery);
      const topCategories: RevenueByCategory[] = [];
      
      for (const category of categoryResult.rows) {
        // Get revenue for this specific category - consistent with dashboard revenue logic
        const categoryRevenueQuery = `
          SELECT 
            COALESCE(SUM(
              CASE 
                WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN 
                  -- Calculate proportional revenue from order's total_amount
                  (oi.total_price / NULLIF(category_total.total_item_price, 0)) * o.total_amount
                ELSE 0 
              END
            ), 0) as revenue,
            COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN o.id ELSE NULL END) as orders
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          JOIN services s ON oi.service_id = s.id
          JOIN (
            -- Get total item prices per order for proportional calculation
            SELECT order_id, SUM(total_price) as total_item_price
            FROM order_items 
            GROUP BY order_id
          ) category_total ON o.id = category_total.order_id
          WHERE s.category_id = $1
            AND o.status NOT IN ('cancelled')
        `;
        
        const categoryRevenueResult = await pool.query(categoryRevenueQuery, [category.id]);
        const categoryRevenue = categoryRevenueResult.rows[0];
        
        if (parseFloat(categoryRevenue.revenue) > 0) {
          // Get subcategories for this category
          const subcategoryQuery = `
            SELECT 
              sc.id,
              sc.name,
              sc.sort_order
            FROM service_subcategories sc
            WHERE sc.category_id = $1
            ORDER BY sc.sort_order ASC, sc.name ASC
          `;
          
          const subcategoryResult = await pool.query(subcategoryQuery, [category.id]);
          const subcategories: RevenueBySubcategory[] = [];
          
          for (const sub of subcategoryResult.rows) {
            // Get revenue for this subcategory - consistent with dashboard revenue logic
            const subRevenueQuery = `
              SELECT 
                COALESCE(SUM(
                  CASE 
                    WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN 
                      (oi.total_price / NULLIF(category_total.total_item_price, 0)) * o.total_amount
                    ELSE 0 
                  END
                ), 0) as revenue,
                COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN o.id ELSE NULL END) as orders
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              JOIN services s ON oi.service_id = s.id
              JOIN (
                SELECT order_id, SUM(total_price) as total_item_price
                FROM order_items 
                GROUP BY order_id
              ) category_total ON o.id = category_total.order_id
              WHERE s.subcategory_id = $1
                AND o.status NOT IN ('cancelled')
            `;
            
            const subRevenueResult = await pool.query(subRevenueQuery, [sub.id]);
            const subRevenue = subRevenueResult.rows[0];
            
            if (parseFloat(subRevenue.revenue) > 0) {
              // Calculate growth for subcategory (current month vs previous month)
              const subGrowthQuery = `
                SELECT 
                  COALESCE(SUM(oi.total_price), 0) as prev_revenue
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN services s ON oi.service_id = s.id
                WHERE s.subcategory_id = $1
                  AND o.status NOT IN ('cancelled')
                  AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
              `;
              
              const subGrowthResult = await pool.query(subGrowthQuery, [sub.id]);
              const prevRevenue = parseFloat(subGrowthResult.rows[0].prev_revenue) || 0;
              const currentRevenue = parseFloat(subRevenue.revenue);
              const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
              
              subcategories.push({
                name: sub.name,
                subcategoryId: sub.id,
                revenue: currentRevenue,
                orders: parseInt(subRevenue.orders),
                growth: Math.round(growth * 100) / 100 // Round to 2 decimal places
              });
            }
          }
          
          // Calculate growth for category (current month vs previous month)
          const categoryGrowthQuery = `
            SELECT 
              COALESCE(SUM(oi.total_price), 0) as prev_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN services s ON oi.service_id = s.id
            WHERE s.category_id = $1
              AND o.status NOT IN ('cancelled')
              AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          `;
          
          const categoryGrowthResult = await pool.query(categoryGrowthQuery, [category.id]);
          const prevCategoryRevenue = parseFloat(categoryGrowthResult.rows[0].prev_revenue) || 0;
          const currentCategoryRevenue = parseFloat(categoryRevenue.revenue);
          const categoryGrowth = prevCategoryRevenue > 0 ? ((currentCategoryRevenue - prevCategoryRevenue) / prevCategoryRevenue) * 100 : 0;
          
          topCategories.push({
            category: category.name,
            categoryId: category.id,
            totalRevenue: currentCategoryRevenue,
            totalOrders: parseInt(categoryRevenue.orders),
            growth: Math.round(categoryGrowth * 100) / 100, // Round to 2 decimal places
            subcategories: subcategories.sort((a, b) => b.revenue - a.revenue)
          });
        }
      }

      // Sort categories by revenue
      topCategories.sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Dynamic time series data based on period
      const timeSeriesData: TimeSeriesPoint[] = [];
      
      if (period === 'daily') {
        // Last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().substring(0, 10); // YYYY-MM-DD format
          
          const dailyQuery = `
            SELECT 
              COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as revenue,
              COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress', 'confirmed')) as orders
            FROM orders 
            WHERE created_at::date = $1::date
              AND status NOT IN ('cancelled')
          `;
          
          const dailyResult = await pool.query(dailyQuery, [dateStr]);
          const daily = dailyResult.rows[0];
          
          timeSeriesData.push({
            date: dateStr,
            revenue: parseFloat(daily.revenue),
            orders: parseInt(daily.orders)
          });
        }
      } else if (period === 'weekly') {
        // Last 12 weeks
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
          const weekStr = weekStart.toISOString().substring(0, 10);
          
          const weeklyQuery = `
            SELECT 
              COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as revenue,
              COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress', 'confirmed')) as orders
            FROM orders 
            WHERE created_at >= $1::timestamp 
              AND created_at <= ($2::timestamp + INTERVAL '1 day')
              AND status NOT IN ('cancelled')
          `;
          
          const weeklyResult = await pool.query(weeklyQuery, [weekStart, weekEnd]);
          const weekly = weeklyResult.rows[0];
          
          timeSeriesData.push({
            date: `Week ${weekStr}`,
            revenue: parseFloat(weekly.revenue),
            orders: parseInt(weekly.orders)
          });
        }
      } else if (period === 'yearly') {
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - i);
          const yearStr = date.getFullYear().toString();
          
          const yearlyQuery = `
            SELECT 
              COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as revenue,
              COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress', 'confirmed')) as orders
            FROM orders 
            WHERE EXTRACT(YEAR FROM created_at) = $1
              AND status NOT IN ('cancelled')
          `;
          
          const yearlyResult = await pool.query(yearlyQuery, [date.getFullYear()]);
          const yearly = yearlyResult.rows[0];
          
          timeSeriesData.push({
            date: yearStr,
            revenue: parseFloat(yearly.revenue),
            orders: parseInt(yearly.orders)
          });
        }
      } else {
        // Default: Monthly (last 12 months)
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().substring(0, 7); // YYYY-MM format
          
          const monthlyQuery = `
            SELECT 
              COALESCE(SUM(CASE WHEN status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN total_amount ELSE 0 END), 0) as revenue,
              COUNT(*) FILTER (WHERE status IN ('completed', 'scheduled', 'in_progress', 'confirmed')) as orders
            FROM orders 
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $1::timestamp)
              AND status NOT IN ('cancelled')
          `;
          
          const monthlyResult = await pool.query(monthlyQuery, [date]);
          const monthly = monthlyResult.rows[0];
          
          timeSeriesData.push({
            date: monthStr,
            revenue: parseFloat(monthly.revenue),
            orders: parseInt(monthly.orders)
          });
        }
      }

      // Calculate period-based growth
      let periodGrowth = 0;
      if (timeSeriesData.length >= 2) {
        const latestPeriod = timeSeriesData[timeSeriesData.length - 1];
        const previousPeriod = timeSeriesData[timeSeriesData.length - 2];
        
        if (previousPeriod.revenue > 0) {
          periodGrowth = ((latestPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100;
        }
      }

      const analyticsData: AnalyticsOverview = {
        totalRevenue: parseFloat(totals.total_revenue),
        totalOrders: parseInt(totals.total_orders),
        avgOrderValue: Math.round(parseFloat(totals.avg_order_value)),
        monthlyGrowth: periodGrowth, // Now reflects actual period growth
        topCategories: topCategories,
        timeSeriesData: timeSeriesData
      };

      res.json({
        success: true,
        message: 'Analytics overview retrieved successfully from database',
        data: analyticsData
      });

    } catch (error) {
      console.error('❌ Analytics overview failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics overview'
      });
    }
  }

  /**
   * Export analytics data in CSV or Excel format
   */
  static async exportAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as string;
      const period = (req.query.period as TimePeriod) || 'monthly';


      if (!format || !['csv', 'excel'].includes(format)) {
        res.status(400).json({
          success: false,
          error: 'Invalid format. Use csv or excel.'
        });
        return;
      }

      // Export query consistent with other analytics calculations
      const exportQuery = `
        SELECT 
          c.name as category,
          COALESCE(sc.name, 'General') as subcategory,
          COALESCE(SUM(
            CASE 
              WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN 
                (oi.total_price / NULLIF(category_total.total_item_price, 0)) * o.total_amount
              ELSE 0 
            END
          ), 0) as revenue,
          COUNT(DISTINCT CASE WHEN o.status IN ('completed', 'scheduled', 'in_progress', 'confirmed') THEN o.id ELSE NULL END) as orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN services s ON oi.service_id = s.id
        JOIN service_categories c ON s.category_id = c.id
        LEFT JOIN service_subcategories sc ON s.subcategory_id = sc.id
        JOIN (
          SELECT order_id, SUM(total_price) as total_item_price
          FROM order_items 
          GROUP BY order_id
        ) category_total ON o.id = category_total.order_id
        WHERE o.status NOT IN ('cancelled')
        GROUP BY c.name, sc.name
        ORDER BY revenue DESC, c.name ASC, sc.name ASC
      `;

      const exportResult = await pool.query(exportQuery);
      
      // Generate CSV data from database results
      const csvRows = ['Category,Subcategory,Revenue (₹),Orders,Period,Export Date'];
      
      if (exportResult.rows.length === 0) {
        csvRows.push(`No Data,No Data,0,0,${period},${new Date().toISOString().split('T')[0]}`);
      } else {
        exportResult.rows.forEach(row => {
          csvRows.push([
            row.category || 'Unknown Category',
            row.subcategory || 'General', 
            Math.round(parseFloat(row.revenue)),
            row.orders,
            period.charAt(0).toUpperCase() + period.slice(1),
            new Date().toISOString().split('T')[0]
          ].join(','));
        });
      }

      const csvData = csvRows.join('\n');
      const filename = `happy-homes-analytics-${period}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);

    } catch (error) {
      console.error('❌ Analytics export failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data'
      });
    }
  }
}