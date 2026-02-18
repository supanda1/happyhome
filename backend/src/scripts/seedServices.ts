import pool from '../config/database';

const seedServices = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting services seeding...');
    
    // Get subcategory IDs from database
    const subcategoriesResult = await client.query(`
      SELECT ss.id, ss.name, ss.category_id, sc.name as category_name 
      FROM service_subcategories ss
      JOIN service_categories sc ON ss.category_id = sc.id
      ORDER BY sc.sort_order, ss.sort_order
    `);
    
    const subcategories = subcategoriesResult.rows;
    console.log(`Found ${subcategories.length} subcategories`);
    
    // Define services for each subcategory
    const services = [
      // Plumbing - Bath Fittings
      { 
        subcategory_name: 'Bath Fittings',
        services: [
          {
            name: 'Shower Head Installation & Repair',
            short_description: 'Professional shower head installation and repair service',
            description: 'Expert installation and repair of all types of shower heads including rain shower, handheld, and fixed shower heads with proper sealing and testing.',
            base_price: 199, discounted_price: 149, duration: 90,
            inclusions: [
              'Professional plumber visit',
              'Shower head installation/repair',
              'Water pressure testing',
              'Leak detection and fixing',
              '30-day service warranty'
            ],
            exclusions: [
              'Cost of shower head',
              'Drilling charges in tiles',
              'Major plumbing modifications',
              'Water connection charges'
            ],
            requirements: [
              'Access to bathroom',
              'Water supply available',
              'Existing plumbing connection'
            ]
          },
          {
            name: 'Tap & Faucet Services',
            short_description: 'Complete tap and faucet installation and repair',
            description: 'Professional installation, repair, and replacement of kitchen and bathroom taps, faucets, and mixers with warranty.',
            base_price: 179, discounted_price: 129, duration: 60
          }
        ]
      },
      
      // Plumbing - Basin & Drainage
      { 
        subcategory_name: 'Basin & Drainage',
        services: [
          {
            name: 'Basin Installation Services',
            short_description: 'Professional basin installation and setup',
            description: 'Complete basin installation including plumbing connections, drainage setup, and sealing work for kitchen and bathroom basins.',
            base_price: 299, discounted_price: 229, duration: 120
          },
          {
            name: 'Drain Cleaning & Unclogging',
            short_description: 'Professional drain cleaning and blockage removal',
            description: 'Expert drain cleaning services for kitchen, bathroom, and floor drains using professional tools and eco-friendly solutions.',
            base_price: 249, discounted_price: 179, duration: 90
          }
        ]
      },
      
      // Plumbing - Toilet Installation
      { 
        subcategory_name: 'Toilet Installation',
        services: [
          {
            name: 'Complete Toilet Installation',
            short_description: 'Full toilet installation with plumbing connections',
            description: 'Professional toilet installation including removal of old toilet, plumbing connections, sealing, and testing with warranty.',
            base_price: 399, discounted_price: 299, duration: 150
          },
          {
            name: 'Toilet Repair & Maintenance',
            short_description: 'Comprehensive toilet repair services',
            description: 'Expert toilet repair including flush mechanism, seat replacement, leak fixing, and general maintenance work.',
            base_price: 199, discounted_price: 149, duration: 75
          }
        ]
      },
      
      // Plumbing - Pipe & Connector
      { 
        subcategory_name: 'Pipe & Connector',
        services: [
          {
            name: 'Pipe Installation & Repair',
            short_description: 'Professional pipe installation and repair service',
            description: 'Expert installation and repair of water supply and drainage pipes including PVC, copper, and flexible pipes with proper fittings.',
            base_price: 279, discounted_price: 199, duration: 120
          },
          {
            name: 'Pipe Leak Detection & Fixing',
            short_description: 'Advanced leak detection and repair',
            description: 'Professional leak detection using modern tools and expert repair services for hidden and visible pipe leaks.',
            base_price: 349, discounted_price: 249, duration: 90
          }
        ]
      },
      
      // Plumbing - Water Tank Services
      { 
        subcategory_name: 'Water Tank Services',
        services: [
          {
            name: 'Water Tank Installation',
            short_description: 'Complete water tank installation service',
            description: 'Professional installation of overhead and underground water tanks with proper plumbing connections and supports.',
            base_price: 599, discounted_price: 449, duration: 240
          },
          {
            name: 'Water Tank Cleaning & Maintenance',
            short_description: 'Thorough water tank cleaning service',
            description: 'Complete water tank cleaning, sanitization, and maintenance including inspection of tank condition and connections.',
            base_price: 299, discounted_price: 229, duration: 180
          }
        ]
      },
      
      // Electrical - Appliance Repair
      { 
        subcategory_name: 'Appliance Repair',
        services: [
          {
            name: 'AC Repair & Servicing',
            short_description: 'Professional AC repair and maintenance',
            description: 'Expert air conditioner repair, servicing, gas filling, and maintenance for all brands of split and window ACs.',
            base_price: 399, discounted_price: 299, duration: 120
          },
          {
            name: 'Refrigerator Repair',
            short_description: 'Complete refrigerator repair service',
            description: 'Professional refrigerator repair including cooling issues, compressor problems, and electrical faults for all brands.',
            base_price: 349, discounted_price: 269, duration: 90
          }
        ]
      },
      
      // Electrical - Switch & Socket
      { 
        subcategory_name: 'Switch & Socket',
        services: [
          {
            name: 'Switch & Socket Installation',
            short_description: 'Professional electrical switch and socket setup',
            description: 'Expert installation of electrical switches, sockets, and power outlets with proper wiring and safety measures.',
            base_price: 149, discounted_price: 99, duration: 45
          },
          {
            name: 'Electrical Point Addition',
            short_description: 'Adding new electrical points and connections',
            description: 'Professional addition of new electrical points, switches, and sockets with proper wiring from main distribution board.',
            base_price: 299, discounted_price: 229, duration: 90
          }
        ]
      },
      
      // Electrical - Lighting Solution
      { 
        subcategory_name: 'Lighting Solution',
        services: [
          {
            name: 'LED Light Installation',
            short_description: 'Modern LED lighting setup and installation',
            description: 'Professional installation of LED lights, tube lights, panel lights, and smart lighting solutions with proper wiring.',
            base_price: 199, discounted_price: 149, duration: 60
          },
          {
            name: 'Chandelier & Decorative Lighting',
            short_description: 'Elegant chandelier and decorative light setup',
            description: 'Expert installation of chandeliers, pendant lights, and decorative lighting fixtures with proper support and wiring.',
            base_price: 399, discounted_price: 299, duration: 120
          }
        ]
      },
      
      // Cleaning - Water Tank Cleaning
      { 
        subcategory_name: 'Water Tank Cleaning',
        services: [
          {
            name: 'Overhead Tank Cleaning',
            short_description: 'Professional overhead water tank cleaning',
            description: 'Thorough cleaning and sanitization of overhead water tanks including removal of sediments and bacterial treatment.',
            base_price: 399, discounted_price: 299, duration: 180
          },
          {
            name: 'Underground Tank Cleaning',
            short_description: 'Deep cleaning of underground water tanks',
            description: 'Complete cleaning of underground and sump tanks with pump removal, deep cleaning, and sanitization services.',
            base_price: 499, discounted_price: 379, duration: 240
          }
        ]
      },
      
      // Call A Service - Vehicle Breakdown
      { 
        subcategory_name: 'Vehicle Breakdown',
        services: [
          {
            name: 'Car Breakdown Assistance',
            short_description: 'Emergency car breakdown and towing service',
            description: 'Professional roadside assistance for car breakdowns including battery jump start, flat tire change, and towing services.',
            base_price: 599, discounted_price: 449, duration: 60
          },
          {
            name: 'Bike Breakdown Service',
            short_description: 'Motorcycle and scooter breakdown assistance',
            description: 'Emergency assistance for motorcycle and scooter breakdowns including on-spot repairs and towing to nearest service center.',
            base_price: 299, discounted_price: 229, duration: 45
          }
        ]
      },
      
      // Call A Service - Photography
      { 
        subcategory_name: 'Photography',
        services: [
          {
            name: 'Event Photography',
            short_description: 'Professional event and function photography',
            description: 'Expert photography services for weddings, parties, corporate events, and family functions with editing and album services.',
            base_price: 2999, discounted_price: 2499, duration: 480
          },
          {
            name: 'Product Photography',
            short_description: 'Professional product and commercial photography',
            description: 'High-quality product photography for e-commerce, catalogs, and marketing with professional lighting and editing.',
            base_price: 1499, discounted_price: 1199, duration: 240
          }
        ]
      },
      
      // Call A Service - Logistics
      { 
        subcategory_name: 'Logistics',
        services: [
          {
            name: 'Home Shifting Services',
            short_description: 'Complete household goods shifting and moving',
            description: 'Professional home shifting services including packing, loading, transportation, and unpacking with insurance coverage.',
            base_price: 3999, discounted_price: 3499, duration: 720
          },
          {
            name: 'Goods Transportation',
            short_description: 'Reliable goods transportation service',
            description: 'Safe and reliable transportation of goods, furniture, and equipment with proper handling and delivery tracking.',
            base_price: 1999, discounted_price: 1699, duration: 360
          }
        ]
      },
      
      // Finance & Insurance - ITR Filing
      { 
        subcategory_name: 'ITR Filing',
        services: [
          {
            name: 'Individual ITR Filing',
            short_description: 'Professional income tax return filing service',
            description: 'Expert ITR filing for individuals including salary, business income, and capital gains with maximum tax savings advice.',
            base_price: 999, discounted_price: 799, duration: 120
          },
          {
            name: 'Business ITR Filing',
            short_description: 'Comprehensive business tax return filing',
            description: 'Professional ITR filing for businesses, partnerships, and companies with GST compliance and audit support.',
            base_price: 2499, discounted_price: 1999, duration: 240
          }
        ]
      },
      
      // Finance & Insurance - Legal Documentation
      { 
        subcategory_name: 'Legal Documentation',
        services: [
          {
            name: 'Property Documentation',
            short_description: 'Complete property legal documentation service',
            description: 'Expert assistance with property agreements, sale deeds, registration, and legal verification with lawyer consultation.',
            base_price: 4999, discounted_price: 3999, duration: 480
          },
          {
            name: 'Legal Agreement Drafting',
            short_description: 'Professional legal agreement and contract drafting',
            description: 'Expert drafting of legal agreements, contracts, NOCs, and other legal documents with lawyer review and consultation.',
            base_price: 1999, discounted_price: 1499, duration: 180
          }
        ]
      },
      
      // Finance & Insurance - Financial Services
      { 
        subcategory_name: 'Financial Services',
        services: [
          {
            name: 'Insurance Advisory',
            short_description: 'Comprehensive insurance planning and advisory',
            description: 'Expert insurance advisory for life, health, vehicle, and property insurance with policy comparison and claim assistance.',
            base_price: 999, discounted_price: 699, duration: 90
          },
          {
            name: 'Investment Planning',
            short_description: 'Professional investment and financial planning',
            description: 'Expert financial planning services including mutual funds, SIP, tax planning, and retirement planning with portfolio review.',
            base_price: 1999, discounted_price: 1499, duration: 150
          }
        ]
      },
      
      // Personal Care - Health Services
      { 
        subcategory_name: 'Health Services',
        services: [
          {
            name: 'Home Health Checkup',
            short_description: 'Comprehensive health checkup at home',
            description: 'Professional health checkup services at home including basic tests, vitals monitoring, and health consultation with reports.',
            base_price: 1999, discounted_price: 1499, duration: 120
          },
          {
            name: 'Physiotherapy Services',
            short_description: 'Professional physiotherapy and rehabilitation',
            description: 'Expert physiotherapy services at home for injury recovery, pain management, and mobility improvement with exercise guidance.',
            base_price: 799, discounted_price: 599, duration: 60
          }
        ]
      },
      
      // Civil Work - House Repair
      { 
        subcategory_name: 'House Repair',
        services: [
          {
            name: 'Wall Repair & Plastering',
            short_description: 'Professional wall repair and plastering service',
            description: 'Expert wall crack repair, plastering, and surface preparation for painting with quality materials and workmanship.',
            base_price: 1499, discounted_price: 1199, duration: 360
          },
          {
            name: 'Ceiling Repair & Maintenance',
            short_description: 'Complete ceiling repair and maintenance',
            description: 'Professional ceiling repair including water damage, cracks, POP work, and false ceiling maintenance with material supply.',
            base_price: 1999, discounted_price: 1599, duration: 480
          }
        ]
      },
      
      // Civil Work - Construction
      { 
        subcategory_name: 'Construction',
        services: [
          {
            name: 'Room Construction & Extension',
            short_description: 'Professional room construction and home extension',
            description: 'Expert construction services for room additions, home extensions, and new construction with architectural planning and approvals.',
            base_price: 99999, discounted_price: 89999, duration: 4320
          },
          {
            name: 'Bathroom & Kitchen Construction',
            short_description: 'Complete bathroom and kitchen construction',
            description: 'Professional construction of new bathrooms and kitchens including plumbing, electrical, tiling, and fixture installation.',
            base_price: 49999, discounted_price: 44999, duration: 2160
          }
        ]
      },
      
      // Civil Work - Civil Engineering
      { 
        subcategory_name: 'Civil Engineering',
        services: [
          {
            name: 'Structural Survey & Consultation',
            short_description: 'Professional structural engineering consultation',
            description: 'Expert structural survey, load analysis, foundation design, and engineering consultation for construction and renovation projects.',
            base_price: 9999, discounted_price: 7999, duration: 720
          },
          {
            name: 'Building Plan & Approval',
            short_description: 'Architecture planning and approval services',
            description: 'Complete building plan preparation, architectural design, and government approval assistance with NOC and clearances.',
            base_price: 19999, discounted_price: 15999, duration: 1440
          }
        ]
      }
    ];
    
    // Insert services
    let totalServices = 0;
    for (const serviceGroup of services) {
      const subcategory = subcategories.find(sub => sub.name === serviceGroup.subcategory_name);
      if (!subcategory) {
        console.log(`⚠️  Subcategory not found: ${serviceGroup.subcategory_name}`);
        continue;
      }
      
      for (const service of serviceGroup.services) {
        const inclusions = JSON.stringify([
          'Professional technician visit',
          'Quality tools and equipment',
          'Service completion guarantee',
          'Post-service cleanup',
          'Service warranty'
        ]);
        
        const exclusions = JSON.stringify([
          'Cost of materials/parts',
          'Additional repair charges',
          'Extended warranty coverage'
        ]);
        
        const requirements = JSON.stringify([
          'Access to service area',
          'Basic utilities availability',
          'Clear workspace requirement'
        ]);
        
        const tags = JSON.stringify([
          subcategory.category_name.toLowerCase(),
          serviceGroup.subcategory_name.toLowerCase().replace(/\s+/g, '_'),
          'professional',
          'home_service'
        ]);
        
        const image_paths = JSON.stringify([
          `/images/services/${service.name.toLowerCase().replace(/\s+/g, '-')}/image-1.jpg`,
          `/images/services/${service.name.toLowerCase().replace(/\s+/g, '-')}/image-2.jpg`,
          `/images/services/${service.name.toLowerCase().replace(/\s+/g, '-')}/image-3.jpg`
        ]);
        
        await client.query(`
          INSERT INTO services (
            category_id, subcategory_id, name, description, short_description, base_price,
            discounted_price, duration, inclusions, exclusions, requirements, tags,
            image_paths, rating, review_count, booking_count, is_active, is_featured,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 4.5, 0, 0, true, false, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [
          subcategory.category_id, subcategory.id, service.name, service.description, service.short_description,
          service.base_price, service.discounted_price, service.duration,
          inclusions, exclusions, requirements, tags, image_paths
        ]);
        
        totalServices++;
      }
    }
    
    console.log(`✅ Added ${totalServices} services`);
    
    await client.query('COMMIT');
    console.log('🎉 Services seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding services:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedServices()
    .then(() => {
      console.log('✅ Services seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Services seeding failed:', error);
      process.exit(1);
    });
}

export default seedServices;