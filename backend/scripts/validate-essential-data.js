#!/usr/bin/env node

/**
 * Validate and ensure essential data exists in database
 * Run this on backend startup or container restart
 */

const { execSync } = require('child_process');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'household_services';

function runSQLFile() {
  try {
    console.log('🔍 Validating essential data...');
    
    const command = `psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -f /app/scripts/ensure-seed-data.sql`;
    const result = execSync(command, { encoding: 'utf8' });
    
    console.log('✅ Essential data validation completed');
    console.log(result);
    
    return true;
  } catch (error) {
    console.error('❌ Data validation failed:', error.message);
    return false;
  }
}

// Run validation
runSQLFile();