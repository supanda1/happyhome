import pool from '../config/database';

const seedDetailedServices = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting detailed services seeding...');
    
    // Clear dependent data first to avoid foreign key constraint violations
    await client.query('DELETE FROM cart_items WHERE 1=1');
    await client.query('DELETE FROM order_items WHERE 1=1');  
    await client.query('DELETE FROM service_variants WHERE 1=1');
    console.log('🗑️  Cleared dependent records');
    
    // Now clear existing services
    await client.query('DELETE FROM services WHERE 1=1');
    console.log('🗑️  Cleared existing services');
    
    // Get subcategory IDs from database
    const subcategoriesResult = await client.query(`
      SELECT ss.id, ss.name, ss.category_id, sc.name as category_name 
      FROM service_subcategories ss
      JOIN service_categories sc ON ss.category_id = sc.id
      ORDER BY sc.sort_order, ss.sort_order
    `);
    
    const subcategories = subcategoriesResult.rows;
    console.log(`Found ${subcategories.length} subcategories`);
    
    // Define detailed services for each subcategory
    const services = [
      // PLUMBING SERVICES
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
            base_price: 179, discounted_price: 129, duration: 60,
            inclusions: [
              'Expert plumber visit',
              'Tap/faucet installation or repair',
              'Water flow optimization',
              'Leak-proof guarantee',
              '45-day warranty'
            ],
            exclusions: [
              'Cost of tap/faucet',
              'Pipe extension work',
              'Bathroom renovation',
              'Premium fixture charges'
            ],
            requirements: [
              'Clear access to installation area',
              'Water supply connection',
              'Proper drainage system'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Basin & Drainage',
        services: [
          {
            name: 'Basin Installation Services',
            short_description: 'Professional basin installation and setup',
            description: 'Complete basin installation including plumbing connections, drainage setup, and sealing work for kitchen and bathroom basins.',
            base_price: 299, discounted_price: 229, duration: 120,
            inclusions: [
              'Professional plumber visit',
              'Basin mounting and installation',
              'Plumbing connections setup',
              'Drainage pipe connection',
              '60-day installation warranty'
            ],
            exclusions: [
              'Cost of basin and fittings',
              'Wall modification charges',
              'Electrical work for lights',
              'Tile work and finishing'
            ],
            requirements: [
              'Pre-installed water supply lines',
              'Proper wall support structure',
              'Access to drainage connection',
              'Clear work area'
            ]
          },
          {
            name: 'Drain Cleaning & Unclogging',
            short_description: 'Professional drain cleaning and blockage removal',
            description: 'Expert drain cleaning services for kitchen, bathroom, and floor drains using professional tools and eco-friendly solutions.',
            base_price: 249, discounted_price: 179, duration: 90,
            inclusions: [
              'Professional drain cleaning',
              'Blockage removal service',
              'High-pressure water jetting',
              'Drain inspection',
              '15-day free re-service guarantee'
            ],
            exclusions: [
              'Pipe replacement charges',
              'Major plumbing repairs',
              'Chemical drain cleaners',
              'Excavation work'
            ],
            requirements: [
              'Access to drain points',
              'Water supply availability',
              'Clear path to drainage system'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Toilet Installation',
        services: [
          {
            name: 'Complete Toilet Installation',
            short_description: 'Full toilet installation with plumbing connections',
            description: 'Professional toilet installation including removal of old toilet, plumbing connections, sealing, and testing with warranty.',
            base_price: 399, discounted_price: 299, duration: 150,
            inclusions: [
              'Expert plumber visit',
              'Old toilet removal',
              'New toilet installation',
              'Plumbing connections',
              'Water sealing and testing',
              '90-day installation warranty'
            ],
            exclusions: [
              'Cost of toilet and accessories',
              'Floor tile work',
              'Electrical work for exhaust fan',
              'Disposal of old toilet'
            ],
            requirements: [
              'Pre-existing water supply connection',
              'Proper drainage system',
              'Level flooring surface',
              'Access for removal of old toilet'
            ]
          },
          {
            name: 'Toilet Repair & Maintenance',
            short_description: 'Comprehensive toilet repair services',
            description: 'Expert toilet repair including flush mechanism, seat replacement, leak fixing, and general maintenance work.',
            base_price: 199, discounted_price: 149, duration: 75,
            inclusions: [
              'Professional diagnosis',
              'Flush mechanism repair',
              'Leak detection and fixing',
              'Water level adjustment',
              '30-day repair warranty'
            ],
            exclusions: [
              'Cost of replacement parts',
              'Major plumbing overhaul',
              'Toilet seat replacement cost',
              'Structural modifications'
            ],
            requirements: [
              'Access to toilet area',
              'Water supply available',
              'Clear description of problem'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Pipe & Connector',
        services: [
          {
            name: 'Pipe Installation & Repair',
            short_description: 'Professional pipe installation and repair service',
            description: 'Expert installation and repair of water supply and drainage pipes including PVC, copper, and flexible pipes with proper fittings.',
            base_price: 279, discounted_price: 199, duration: 120,
            inclusions: [
              'Expert plumber visit',
              'Pipe installation/repair',
              'Pressure testing',
              'Leak-proof connections',
              '60-day workmanship warranty'
            ],
            exclusions: [
              'Cost of pipes and fittings',
              'Wall breaking charges',
              'Floor digging work',
              'Restoration work after installation'
            ],
            requirements: [
              'Clear access to pipe routes',
              'Water supply shutdown capability',
              'Proper measurement of required length'
            ]
          },
          {
            name: 'Pipe Leak Detection & Fixing',
            short_description: 'Advanced leak detection and repair',
            description: 'Professional leak detection using modern tools and expert repair services for hidden and visible pipe leaks.',
            base_price: 349, discounted_price: 249, duration: 90,
            inclusions: [
              'Professional leak detection',
              'Non-invasive detection methods',
              'Leak repair service',
              'Pressure testing post-repair',
              '45-day leak-free guarantee'
            ],
            exclusions: [
              'Major pipe replacement',
              'Wall reconstruction',
              'Excavation charges',
              'Premium detection equipment charges'
            ],
            requirements: [
              'Access to suspected leak areas',
              'Water meter readings available',
              'Clear area around pipe routes'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Water Tank Services',
        services: [
          {
            name: 'Water Tank Installation',
            short_description: 'Complete water tank installation service',
            description: 'Professional installation of overhead and underground water tanks with proper plumbing connections and supports.',
            base_price: 599, discounted_price: 449, duration: 240,
            inclusions: [
              'Professional installation team',
              'Tank positioning and mounting',
              'Inlet and outlet connections',
              'Overflow and valve setup',
              '6-month installation warranty'
            ],
            exclusions: [
              'Cost of water tank',
              'Electrical motor connection',
              'Platform construction',
              'Crane charges for lifting'
            ],
            requirements: [
              'Proper foundation or platform',
              'Access for tank delivery',
              'Water supply line availability',
              'Electrical connection for motor'
            ]
          },
          {
            name: 'Water Tank Cleaning & Maintenance',
            short_description: 'Thorough water tank cleaning service',
            description: 'Complete water tank cleaning, sanitization, and maintenance including inspection of tank condition and connections.',
            base_price: 299, discounted_price: 229, duration: 180,
            inclusions: [
              'Professional cleaning team',
              'Complete water drainage',
              'Scrubbing and sanitization',
              'Chlorination and disinfection',
              'Tank condition inspection'
            ],
            exclusions: [
              'Tank repair charges',
              'Replacement of damaged parts',
              'Water refilling cost',
              'Access equipment rental'
            ],
            requirements: [
              'Safe access to tank',
              'Water drainage arrangement',
              'Alternative water supply during cleaning'
            ]
          }
        ]
      },
      
      // ELECTRICAL SERVICES
      { 
        subcategory_name: 'Appliance Repair',
        services: [
          {
            name: 'AC Repair & Servicing',
            short_description: 'Professional AC repair and maintenance',
            description: 'Expert air conditioner repair, servicing, gas filling, and maintenance for all brands of split and window ACs.',
            base_price: 399, discounted_price: 299, duration: 120,
            inclusions: [
              'Certified technician visit',
              'Complete AC diagnosis',
              'Basic cleaning and servicing',
              'Performance optimization',
              '30-day service warranty'
            ],
            exclusions: [
              'Gas filling charges',
              'Spare parts cost',
              'Major component replacement',
              'Installation charges'
            ],
            requirements: [
              'Safe access to AC unit',
              'Power supply availability',
              'Clear area around indoor/outdoor units'
            ]
          },
          {
            name: 'Refrigerator Repair',
            short_description: 'Complete refrigerator repair service',
            description: 'Professional refrigerator repair including cooling issues, compressor problems, and electrical faults for all brands.',
            base_price: 349, discounted_price: 269, duration: 90,
            inclusions: [
              'Expert technician visit',
              'Complete diagnosis',
              'Cooling system check',
              'Temperature calibration',
              '45-day repair warranty'
            ],
            exclusions: [
              'Spare parts and components',
              'Gas charging if required',
              'Compressor replacement',
              'Transportation charges'
            ],
            requirements: [
              'Access to refrigerator back panel',
              'Power supply for testing',
              'Space for technician to work'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Switch & Socket',
        services: [
          {
            name: 'Switch & Socket Installation',
            short_description: 'Professional electrical switch and socket setup',
            description: 'Expert installation of electrical switches, sockets, and power outlets with proper wiring and safety measures.',
            base_price: 149, discounted_price: 99, duration: 45,
            inclusions: [
              'Certified electrician visit',
              'Switch/socket installation',
              'Proper wiring connections',
              'Safety testing',
              '90-day installation warranty'
            ],
            exclusions: [
              'Cost of switches/sockets',
              'Wall cutting charges',
              'Conduit pipe installation',
              'Painting touch-up work'
            ],
            requirements: [
              'Existing electrical wiring',
              'Main power supply',
              'Clear wall space for installation'
            ]
          },
          {
            name: 'Electrical Point Addition',
            short_description: 'Adding new electrical points and connections',
            description: 'Professional addition of new electrical points, switches, and sockets with proper wiring from main distribution board.',
            base_price: 299, discounted_price: 229, duration: 90,
            inclusions: [
              'Licensed electrician visit',
              'New point wiring',
              'Connection from main board',
              'Safety compliance check',
              '6-month workmanship warranty'
            ],
            exclusions: [
              'Cost of switches and sockets',
              'Additional MCB if required',
              'Wall channeling charges',
              'Electrical board upgrade'
            ],
            requirements: [
              'Access to main electrical panel',
              'Available circuit capacity',
              'Permission for wall work'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Lighting Solution',
        services: [
          {
            name: 'LED Light Installation',
            short_description: 'Modern LED lighting setup and installation',
            description: 'Professional installation of LED lights, tube lights, panel lights, and smart lighting solutions with proper wiring.',
            base_price: 199, discounted_price: 149, duration: 60,
            inclusions: [
              'Expert electrician visit',
              'LED light installation',
              'Proper mounting and wiring',
              'Brightness testing',
              '2-year installation warranty'
            ],
            exclusions: [
              'Cost of LED lights',
              'Additional wiring charges',
              'Smart home integration',
              'Dimmer switch installation'
            ],
            requirements: [
              'Existing electrical connection',
              'Proper ceiling/wall mounting points',
              'Power supply availability'
            ]
          },
          {
            name: 'Chandelier & Decorative Lighting',
            short_description: 'Elegant chandelier and decorative light setup',
            description: 'Expert installation of chandeliers, pendant lights, and decorative lighting fixtures with proper support and wiring.',
            base_price: 399, discounted_price: 299, duration: 120,
            inclusions: [
              'Professional installation team',
              'Secure ceiling mounting',
              'Electrical connections',
              'Safety compliance check',
              '1-year installation warranty'
            ],
            exclusions: [
              'Cost of lighting fixtures',
              'Ceiling reinforcement work',
              'Additional electrical wiring',
              'Interior design consultation'
            ],
            requirements: [
              'Strong ceiling support structure',
              'Electrical connection point',
              'Sufficient ceiling height',
              'Clear installation area'
            ]
          }
        ]
      },
      
      // CLEANING SERVICES
      { 
        subcategory_name: 'Water Tank Cleaning',
        services: [
          {
            name: 'Overhead Tank Cleaning',
            short_description: 'Professional overhead water tank cleaning',
            description: 'Thorough cleaning and sanitization of overhead water tanks including removal of sediments and bacterial treatment.',
            base_price: 399, discounted_price: 299, duration: 180,
            inclusions: [
              'Professional cleaning team',
              'Complete water drainage',
              'Manual scrubbing and cleaning',
              'Disinfection and sanitization',
              'Water quality testing'
            ],
            exclusions: [
              'Tank repair work',
              'Access ladder rental',
              'Water refilling cost',
              'Plumbing repair charges'
            ],
            requirements: [
              'Safe rooftop access',
              'Alternative water arrangement',
              'Tank drainage facility',
              'Clear area around tank'
            ]
          },
          {
            name: 'Underground Tank Cleaning',
            short_description: 'Deep cleaning of underground water tanks',
            description: 'Complete cleaning of underground and sump tanks with pump removal, deep cleaning, and sanitization services.',
            base_price: 499, discounted_price: 379, duration: 240,
            inclusions: [
              'Specialized cleaning team',
              'Motor and pump removal',
              'Deep scrubbing service',
              'Complete sanitization',
              'Motor reinstallation and testing'
            ],
            exclusions: [
              'Motor repair charges',
              'Pump replacement cost',
              'Structural tank repairs',
              'Electrical motor rewiring'
            ],
            requirements: [
              'Access to underground tank',
              'Motor shutdown arrangement',
              'Alternative water supply',
              'Electrical safety measures'
            ]
          }
        ]
      },
      
      // CALL A SERVICE
      { 
        subcategory_name: 'Vehicle Breakdown',
        services: [
          {
            name: 'Car Breakdown Assistance',
            short_description: 'Emergency car breakdown and towing service',
            description: 'Professional roadside assistance for car breakdowns including battery jump start, flat tire change, and towing services.',
            base_price: 599, discounted_price: 449, duration: 60,
            inclusions: [
              'Emergency roadside response',
              'Basic diagnostic service',
              'Jump start assistance',
              'Flat tire change service',
              'Towing up to 10km'
            ],
            exclusions: [
              'Spare parts cost',
              'Fuel charges',
              'Extended towing distance',
              'Major mechanical repairs'
            ],
            requirements: [
              'Vehicle location details',
              'Valid driving license',
              'Vehicle registration papers',
              'Clear road access'
            ]
          },
          {
            name: 'Bike Breakdown Service',
            short_description: 'Motorcycle and scooter breakdown assistance',
            description: 'Emergency assistance for motorcycle and scooter breakdowns including on-spot repairs and towing to nearest service center.',
            base_price: 299, discounted_price: 229, duration: 45,
            inclusions: [
              'Quick response team',
              'On-spot minor repairs',
              'Battery and electrical check',
              'Towing service up to 5km',
              'Basic troubleshooting'
            ],
            exclusions: [
              'Spare parts and components',
              'Fuel arrangement',
              'Major engine repairs',
              'Extended towing charges'
            ],
            requirements: [
              'Bike location and contact details',
              'Vehicle documents',
              'Clear description of problem',
              'Accessible road location'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Photography',
        services: [
          {
            name: 'Event Photography',
            short_description: 'Professional event and function photography',
            description: 'Expert photography services for weddings, parties, corporate events, and family functions with editing and album services.',
            base_price: 2999, discounted_price: 2499, duration: 480,
            inclusions: [
              'Professional photographer',
              'High-quality camera equipment',
              '8-hour coverage',
              'Digital photo editing',
              '100+ edited photos',
              'Online gallery access'
            ],
            exclusions: [
              'Album printing charges',
              'Additional photographer cost',
              'Videography services',
              'Travel charges outside city'
            ],
            requirements: [
              'Event date and venue details',
              'Photography style preferences',
              'List of important moments to capture',
              'Venue photography permissions'
            ]
          },
          {
            name: 'Product Photography',
            short_description: 'Professional product and commercial photography',
            description: 'High-quality product photography for e-commerce, catalogs, and marketing with professional lighting and editing.',
            base_price: 1499, discounted_price: 1199, duration: 240,
            inclusions: [
              'Professional product photographer',
              'Studio lighting setup',
              'Multiple angle shots',
              'Background removal/replacement',
              '20+ edited product images',
              'High-resolution files'
            ],
            exclusions: [
              'Product styling charges',
              'Additional props cost',
              'Rush delivery charges',
              'Video product demo'
            ],
            requirements: [
              'Products to be photographed',
              'Preferred background/style',
              'Specific angle requirements',
              'Usage rights discussion'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Logistics',
        services: [
          {
            name: 'Home Shifting Services',
            short_description: 'Complete household goods shifting and moving',
            description: 'Professional home shifting services including packing, loading, transportation, and unpacking with insurance coverage.',
            base_price: 3999, discounted_price: 3499, duration: 720,
            inclusions: [
              'Professional packing team',
              'Quality packing materials',
              'Loading and unloading',
              'Transportation service',
              'Basic insurance coverage',
              'Unpacking at destination'
            ],
            exclusions: [
              'Additional insurance premium',
              'Appliance installation charges',
              'Storage charges',
              'Interstate permit fees'
            ],
            requirements: [
              'Complete inventory list',
              'Source and destination addresses',
              'Floor access details',
              'Preferred moving date'
            ]
          },
          {
            name: 'Goods Transportation',
            short_description: 'Reliable goods transportation service',
            description: 'Safe and reliable transportation of goods, furniture, and equipment with proper handling and delivery tracking.',
            base_price: 1999, discounted_price: 1699, duration: 360,
            inclusions: [
              'Professional loading team',
              'Secure transportation',
              'Real-time tracking',
              'Careful handling',
              'Delivery confirmation',
              'Basic damage protection'
            ],
            exclusions: [
              'Packaging material cost',
              'Additional insurance',
              'Multiple pickup points',
              'Express delivery charges'
            ],
            requirements: [
              'Detailed goods description',
              'Weight and dimensions',
              'Pickup and delivery addresses',
              'Contact person details'
            ]
          }
        ]
      },
      
      // FINANCE & INSURANCE
      { 
        subcategory_name: 'ITR Filing',
        services: [
          {
            name: 'Individual ITR Filing',
            short_description: 'Professional income tax return filing service',
            description: 'Expert ITR filing for individuals including salary, business income, and capital gains with maximum tax savings advice.',
            base_price: 999, discounted_price: 799, duration: 120,
            inclusions: [
              'Qualified tax consultant',
              'ITR form preparation',
              'Online e-filing service',
              'Tax calculation optimization',
              'ITR acknowledgment',
              '6-month query support'
            ],
            exclusions: [
              'Additional form fees',
              'Tax payment charges',
              'Documentation charges',
              'Complex audit cases'
            ],
            requirements: [
              'Form 16 or salary slips',
              'Investment proofs',
              'Bank statements',
              'Previous year ITR copy',
              'PAN and Aadhaar cards'
            ]
          },
          {
            name: 'Business ITR Filing',
            short_description: 'Comprehensive business tax return filing',
            description: 'Professional ITR filing for businesses, partnerships, and companies with GST compliance and audit support.',
            base_price: 2499, discounted_price: 1999, duration: 240,
            inclusions: [
              'Chartered accountant consultation',
              'Business ITR preparation',
              'GST compliance check',
              'Audit trail maintenance',
              'E-filing and verification',
              '1-year documentation support'
            ],
            exclusions: [
              'Audit report charges',
              'Additional compliance fees',
              'Late filing penalties',
              'Tax consultant visits'
            ],
            requirements: [
              'Business registration documents',
              'Financial statements',
              'GST returns',
              'Bank statements',
              'Investment and expenditure records'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Legal Documentation',
        services: [
          {
            name: 'Property Documentation',
            short_description: 'Complete property legal documentation service',
            description: 'Expert assistance with property agreements, sale deeds, registration, and legal verification with lawyer consultation.',
            base_price: 4999, discounted_price: 3999, duration: 480,
            inclusions: [
              'Legal expert consultation',
              'Document drafting service',
              'Legal verification',
              'Registration assistance',
              'Compliance check',
              '3-month legal support'
            ],
            exclusions: [
              'Government registration fees',
              'Stamp duty charges',
              'Additional legal proceedings',
              'Property valuation charges'
            ],
            requirements: [
              'Property documents',
              'Identity proofs of all parties',
              'Property survey documents',
              'NOC certificates',
              'Previous ownership papers'
            ]
          },
          {
            name: 'Legal Agreement Drafting',
            short_description: 'Professional legal agreement and contract drafting',
            description: 'Expert drafting of legal agreements, contracts, NOCs, and other legal documents with lawyer review and consultation.',
            base_price: 1999, discounted_price: 1499, duration: 180,
            inclusions: [
              'Legal expert consultation',
              'Custom agreement drafting',
              'Legal compliance review',
              'Document finalization',
              '2 revision rounds included',
              '60-day query support'
            ],
            exclusions: [
              'Notarization charges',
              'Additional legal consultation',
              'Court filing fees',
              'Multiple party coordination'
            ],
            requirements: [
              'Agreement purpose and scope',
              'Party details and requirements',
              'Terms and conditions outline',
              'Legal precedent references'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Financial Services',
        services: [
          {
            name: 'Insurance Advisory',
            short_description: 'Comprehensive insurance planning and advisory',
            description: 'Expert insurance advisory for life, health, vehicle, and property insurance with policy comparison and claim assistance.',
            base_price: 999, discounted_price: 699, duration: 90,
            inclusions: [
              'Certified insurance advisor',
              'Needs analysis',
              'Policy comparison',
              'Premium optimization',
              'Claim assistance guidance',
              '1-year advisory support'
            ],
            exclusions: [
              'Insurance premium payments',
              'Policy processing fees',
              'Medical examination charges',
              'Legal claim proceedings'
            ],
            requirements: [
              'Income and expenditure details',
              'Current insurance policies',
              'Health and age information',
              'Risk assessment preferences'
            ]
          },
          {
            name: 'Investment Planning',
            short_description: 'Professional investment and financial planning',
            description: 'Expert financial planning services including mutual funds, SIP, tax planning, and retirement planning with portfolio review.',
            base_price: 1999, discounted_price: 1499, duration: 150,
            inclusions: [
              'Certified financial planner',
              'Portfolio analysis',
              'Investment recommendations',
              'Risk assessment',
              'Goal-based planning',
              '6-month review sessions'
            ],
            exclusions: [
              'Investment amount',
              'Brokerage charges',
              'Fund management fees',
              'Transaction charges'
            ],
            requirements: [
              'Financial goals and timeline',
              'Current investment portfolio',
              'Risk tolerance assessment',
              'Income and expense details'
            ]
          }
        ]
      },
      
      // PERSONAL CARE
      { 
        subcategory_name: 'Health Services',
        services: [
          {
            name: 'Home Health Checkup',
            short_description: 'Comprehensive health checkup at home',
            description: 'Professional health checkup services at home including basic tests, vitals monitoring, and health consultation with reports.',
            base_price: 1999, discounted_price: 1499, duration: 120,
            inclusions: [
              'Qualified healthcare professional',
              'Basic health screening',
              'Vital signs monitoring',
              'Blood pressure and sugar check',
              'Health consultation',
              'Digital health report'
            ],
            exclusions: [
              'Advanced diagnostic tests',
              'Prescription medicines',
              'Follow-up consultations',
              'Specialist doctor visits'
            ],
            requirements: [
              'Patient health history',
              'Current medications list',
              'Preferred appointment time',
              'Emergency contact details'
            ]
          },
          {
            name: 'Physiotherapy Services',
            short_description: 'Professional physiotherapy and rehabilitation',
            description: 'Expert physiotherapy services at home for injury recovery, pain management, and mobility improvement with exercise guidance.',
            base_price: 799, discounted_price: 599, duration: 60,
            inclusions: [
              'Certified physiotherapist visit',
              'Condition assessment',
              'Therapeutic exercises',
              'Pain management techniques',
              'Recovery progress tracking',
              'Exercise routine guidance'
            ],
            exclusions: [
              'Medical equipment purchase',
              'Prescription medications',
              'Advanced therapy equipment',
              'Multiple session packages'
            ],
            requirements: [
              'Medical prescription/referral',
              'Previous treatment history',
              'Clear area for exercises',
              'Patient mobility information'
            ]
          }
        ]
      },
      
      // CIVIL WORK
      { 
        subcategory_name: 'House Repair',
        services: [
          {
            name: 'Wall Repair & Plastering',
            short_description: 'Professional wall repair and plastering service',
            description: 'Expert wall crack repair, plastering, and surface preparation for painting with quality materials and workmanship.',
            base_price: 1499, discounted_price: 1199, duration: 360,
            inclusions: [
              'Skilled mason visit',
              'Crack assessment and repair',
              'Surface preparation',
              'Quality plastering work',
              'Smooth finish guarantee',
              '6-month workmanship warranty'
            ],
            exclusions: [
              'Cost of cement and sand',
              'Painting charges',
              'Scaffolding charges',
              'Large structural repairs'
            ],
            requirements: [
              'Clear access to work area',
              'Water supply for mixing',
              'Material storage space',
              'Detailed area measurement'
            ]
          },
          {
            name: 'Ceiling Repair & Maintenance',
            short_description: 'Complete ceiling repair and maintenance',
            description: 'Professional ceiling repair including water damage, cracks, POP work, and false ceiling maintenance with material supply.',
            base_price: 1999, discounted_price: 1599, duration: 480,
            inclusions: [
              'Experienced ceiling specialist',
              'Damage assessment',
              'Crack and leak repair',
              'Surface restoration',
              'Paint-ready finish',
              '90-day repair warranty'
            ],
            exclusions: [
              'Cost of POP and materials',
              'Electrical fitting charges',
              'Scaffolding rental',
              'Complete ceiling replacement'
            ],
            requirements: [
              'Safe access to ceiling',
              'Furniture removal from area',
              'Electrical safety measures',
              'Material specification preferences'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Construction',
        services: [
          {
            name: 'Room Construction & Extension',
            short_description: 'Professional room construction and home extension',
            description: 'Expert construction services for room additions, home extensions, and new construction with architectural planning and approvals.',
            base_price: 99999, discounted_price: 89999, duration: 4320,
            inclusions: [
              'Architectural consultation',
              'Structural design planning',
              'Construction supervision',
              'Quality material guidance',
              'Progress monitoring',
              '2-year structural warranty'
            ],
            exclusions: [
              'Government approval fees',
              'Material and labor cost',
              'Electrical and plumbing work',
              'Interior design services'
            ],
            requirements: [
              'Building plan approvals',
              'Site accessibility',
              'Utility connections availability',
              'Clear project timeline'
            ]
          },
          {
            name: 'Bathroom & Kitchen Construction',
            short_description: 'Complete bathroom and kitchen construction',
            description: 'Professional construction of new bathrooms and kitchens including plumbing, electrical, tiling, and fixture installation.',
            base_price: 49999, discounted_price: 44999, duration: 2160,
            inclusions: [
              'Complete construction service',
              'Plumbing and electrical layout',
              'Tiling and waterproofing',
              'Fixture installation guidance',
              'Quality supervision',
              '1-year construction warranty'
            ],
            exclusions: [
              'Cost of tiles and fixtures',
              'Premium fittings charges',
              'Modular kitchen cost',
              'Interior decoration'
            ],
            requirements: [
              'Detailed design layout',
              'Utility connection points',
              'Material selection preferences',
              'Timeline and budget discussion'
            ]
          }
        ]
      },
      
      { 
        subcategory_name: 'Civil Engineering',
        services: [
          {
            name: 'Structural Survey & Consultation',
            short_description: 'Professional structural engineering consultation',
            description: 'Expert structural survey, load analysis, foundation design, and engineering consultation for construction and renovation projects.',
            base_price: 9999, discounted_price: 7999, duration: 720,
            inclusions: [
              'Licensed structural engineer visit',
              'Complete structural assessment',
              'Load calculation analysis',
              'Foundation design guidance',
              'Safety compliance check',
              'Detailed technical report'
            ],
            exclusions: [
              'Soil testing charges',
              'Detailed drawings cost',
              'Government approval fees',
              'Construction supervision'
            ],
            requirements: [
              'Building plans and documents',
              'Site access for inspection',
              'Previous construction history',
              'Specific engineering requirements'
            ]
          },
          {
            name: 'Building Plan & Approval',
            short_description: 'Architecture planning and approval services',
            description: 'Complete building plan preparation, architectural design, and government approval assistance with NOC and clearances.',
            base_price: 19999, discounted_price: 15999, duration: 1440,
            inclusions: [
              'Licensed architect consultation',
              'Building plan preparation',
              'Structural drawing creation',
              'Approval documentation',
              'Government liaison',
              'NOC assistance'
            ],
            exclusions: [
              'Government fees and charges',
              'Site survey charges',
              'Revision charges beyond 2',
              'Fast-track approval fees'
            ],
            requirements: [
              'Site documents and survey',
              'Construction requirements brief',
              'Local building regulations',
              'Utility connection details'
            ]
          }
        ]
      }
    ];
    
    // Insert services with detailed information
    let totalServices = 0;
    for (const serviceGroup of services) {
      const subcategory = subcategories.find(sub => sub.name === serviceGroup.subcategory_name);
      if (!subcategory) {
        console.log(`⚠️  Subcategory not found: ${serviceGroup.subcategory_name}`);
        continue;
      }
      
      for (const service of serviceGroup.services) {
        const inclusions = JSON.stringify(service.inclusions);
        const exclusions = JSON.stringify(service.exclusions);
        const requirements = JSON.stringify(service.requirements);
        
        const tags = JSON.stringify([
          subcategory.category_name.toLowerCase().replace(/\s+/g, '_'),
          serviceGroup.subcategory_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          'professional',
          'home_service'
        ]);
        
        const image_paths = JSON.stringify([
          `/images/services/${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/image-1.jpg`,
          `/images/services/${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/image-2.jpg`,
          `/images/services/${service.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/image-3.jpg`
        ]);
        
        await client.query(`
          INSERT INTO services (
            category_id, subcategory_id, name, description, short_description, base_price,
            discounted_price, duration, inclusions, exclusions, requirements, tags,
            image_paths, rating, review_count, booking_count, is_active, is_featured,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 4.5, 0, 0, true, false, NOW(), NOW())
        `, [
          subcategory.category_id, subcategory.id, service.name, service.description, service.short_description,
          service.base_price, service.discounted_price, service.duration,
          inclusions, exclusions, requirements, tags, image_paths
        ]);
        
        totalServices++;
      }
    }
    
    console.log(`✅ Added ${totalServices} detailed services`);
    
    await client.query('COMMIT');
    console.log('🎉 Detailed services seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding detailed services:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDetailedServices()
    .then(() => {
      console.log('✅ Detailed services seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Detailed services seeding failed:', error);
      process.exit(1);
    });
}

export default seedDetailedServices;