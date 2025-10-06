import pool from '../config/database';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seeding...');
    
    // Seed Categories
    const categories = [
      { id: 'cat-1', name: 'Plumbing', icon: '🔧', description: 'Professional plumbing services for your home', sort_order: 1 },
      { id: 'cat-2', name: 'Electrical', icon: '⚡', description: 'Safe and reliable electrical services', sort_order: 2 },
      { id: 'cat-3', name: 'Cleaning', icon: '🧹', description: 'Professional cleaning services for your home', sort_order: 3 },
      { id: 'cat-4', name: 'Call A Service', icon: '📞', description: 'On-demand service calls and support', sort_order: 4 },
      { id: 'cat-5', name: 'Finance & Insurance', icon: '💰', description: 'Financial and insurance related services', sort_order: 5 },
      { id: 'cat-6', name: 'Personal Care', icon: '💄', description: 'Personal care and wellness services', sort_order: 6 },
      { id: 'cat-7', name: 'Civil Work', icon: '🏗️', description: 'Construction and renovation services', sort_order: 7 }
    ];
    
    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (id, name, icon, description, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `, [category.id, category.name, category.icon, category.description, category.sort_order]);
    }
    
    console.log('✅ Categories seeded');
    
    // Seed Subcategories
    const subcategories = [
      // Plumbing subcategories
      { id: 'sub-1', category_id: 'cat-1', name: 'Bath Fittings', icon: '🚿', description: 'Installation and repair of bathroom fittings', sort_order: 1 },
      { id: 'sub-2', category_id: 'cat-1', name: 'Basin, Sink & Drainage', icon: '🚰', description: 'Basin, sink installation and drainage solutions', sort_order: 2 },
      { id: 'sub-3', category_id: 'cat-1', name: 'Grouting', icon: '🔧', description: 'Professional grouting and sealing services', sort_order: 3 },
      { id: 'sub-4', category_id: 'cat-1', name: 'Toilets', icon: '🚽', description: 'Toilet installation and repair services', sort_order: 4 },
      { id: 'sub-5', category_id: 'cat-1', name: 'Pipe & Connector', icon: '🔗', description: 'Pipe installation and connector services', sort_order: 5 },
      { id: 'sub-6', category_id: 'cat-1', name: 'Water Tank', icon: '💧', description: 'Water tank installation and maintenance', sort_order: 6 },
      { id: 'sub-7', category_id: 'cat-1', name: 'Others', icon: '⚙️', description: 'Other plumbing services', sort_order: 7 },
      
      // Electrical subcategories
      { id: 'sub-8', category_id: 'cat-2', name: 'Wiring & Installation', icon: '🔌', description: 'Electrical wiring and installation services', sort_order: 1 },
      { id: 'sub-9', category_id: 'cat-2', name: 'Appliance Repair', icon: '🔧', description: 'Home appliance repair services', sort_order: 2 },
      { id: 'sub-10', category_id: 'cat-2', name: 'Switch & Socket', icon: '🔘', description: 'Switch and socket installation', sort_order: 3 },
      { id: 'sub-11', category_id: 'cat-2', name: 'Fan Installation', icon: '🌀', description: 'Ceiling and wall fan installation', sort_order: 4 },
      { id: 'sub-12', category_id: 'cat-2', name: 'Lighting Solutions', icon: '💡', description: 'Professional lighting installation', sort_order: 5 },
      { id: 'sub-13', category_id: 'cat-2', name: 'Electrical Safety Check', icon: '⚡', description: 'Electrical safety inspection services', sort_order: 6 },
      { id: 'sub-14', category_id: 'cat-2', name: 'Others', icon: '⚙️', description: 'Other electrical services', sort_order: 7 },
      
      // Cleaning subcategories  
      { id: 'sub-15', category_id: 'cat-3', name: 'Bathroom Cleaning', icon: '🚿', description: 'Deep bathroom cleaning services', sort_order: 1 },
      { id: 'sub-16', category_id: 'cat-3', name: 'AC Cleaning', icon: '❄️', description: 'Air conditioner cleaning and maintenance', sort_order: 2 },
      { id: 'sub-17', category_id: 'cat-3', name: 'Water Tank Cleaning', icon: '💧', description: 'Water tank cleaning and sanitization', sort_order: 3 },
      { id: 'sub-18', category_id: 'cat-3', name: 'Septic Tank Cleaning', icon: '🚽', description: 'Septic tank cleaning services', sort_order: 4 },
      { id: 'sub-19', category_id: 'cat-3', name: 'Water Purifier Cleaning', icon: '💧', description: 'Water purifier cleaning and maintenance', sort_order: 5 },
      { id: 'sub-20', category_id: 'cat-3', name: 'Car Wash', icon: '🚗', description: 'Professional car washing services', sort_order: 6 },
      { id: 'sub-21', category_id: 'cat-3', name: 'Others', icon: '⚙️', description: 'Other cleaning services', sort_order: 7 }
      // Add more subcategories as needed...
    ];
    
    for (const subcategory of subcategories) {
      await client.query(`
        INSERT INTO subcategories (id, category_id, name, icon, description, is_active, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `, [subcategory.id, subcategory.category_id, subcategory.name, subcategory.icon, subcategory.description, subcategory.sort_order]);
    }
    
    console.log('✅ Subcategories seeded');
    
    // Seed Employees
    const employees = [
      { id: 'emp-1', employee_id: 'EMP001', name: 'Rajesh Kumar', expert: 'Plumbing', manager: 'Suresh Patel', phone: '9876543210', email: 'rajesh.kumar@happyhomes.com' },
      { id: 'emp-2', employee_id: 'EMP002', name: 'Amit Singh', expert: 'Electrical', manager: 'Suresh Patel', phone: '9876543211', email: 'amit.singh@happyhomes.com' },
      { id: 'emp-3', employee_id: 'EMP003', name: 'Priya Sharma', expert: 'Cleaning', manager: 'Kavita Mehta', phone: '9876543212', email: 'priya.sharma@happyhomes.com' },
      { id: 'emp-4', employee_id: 'EMP004', name: 'Deepak Gupta', expert: 'Civil Work', manager: 'Suresh Patel', phone: '9876543213', email: 'deepak.gupta@happyhomes.com' },
      { id: 'emp-5', employee_id: 'EMP005', name: 'Kavita Mehta', expert: 'Management', manager: 'CEO', phone: '9876543214', email: 'kavita.mehta@happyhomes.com' },
      { id: 'emp-6', employee_id: 'EMP006', name: 'Ravi Patel', expert: 'Plumbing', manager: 'Suresh Patel', phone: '9876543215', email: 'ravi.patel@happyhomes.com' },
      { id: 'emp-7', employee_id: 'EMP007', name: 'Sanjay Electricals', expert: 'Electrical', manager: 'Suresh Patel', phone: '9876543216', email: 'sanjay.electricals@happyhomes.com' },
      { id: 'emp-8', employee_id: 'EMP008', name: 'Maya Cleaning', expert: 'Cleaning', manager: 'Kavita Mehta', phone: '9876543217', email: 'maya.cleaning@happyhomes.com' },
      { id: 'emp-9', employee_id: 'EMP009', name: 'Raman Transport', expert: 'Call A Service', manager: 'Kavita Mehta', phone: '9876543218', email: 'raman.transport@happyhomes.com' },
      { id: 'emp-10', employee_id: 'EMP010', name: 'Sunil Finance', expert: 'Finance & Insurance', manager: 'Kavita Mehta', phone: '9876543219', email: 'sunil.finance@happyhomes.com' },
      { id: 'emp-11', employee_id: 'EMP011', name: 'Dr. Anita Care', expert: 'Personal Care', manager: 'Kavita Mehta', phone: '9876543220', email: 'anita.care@happyhomes.com' },
      { id: 'emp-12', employee_id: 'EMP012', name: 'Vinod Construction', expert: 'Civil Work', manager: 'Suresh Patel', phone: '9876543221', email: 'vinod.construction@happyhomes.com' }
    ];
    
    for (const employee of employees) {
      await client.query(`
        INSERT INTO employees (id, employee_id, name, expert, manager, phone, email, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (employee_id) DO NOTHING
      `, [employee.id, employee.employee_id, employee.name, employee.expert, employee.manager, employee.phone, employee.email]);
    }
    
    console.log('✅ Employees seeded');
    
    // Seed Services with Image Paths
    const servicesWithImages = [
      { 
        id: 'serv-1', 
        subcategory_id: 'sub-1', 
        name: 'Bath Fittings Installation & Repair',
        description: 'Professional installation and repair of bathroom fittings including taps, shower heads, towel holders, soap dispensers, and other bathroom accessories.',
        short_description: 'Professional bathroom fittings installation and repair service',
        base_price: 149,
        discounted_price: 99,
        duration: 120,
        inclusions: JSON.stringify(['Professional technician visit', 'Basic tools and equipment', 'Installation service', 'Quality check and testing', 'Service warranty']),
        exclusions: JSON.stringify(['Cost of fittings/accessories', 'Drilling charges in tiles', 'Major plumbing modifications']),
        requirements: JSON.stringify(['Access to bathroom', 'Power supply', 'Water connection']),
        tags: JSON.stringify(['plumbing', 'bathroom', 'fittings', 'installation', 'repair']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg',
          '/images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg',
          '/images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg',
          '/images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg',
          '/images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-2', 
        subcategory_id: 'sub-2', 
        name: 'Basin, Sink & Drainage Services',
        description: 'Professional basin and sink installation, repair, and drainage cleaning services. Includes pipe fitting, leak fixing, and blockage removal.',
        short_description: 'Complete basin, sink and drainage solutions',
        base_price: 199,
        discounted_price: 149,
        duration: 150,
        inclusions: JSON.stringify(['Professional plumber visit', 'Basic plumbing tools', 'Installation/repair service', 'Quality testing']),
        exclusions: JSON.stringify(['Cost of basin/sink', 'Major pipe replacement', 'Chemical cleaning materials']),
        requirements: JSON.stringify(['Access to plumbing area', 'Water connection', 'Drainage access']),
        tags: JSON.stringify(['plumbing', 'basin', 'sink', 'drainage', 'repair']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/basin-sink-drainage-1.jpg',
          '/images/subcategories/plumbing/basin-sink-drainage-2.jpg',
          '/images/subcategories/plumbing/basin-sink-drainage-3.jpg',
          '/images/subcategories/plumbing/basin-sink-drainage-4.jpg',
          '/images/subcategories/plumbing/basin-sink-drainage-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-3', 
        subcategory_id: 'sub-3', 
        name: 'Tile Grouting & Sealing Services',
        description: 'Professional tile grouting, re-grouting, and sealing services for bathrooms, kitchens, and other tiled areas. Prevents water damage and improves aesthetics.',
        short_description: 'Professional tile grouting and sealing service',
        base_price: 129,
        discounted_price: 99,
        duration: 180,
        inclusions: JSON.stringify(['Professional grouting expert', 'Standard grout materials', 'Application service', 'Quality check']),
        exclusions: JSON.stringify(['Premium grout materials', 'Area preparation', 'Extended drying time']),
        requirements: JSON.stringify(['Access to tiled areas', 'Ventilation', 'Drying time availability']),
        tags: JSON.stringify(['plumbing', 'grouting', 'tiles', 'sealing', 'waterproofing']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/grouting/grouting-1.jpg',
          '/images/subcategories/plumbing/grouting/grouting-2.jpg',
          '/images/subcategories/plumbing/grouting/grouting-3.jpg',
          '/images/subcategories/plumbing/grouting/grouting-4.jpg',
          '/images/subcategories/plumbing/grouting/grouting-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-4', 
        subcategory_id: 'sub-4', 
        name: 'Toilet Services (Classic)',
        description: 'Professional toilet installation, repair, and maintenance services. Includes toilet seat replacement, flush mechanism repair, and complete toilet installation.',
        short_description: 'Complete toilet installation and repair service',
        base_price: 199,
        discounted_price: 149,
        duration: 120,
        inclusions: JSON.stringify(['Professional plumber visit', 'Installation tools', 'Quality testing', 'Service warranty']),
        exclusions: JSON.stringify(['Cost of toilet/parts', 'Complex plumbing modifications', 'Disposal of old toilet']),
        requirements: JSON.stringify(['Access to toilet area', 'Water connection', 'Drainage system']),
        tags: JSON.stringify(['plumbing', 'toilet', 'installation', 'repair', 'flush']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg',
          '/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg',
          '/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg',
          '/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg',
          '/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-5', 
        subcategory_id: 'sub-5', 
        name: 'Pipe & Connector Installation Services',
        description: 'Professional pipe installation, connector fitting, and plumbing system repairs. Includes PVC, copper, and flexible pipe installations with proper sealing.',
        short_description: 'Professional pipe and connector installation',
        base_price: 179,
        discounted_price: 129,
        duration: 150,
        inclusions: JSON.stringify(['Skilled plumber visit', 'Basic pipe fittings', 'Installation service', 'Quality testing']),
        exclusions: JSON.stringify(['Cost of pipes/connectors', 'Complex plumbing modifications', 'Extensive pipe networks']),
        requirements: JSON.stringify(['Access to plumbing area', 'Pipe specifications', 'Connection points']),
        tags: JSON.stringify(['plumbing', 'pipes', 'connectors', 'installation', 'repair']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/pipe-connector/pipe-connector-1.jpg',
          '/images/subcategories/plumbing/pipe-connector/pipe-connector-2.jpg',
          '/images/subcategories/plumbing/pipe-connector/pipe-connector-3.jpg',
          '/images/subcategories/plumbing/pipe-connector/pipe-connector-4.jpg',
          '/images/subcategories/plumbing/pipe-connector/pipe-connector-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-6', 
        subcategory_id: 'sub-6', 
        name: 'Water Tank Installation & Repair Services',
        description: 'Professional water tank installation, repair, and maintenance services. Includes overhead tanks, underground tanks, and complete plumbing connections.',
        short_description: 'Professional water tank installation and repair',
        base_price: 299,
        discounted_price: 229,
        duration: 240,
        inclusions: JSON.stringify(['Professional plumber visit', 'Installation tools', 'Basic connections', 'Quality testing']),
        exclusions: JSON.stringify(['Cost of tank', 'Complex electrical work', 'Structural modifications']),
        requirements: JSON.stringify(['Tank specifications', 'Installation site', 'Water connections']),
        tags: JSON.stringify(['plumbing', 'water tank', 'installation', 'repair', 'maintenance']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/water-tank/water-tank-1.jpg',
          '/images/subcategories/plumbing/water-tank/water-tank-2.jpg',
          '/images/subcategories/plumbing/water-tank/water-tank-3.jpg',
          '/images/subcategories/plumbing/water-tank/water-tank-4.jpg',
          '/images/subcategories/plumbing/water-tank/water-tank-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      },
      { 
        id: 'serv-7', 
        subcategory_id: 'sub-7', 
        name: 'Other Plumbing Services',
        description: 'General plumbing services including minor repairs, maintenance, and custom plumbing solutions for residential and commercial needs.',
        short_description: 'General plumbing services and repairs',
        base_price: 149,
        discounted_price: 99,
        duration: 90,
        inclusions: JSON.stringify(['Professional plumber visit', 'Basic tools', 'Minor repair service', 'Quality check']),
        exclusions: JSON.stringify(['Major installations', 'Specialized equipment', 'Premium materials']),
        requirements: JSON.stringify(['Access to problem area', 'Service description', 'Basic utilities']),
        tags: JSON.stringify(['plumbing', 'repair', 'maintenance', 'general', 'service']),
        image_paths: JSON.stringify([
          '/images/subcategories/plumbing/others/others-1.jpg',
          '/images/subcategories/plumbing/others/others-2.jpg',
          '/images/subcategories/plumbing/others/others-3.jpg',
          '/images/subcategories/plumbing/others/others-4.jpg',
          '/images/subcategories/plumbing/others/others-5.jpg'
        ]),
        rating: 4.5,
        review_count: 0,
        booking_count: 0
      }
    ];
    
    for (const service of servicesWithImages) {
      await client.query(`
        INSERT INTO services (
          id, subcategory_id, name, description, short_description, base_price, 
          discounted_price, duration, inclusions, exclusions, requirements, tags,
          image_paths, rating, review_count, booking_count, is_active, is_featured,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          image_paths = EXCLUDED.image_paths,
          updated_at = CURRENT_TIMESTAMP
      `, [
        service.id, service.subcategory_id, service.name, service.description,
        service.short_description, service.base_price, service.discounted_price,
        service.duration, service.inclusions, service.exclusions, service.requirements,
        service.tags, service.image_paths, service.rating, service.review_count, service.booking_count
      ]);
    }
    
    console.log('✅ Services with images seeded');
    
    await client.query('COMMIT');
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;