const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'household_services', 
  password: 'password',
  port: 5432,
});

async function checkDashboardData() {
  try {
    console.log('🔍 DASHBOARD DATA DIAGNOSTIC:');
    console.log('============================');
    
    // Check what tables exist
    const allTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const allTablesResult = await pool.query(allTablesQuery);
    console.log('📋 Existing tables in database:');
    allTablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if bookings table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'bookings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('\n❌ Bookings table does not exist!');
      console.log('💡 This explains why dashboard shows wrong data - no bookings table found.');
      
      // Check if there are other booking-related tables
      const bookingRelatedTables = allTablesResult.rows.filter(row => 
        row.table_name.includes('booking') || 
        row.table_name.includes('order') || 
        row.table_name.includes('cart')
      );
      
      if (bookingRelatedTables.length > 0) {
        console.log('\n📦 Found related tables:');
        bookingRelatedTables.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
        
        // Check orders table structure (since it's likely the replacement for bookings)
        const ordersTableCheck = allTablesResult.rows.find(row => row.table_name === 'orders');
        if (ordersTableCheck) {
          console.log('\n📋 Orders table structure:');
          const ordersStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            ORDER BY ordinal_position;
          `);
          
          ordersStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });
          
          // Check order statuses
          console.log('\n📊 ORDER STATUS ANALYSIS (using orders table):');
          console.log('='.repeat(40));
          
          const orderStatusQuery = `
            SELECT 
              status,
              COUNT(*) as count,
              ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM orders 
            GROUP BY status 
            ORDER BY count DESC;
          `;
          
          const orderStatusResult = await pool.query(orderStatusQuery);
          
          if (orderStatusResult.rows.length === 0) {
            console.log('❌ No orders found in database!');
            
            const totalOrders = await pool.query('SELECT COUNT(*) as total FROM orders');
            console.log(`   Total order records: ${totalOrders.rows[0].total}`);
            
          } else {
            console.log('Order Status Distribution:');
            orderStatusResult.rows.forEach(row => {
              console.log(`  ${row.status}: ${row.count} orders (${row.percentage}%)`);
            });
          }
          
          // Check recent orders
          const recentOrdersQuery = `
            SELECT 
              id,
              order_number,
              status,
              created_at,
              preferred_date,
              total_amount
            FROM orders 
            ORDER BY created_at DESC 
            LIMIT 5;
          `;
          
          const recentOrdersResult = await pool.query(recentOrdersQuery);
          console.log('\nRecent 5 Orders:');
          if (recentOrdersResult.rows.length === 0) {
            console.log('  No orders found');
          } else {
            recentOrdersResult.rows.forEach((row, index) => {
              console.log(`  ${index + 1}. #${row.order_number} | Status: ${row.status} | Amount: $${parseFloat(row.total_amount || 0).toFixed(2)}`);
            });
          }
          
          // Calculate dashboard metrics using orders
          console.log('\n🎯 DASHBOARD METRICS (using orders table):');
          console.log('='.repeat(40));
          
          const orderDashboardQuery = `
            SELECT 
              COUNT(*) as total_orders,
              COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
              COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
              SUM(COALESCE(total_amount, 0)) as total_revenue
            FROM orders;
          `;
          
          const orderDashboardResult = await pool.query(orderDashboardQuery);
          const orderMetrics = orderDashboardResult.rows[0];
          
          console.log(`Total Orders: ${orderMetrics.total_orders}`);
          console.log(`Pending: ${orderMetrics.pending_orders}`);
          console.log(`Completed: ${orderMetrics.completed_orders}`);
          console.log(`Cancelled: ${orderMetrics.cancelled_orders}`);
          console.log(`Total Revenue: $${parseFloat(orderMetrics.total_revenue || 0).toFixed(2)}`);
          
          console.log('\n💡 SOLUTION:');
          console.log('='.repeat(40));
          console.log('✅ Found the issue! Dashboard is looking for "bookings" table');
          console.log('   but data is in "orders" table.');
          console.log('📝 Need to update dashboard queries to use "orders" instead of "bookings"');
          
          if (orderMetrics.pending_orders > 0) {
            console.log(`⚠️  Found ${orderMetrics.pending_orders} pending orders`);
            console.log('   If these should be completed, update their status');
          }
        }
      }
      
      return;
    }
    
    console.log('✅ Bookings table exists');
    
    // Check booking statuses
    console.log('\n📊 BOOKING STATUS ANALYSIS:');
    console.log('='.repeat(40));
    
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM bookings 
      GROUP BY status 
      ORDER BY count DESC;
    `;
    
    const statusResult = await pool.query(statusQuery);
    
    if (statusResult.rows.length === 0) {
      console.log('❌ No bookings found in database!');
      console.log('💡 This explains the dashboard issue - there are no bookings to count.');
      
      // Check if there are any records at all
      const totalBookings = await pool.query('SELECT COUNT(*) as total FROM bookings');
      console.log(`   Total booking records: ${totalBookings.rows[0].total}`);
      
    } else {
      console.log('Booking Status Distribution:');
      statusResult.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count} bookings (${row.percentage}%)`);
      });
    }

    // Check payment statuses
    const paymentQuery = `
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(COALESCE(subtotal_amount, 0) + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0)) as total_amount
      FROM bookings 
      GROUP BY payment_status 
      ORDER BY count DESC;
    `;
    
    const paymentResult = await pool.query(paymentQuery);
    console.log('\nPayment Status & Revenue:');
    let totalRevenue = 0;
    paymentResult.rows.forEach(row => {
      const revenue = parseFloat(row.total_amount || 0);
      totalRevenue += revenue;
      console.log(`  ${row.payment_status}: ${row.count} bookings, $${revenue.toFixed(2)}`);
    });
    
    console.log(`  TOTAL REVENUE: $${totalRevenue.toFixed(2)}`);

    // Check recent bookings
    const recentQuery = `
      SELECT 
        id,
        status,
        payment_status,
        created_at,
        scheduled_date,
        COALESCE(subtotal_amount, 0) + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0) as final_amount
      FROM bookings 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    const recentResult = await pool.query(recentQuery);
    console.log('\nRecent 5 Bookings:');
    if (recentResult.rows.length === 0) {
      console.log('  No bookings found');
    } else {
      recentResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. Status: ${row.status} | Payment: ${row.payment_status} | Amount: $${parseFloat(row.final_amount).toFixed(2)}`);
      });
    }

    // Calculate dashboard metrics
    console.log('\n🎯 DASHBOARD METRICS CALCULATION:');
    console.log('='.repeat(40));
    
    const dashboardQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        SUM(CASE WHEN payment_status = 'paid' 
            THEN COALESCE(subtotal_amount, 0) + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0)
            ELSE 0 END) as total_revenue
      FROM bookings;
    `;
    
    const dashboardResult = await pool.query(dashboardQuery);
    const metrics = dashboardResult.rows[0];
    
    console.log(`Total Bookings: ${metrics.total_bookings}`);
    console.log(`Pending: ${metrics.pending_bookings}`);
    console.log(`Completed: ${metrics.completed_bookings}`);
    console.log(`Cancelled: ${metrics.cancelled_bookings}`);
    console.log(`Total Revenue: $${parseFloat(metrics.total_revenue || 0).toFixed(2)}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('='.repeat(40));
    
    if (metrics.total_bookings == 0) {
      console.log('❌ No bookings in database - dashboard will show zeros');
      console.log('   → Create test bookings or check data migration');
    } else if (metrics.pending_bookings > 0 && metrics.pending_bookings == metrics.total_bookings) {
      console.log(`⚠️  All ${metrics.total_bookings} bookings are pending`);
      console.log('   → Update booking statuses to completed if services are done');
      console.log('   → SQL: UPDATE bookings SET status = \'completed\' WHERE status = \'pending\';');
    } else if (metrics.pending_bookings == 0 && metrics.completed_bookings > 0) {
      console.log('✅ All bookings are completed - dashboard should show 0 pending');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection failed:');
      console.error('   - Make sure PostgreSQL is running');
      console.error('   - Check connection details (host, port, credentials)');
    }
  } finally {
    await pool.end();
  }
}

checkDashboardData();