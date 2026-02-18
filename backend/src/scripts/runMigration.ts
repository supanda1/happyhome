import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../config/database';

const runMigration = async (migrationFile: string) => {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const migrationPath = join(__dirname, '../../migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log(`📄 Migration content:\n${migrationSQL}`);
    
    await pool.query(migrationSQL);
    
    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error);
    throw error;
  }
};

// Run the specific migration
const migrationToRun = process.argv[2] || '014_add_coupon_code_to_orders.sql';

runMigration(migrationToRun)
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });