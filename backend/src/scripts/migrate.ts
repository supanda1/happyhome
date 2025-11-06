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

    // Engineers table - updated to match new Engineer model
    await client.query(`
      CREATE TABLE IF NOT EXISTS engineers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        expertise_areas JSONB NOT NULL DEFAULT '[]',
        rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
        completed_jobs INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_available BOOLEAN NOT NULL DEFAULT true,
        location VARCHAR(200) NOT NULL,
        service_areas JSONB NOT NULL DEFAULT '[]',
        engineer_id VARCHAR(50) UNIQUE,
        department VARCHAR(100),
        position VARCHAR(100),
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        work_schedule JSONB NOT NULL DEFAULT '{}',
        skills JSONB NOT NULL DEFAULT '[]',
        certifications JSONB NOT NULL DEFAULT '[]',
        average_job_time DECIMAL(10,2),
        customer_satisfaction_score DECIMAL(3,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table - updated to match Order model
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id VARCHAR(255) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        service_address JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        final_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        priority VARCHAR(10) NOT NULL DEFAULT 'medium',
        notes TEXT,
        admin_notes TEXT,
        customer_rating INTEGER,
        customer_review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order items table - updated to match OrderItem model
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        service_id VARCHAR(100) NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        variant_id VARCHAR(100),
        variant_name VARCHAR(50),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        category_id VARCHAR(100) NOT NULL,
        subcategory_id VARCHAR(100) NOT NULL,
        assigned_engineer_id VARCHAR(100),
        assigned_engineer_name VARCHAR(100),
        item_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        scheduled_date VARCHAR(20),
        scheduled_time_slot VARCHAR(20),
        completion_date VARCHAR(20),
        item_notes TEXT,
        item_rating INTEGER,
        item_review TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

    // Cart items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        service_id UUID NOT NULL,
        variant_id UUID,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        customizations JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        service_id UUID NOT NULL,
        variant_id UUID,
        address_id UUID NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
        scheduled_time_start VARCHAR(10) NOT NULL,
        scheduled_time_end VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal_amount DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        total_amount DECIMAL(10,2) NOT NULL,
        coupon_id UUID,
        coupon_code VARCHAR(50),
        customer_notes TEXT,
        customizations JSONB NOT NULL DEFAULT '{}',
        admin_notes TEXT,
        assigned_technician_id UUID,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        cancelled_at TIMESTAMP WITH TIME ZONE,
        cancellation_reason TEXT,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        invoice_number VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    
    // Order indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');
    
    // Order items indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_assigned_engineer ON order_items(assigned_engineer_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_category ON order_items(category_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_subcategory ON order_items(subcategory_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_service ON order_items(service_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(item_status)');
    
    // Engineers indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_name ON engineers(name)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_email ON engineers(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_is_active ON engineers(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_is_available ON engineers(is_available)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_rating ON engineers(rating)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_expertise ON engineers USING GIN(expertise_areas)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_engineers_service_areas ON engineers USING GIN(service_areas)');
    
    // Cart items indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_service_id ON cart_items(service_id)');
    
    // Bookings indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_assigned_technician ON bookings(assigned_technician_id)');
    
    // User addresses indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(is_default)');

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