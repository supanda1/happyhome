#!/usr/bin/env node

/**
 * Startup Data Validator - Ensures essential data exists
 * Runs automatically on backend startup
 */

const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'household_services',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

const ESSENTIAL_DATA = {
  engineers: [
    {
      employee_id: 'EPM001',
      name: 'Sunil Kumar',
      expertise: '["AC Cleaning","Appliance Repair","Basin & Sink","Bath Fittings","Bathroom Cleaning","CAB Booking","Car Wash","Courier Service","Electrical Safety Check","Fan Installation","GST Registration","Grouting","Health Checkup"]',
      phone: '9731739111',
      email: 'sunil1@gmail.com',
      address: 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24'
    },
    {
      employee_id: 'EMP002', 
      name: 'Debashis',
      expertise: '["Home Repairs","House Painting","ITR Filing","Lighting Solutions","Medicine Delivery","PAN Card Services","Photographer","Pipes","Salon at Home","Stamp Paper & Agreement","Septic Tank Cleaning","Switch & Socket","Tile Work","Toilets","Vehicle Breakdown","Water Purifier Cleaning","Water Tank","Water Tank Cleaning","Wiring Installation"]',
      phone: '9731739222',
      email: 'debasish@gmail.com', 
      address: 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24'
    }
  ]
};

async function validateAndRestoreData() {
  const pool = new Pool(config);
  
  try {
    console.log('🔍 [STARTUP] Validating essential data...');
    
    // Check engineers
    const { rows: engineers } = await pool.query(
      'SELECT employee_id FROM engineers WHERE employee_id IN ($1, $2)',
      ['EPM001', 'EMP002']
    );
    
    const missingEngineers = ESSENTIAL_DATA.engineers.filter(
      eng => !engineers.find(e => e.employee_id === eng.employee_id)
    );
    
    if (missingEngineers.length > 0) {
      console.log(`⚠️  [STARTUP] Missing ${missingEngineers.length} engineers. Restoring...`);
      
      for (const engineer of missingEngineers) {
        await pool.query(`
          INSERT INTO engineers (id, employee_id, name, expertise, phone, email, address, is_active, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())
          ON CONFLICT (employee_id) DO NOTHING
        `, [
          engineer.employee_id,
          engineer.name, 
          engineer.expertise,
          engineer.phone,
          engineer.email,
          engineer.address
        ]);
        
        console.log(`✅ [STARTUP] Restored engineer: ${engineer.name} (${engineer.employee_id})`);
      }
    }
    
    // Validate final state
    const { rows: finalCheck } = await pool.query('SELECT COUNT(*) as count FROM engineers');
    console.log(`✅ [STARTUP] Data validation completed. Engineers in database: ${finalCheck[0].count}`);
    
    return true;
  } catch (error) {
    console.error('❌ [STARTUP] Data validation failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Export for use in server startup
module.exports = { validateAndRestoreData };

// Run standalone if called directly
if (require.main === module) {
  validateAndRestoreData().then(success => {
    process.exit(success ? 0 : 1);
  });
}