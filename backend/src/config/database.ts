import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'household_services',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  // SSL configuration - can be controlled via DB_SSL environment variable
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Per-worker pool size. With PM2 cluster mode, total connections = max * num_workers.
  // Default 25 per worker = 50 total on a 2-core VPS.
  max: parseInt(process.env.DB_POOL_MAX || '25'),
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '5000'),
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;