const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'household_services', 
  password: 'password',
  port: 5432,
});

async function checkDatabase() {
  try {
    console.log('🔍 CHECKING DATABASE CONTENTS:');
    console.log('============================');
    
    // Total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM services');
    console.log('📊 Total services in database:', countResult.rows[0].total);
    
    // Recent services with detailed info
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.description,
        LENGTH(s.description) as desc_length,
        s.created_at,
        sc.name as category_name,
        ss.name as subcategory_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id  
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      ORDER BY s.created_at DESC 
      LIMIT 8
    `;
    
    const result = await pool.query(query);
    
    console.log('\n🔍 Latest 8 Services (newest first):');
    console.log('===================================');
    
    result.rows.forEach((service, index) => {
      const isToday = new Date(service.created_at).toDateString() === new Date().toDateString();
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   ID: ${service.id.substring(0, 8)}...`);
      console.log(`   Category: ${service.category_name || 'NO CATEGORY'}`);
      console.log(`   Subcategory: ${service.subcategory_name || 'NO SUBCATEGORY'}`);
      console.log(`   Description: ${service.desc_length ? `${service.desc_length} chars` : 'EMPTY/NULL'}`);
      console.log(`   Created: ${service.created_at.toISOString().split('T')[0]} ${isToday ? '(TODAY)' : ''}`);
      console.log('');
    });
    
    // Check seeded vs new services
    const seedCheck = await pool.query(`
      SELECT 
        COUNT(*) as count,
        CASE 
          WHEN created_at::date = CURRENT_DATE THEN 'TODAY' 
          ELSE 'SEEDED' 
        END as type
      FROM services 
      GROUP BY CASE WHEN created_at::date = CURRENT_DATE THEN 'TODAY' ELSE 'SEEDED' END
    `);
    
    console.log('📈 SERVICE BREAKDOWN:');
    console.log('===================');
    seedCheck.rows.forEach(row => {
      console.log(`${row.type}: ${row.count} services`);
    });
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();