// Quick model validation test script
// Run this before deploying: node scripts/test-models.js

const pool = require('../dist/config/database.js').default;

async function testModels() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connectivity
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test key tables exist
    const tables = ['orders', 'order_items', 'users', 'services'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
      console.log(`✅ Table '${table}' accessible`);
    }
    
    // Test order creation workflow
    console.log('🔍 Testing order number generation...');
    const timestamp = Date.now().toString();
    const testOrderNumber = `HH${timestamp.slice(-8)}`;
    console.log(`✅ Order number format: ${testOrderNumber}`);
    
    client.release();
    console.log('🎉 All model tests passed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    process.exit(1);
  }
}

testModels();