import pool from '../config/database';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Subcategories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id VARCHAR(50) PRIMARY KEY,
        category_id VARCHAR(50) REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(10),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        expert VARCHAR(100),
        manager VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id VARCHAR(50),
        customer_name VARCHAR(100),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(100),
        service_address JSONB,
        total_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        gst_amount DECIMAL(10,2) DEFAULT 0,
        service_charge DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(10) DEFAULT 'medium',
        notes TEXT,
        admin_notes TEXT,
        customer_rating INTEGER,
        customer_review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(50) PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        service_id VARCHAR(50),
        service_name VARCHAR(200),
        variant_id VARCHAR(50),
        variant_name VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2),
        total_price DECIMAL(10,2),
        category_id VARCHAR(50),
        subcategory_id VARCHAR(50),
        assigned_engineer_id VARCHAR(50) REFERENCES employees(id),
        assigned_engineer_name VARCHAR(100),
        item_status VARCHAR(20) DEFAULT 'pending',
        scheduled_date DATE,
        scheduled_time_slot VARCHAR(50),
        completion_date TIMESTAMP,
        item_notes TEXT,
        item_rating INTEGER,
        item_review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category_id VARCHAR(50) REFERENCES categories(id),
        subcategory_id VARCHAR(50) REFERENCES subcategories(id),
        description TEXT,
        short_description VARCHAR(500),
        base_price DECIMAL(10,2),
        discounted_price DECIMAL(10,2),
        duration INTEGER,
        inclusions TEXT[],
        exclusions TEXT[],
        requirements TEXT[],
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        booking_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        is_combo_eligible BOOLEAN DEFAULT true,
        tags VARCHAR(50)[],
        gst_percentage INTEGER DEFAULT 18,
        service_charge DECIMAL(10,2) DEFAULT 79,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Service variants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_variants (
        id VARCHAR(50) PRIMARY KEY,
        service_id VARCHAR(50) REFERENCES services(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_price DECIMAL(10,2),
        discounted_price DECIMAL(10,2),
        duration INTEGER,
        inclusions TEXT[],
        exclusions TEXT[],
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(200),
        description TEXT,
        discount_type VARCHAR(20) NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_order_amount DECIMAL(10,2) DEFAULT 0,
        maximum_discount_amount DECIMAL(10,2),
        valid_from TIMESTAMP NOT NULL,
        valid_until TIMESTAMP NOT NULL,
        usage_limit INTEGER,
        usage_count INTEGER DEFAULT 0,
        usage_limit_per_user INTEGER,
        is_active BOOLEAN DEFAULT true,
        applicable_categories VARCHAR(50)[],
        applicable_services VARCHAR(50)[],
        first_time_users_only BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        address_type VARCHAR(20),
        full_name VARCHAR(100),
        mobile_number VARCHAR(20),
        pincode VARCHAR(10),
        house_number VARCHAR(100),
        area VARCHAR(200),
        landmark VARCHAR(200),
        city VARCHAR(100),
        state VARCHAR(100),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_assigned_engineer ON order_items(assigned_engineer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_category ON order_items(category_id)');

    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Database migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default createTables;