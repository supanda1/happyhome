import pool from '../config/database';
import seedDetailedServices from './seedServicesDetailed';

const runMigrationAndSeed = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting migration and seed process...');
    
    // Check if database is ready
    await client.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'services', 'service_categories')
    `);
    
    console.log(`📊 Found ${tablesResult.rows.length} core tables`);
    
    if (tablesResult.rows.length >= 3) {
      console.log('🌱 Tables exist, running detailed services seeding...');
      
      // Run detailed services seeding
      await seedDetailedServices();
      
      console.log('✅ Migration and seed process completed successfully!');
    } else {
      console.log('⚠️  Core tables not found. Please ensure migrations have run first.');
    }
    
  } catch (error) {
    console.error('❌ Error during migration and seed process:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  runMigrationAndSeed()
    .then(() => {
      console.log('🎉 Process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}

export default runMigrationAndSeed;