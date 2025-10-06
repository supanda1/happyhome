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
      // Note: period parameter available for future date filtering
      // const period = (req.query.period as TimePeriod) || 'monthly';
      

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
      
      // Get basic totals from orders table
      const totalsQuery = `
        SELECT 
          COALESCE(SUM(final_amount), 0) as total_revenue,
          COUNT(*) as total_orders,
          COALESCE(AVG(final_amount), 0) as avg_order_value
        FROM orders 
        WHERE status NOT IN ('cancelled', 'refunded')
      `;
      
      const totalsResult = await pool.query(totalsQuery);
      const totals = totalsResult.rows[0];

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
        // Get revenue for this specific category (simple query)
        const categoryRevenueQuery = `
          SELECT 
            COALESCE(SUM(oi.total_price), 0) as revenue,
            COUNT(oi.id) as orders
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.category_id = $1
            AND o.status NOT IN ('cancelled', 'refunded')
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
            // Get revenue for this subcategory
            const subRevenueQuery = `
              SELECT 
                COALESCE(SUM(oi.total_price), 0) as revenue,
                COUNT(oi.id) as orders
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE oi.subcategory_id = $1
                AND o.status NOT IN ('cancelled', 'refunded')
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
                WHERE oi.subcategory_id = $1
                  AND o.status NOT IN ('cancelled', 'refunded')
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
            WHERE oi.category_id = $1
              AND o.status NOT IN ('cancelled', 'refunded')
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

      // Simple time series data (monthly buckets for last 5 months)
      const timeSeriesData: TimeSeriesPoint[] = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().substring(0, 7); // YYYY-MM format
        
        const monthlyQuery = `
          SELECT 
            COALESCE(SUM(final_amount), 0) as revenue,
            COUNT(*) as orders
          FROM orders 
          WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $1::timestamp)
            AND status NOT IN ('cancelled', 'refunded')
        `;
        
        const monthlyResult = await pool.query(monthlyQuery, [date]);
        const monthly = monthlyResult.rows[0];
        
        timeSeriesData.push({
          date: monthStr,
          revenue: parseFloat(monthly.revenue),
          orders: parseInt(monthly.orders)
        });
      }

      const analyticsData: AnalyticsOverview = {
        totalRevenue: parseFloat(totals.total_revenue),
        totalOrders: parseInt(totals.total_orders),
        avgOrderValue: Math.round(parseFloat(totals.avg_order_value)),
        monthlyGrowth: timeSeriesData.length >= 2 && timeSeriesData[timeSeriesData.length-2].revenue > 0 
          ? ((timeSeriesData[timeSeriesData.length-1].revenue - timeSeriesData[timeSeriesData.length-2].revenue) / timeSeriesData[timeSeriesData.length-2].revenue) * 100
          : 0,
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

      // Simple export query without complex date filtering
      const exportQuery = `
        SELECT 
          c.name as category,
          COALESCE(sc.name, 'General') as subcategory,
          COALESCE(SUM(oi.total_price), 0) as revenue,
          COUNT(oi.id) as orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN service_categories c ON oi.category_id = c.id
        LEFT JOIN service_subcategories sc ON oi.subcategory_id = sc.id
        WHERE o.status NOT IN ('cancelled', 'refunded')
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