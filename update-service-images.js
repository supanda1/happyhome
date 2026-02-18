/**
 * Update Service Images Script
 * 
 * This script adds 4-5 proper related images to all services
 * from free stock photo websites (Unsplash, Pexels).
 */

const API_BASE_URL = 'http://localhost:8001';

// High-quality free images for each service type
const SERVICE_IMAGES = {
  // Plumbing Services
  'plumbing': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',  // plumber working
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', // plumbing tools
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500', // pipe installation
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500', // bathroom fixtures
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500'   // professional plumber
  ],
  
  'basin_sink': [
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', // modern sink
    'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500', // basin installation
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500', // drainage system
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',  // bathroom sink
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500'  // kitchen sink
  ],

  'toilet': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // modern toilet
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500', // toilet installation
    'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=500', // bathroom interior
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', // toilet fixture
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'   // clean bathroom
  ],

  'bath_fittings': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // shower fittings
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', // bath taps
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500', // bathroom accessories
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',  // modern bathroom
    'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500'  // luxury fittings
  ],

  // Electrical Services
  'electrical': [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', // electrician working
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',  // electrical tools
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500', // wiring work
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500', // electrical panel
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500'   // professional electrician
  ],

  'appliance_repair': [
    'https://images.unsplash.com/photo-1556909114-dddd4b6bb80e?w=500', // home appliances
    'https://images.unsplash.com/photo-1585229863666-ef2bbe9ac9a9?w=500', // appliance repair
    'https://images.unsplash.com/photo-1586387793961-d9fec219f32e?w=500', // technician working
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500', // kitchen appliances
    'https://images.unsplash.com/photo-1595515106969-1ad84f69ffe2?w=500'  // repair tools
  ],

  'fan_installation': [
    'https://images.unsplash.com/photo-1592928302636-c83cf4627d3e?w=500', // ceiling fan
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500', // fan installation
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',  // interior with fan
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // modern fan
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500'  // room with fan
  ],

  // Cleaning Services
  'cleaning': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500', // cleaning supplies
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500', // professional cleaner
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500', // clean bathroom
    'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500', // cleaning service
    'https://images.unsplash.com/photo-1574263867128-7d64e0359d9d?w=500'  // clean home
  ],

  'bathroom_cleaning': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // clean bathroom
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', // bathroom cleaning
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500', // sanitized bathroom
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500', // modern clean bathroom
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'   // spotless bathroom
  ],

  // Transport Services
  'cab_booking': [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500', // taxi service
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500', // cab booking
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500', // professional driver
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500', // clean car
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500'   // transport service
  ],

  'courier': [
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500', // delivery service
    'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=500', // courier delivery
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500', // package delivery
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', // professional courier
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'  // delivery person
  ],

  'photography': [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500', // professional photographer
    'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500', // photography equipment
    'https://images.unsplash.com/photo-1502163140606-888448ae8cfe?w=500', // camera gear
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', // event photography
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500'  // portrait photography
  ],

  // Finance Services
  'finance': [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500', // financial documents
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500', // tax filing
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500',  // business finance
    'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=500', // professional service
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500'   // financial planning
  ],

  // Personal Care
  'medicine_delivery': [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500', // medicine delivery
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', // pharmaceutical
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500', // healthcare
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500',  // medical supplies
    'https://images.unsplash.com/photo-1585435557343-3b092031d8c8?w=500'  // pharmacy
  ],

  'salon': [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500', // salon services
    'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500', // beauty treatment
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500',  // professional beautician
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', // beauty service
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500'  // salon at home
  ],

  // Civil Work
  'painting': [
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500', // house painting
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500', // professional painter
    'https://images.unsplash.com/photo-1609132718613-8ec5882b8ce2?w=500', // wall painting
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',  // painting service
    'https://images.unsplash.com/photo-1605808307499-41432d78e57d?w=500'  // interior painting
  ],

  'tile_work': [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500', // tile installation
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500', // marble work
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500', // granite flooring
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',  // professional tiling
    'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500'  // floor installation
  ],

  'house_repair': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',  // home repair
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', // maintenance work
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500', // repair tools
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500', // professional repair
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500'   // home improvement
  ]
};

// Function to get appropriate images for a service
function getServiceImages(serviceName, categoryName, subcategoryName) {
  const name = serviceName.toLowerCase();
  const category = categoryName.toLowerCase();
  const subcategory = subcategoryName?.toLowerCase() || '';

  // Match specific service types
  if (name.includes('basin') || name.includes('sink') || name.includes('drainage')) {
    return SERVICE_IMAGES.basin_sink;
  }
  if (name.includes('toilet')) {
    return SERVICE_IMAGES.toilet;
  }
  if (name.includes('bath') && name.includes('fitting')) {
    return SERVICE_IMAGES.bath_fittings;
  }
  if (name.includes('appliance') || name.includes('repair')) {
    return SERVICE_IMAGES.appliance_repair;
  }
  if (name.includes('fan')) {
    return SERVICE_IMAGES.fan_installation;
  }
  if (name.includes('bathroom') && name.includes('clean')) {
    return SERVICE_IMAGES.bathroom_cleaning;
  }
  if (name.includes('cab') || name.includes('taxi')) {
    return SERVICE_IMAGES.cab_booking;
  }
  if (name.includes('courier') || name.includes('delivery')) {
    return SERVICE_IMAGES.courier;
  }
  if (name.includes('photograph')) {
    return SERVICE_IMAGES.photography;
  }
  if (name.includes('medicine')) {
    return SERVICE_IMAGES.medicine_delivery;
  }
  if (name.includes('salon') || name.includes('beauty')) {
    return SERVICE_IMAGES.salon;
  }
  if (name.includes('painting') || name.includes('paint')) {
    return SERVICE_IMAGES.painting;
  }
  if (name.includes('tile') || name.includes('granite') || name.includes('marble')) {
    return SERVICE_IMAGES.tile_work;
  }
  if (name.includes('repair') && (name.includes('house') || name.includes('home'))) {
    return SERVICE_IMAGES.house_repair;
  }
  if (name.includes('gst') || name.includes('pan') || name.includes('itr') || name.includes('tax')) {
    return SERVICE_IMAGES.finance;
  }

  // Match by category
  if (category.includes('plumbing')) {
    return SERVICE_IMAGES.plumbing;
  }
  if (category.includes('electrical')) {
    return SERVICE_IMAGES.electrical;
  }
  if (category.includes('cleaning')) {
    return SERVICE_IMAGES.cleaning;
  }
  if (category.includes('finance')) {
    return SERVICE_IMAGES.finance;
  }
  if (category.includes('civil')) {
    return SERVICE_IMAGES.house_repair;
  }

  // Default fallback
  return SERVICE_IMAGES.plumbing; // Use plumbing as default
}

// Function to update a single service with images
async function updateServiceImages(serviceId, imagePaths) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        image_paths: imagePaths
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, service: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main function to update all services
async function updateAllServiceImages() {
  console.log('🚀 Starting to update all service images...');
  
  try {
    // First, get all services
    console.log('📡 Fetching all services...');
    const response = await fetch(`${API_BASE_URL}/api/services`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch services: HTTP ${response.status}`);
    }

    const servicesData = await response.json();
    const services = servicesData.data || [];
    
    console.log(`📊 Found ${services.length} services to update`);

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Update each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceNumber = i + 1;
      
      console.log(`\n[${serviceNumber}/${services.length}] Processing: ${service.name}`);
      
      // Get appropriate images for this service
      const images = getServiceImages(
        service.name, 
        service.category_name || '', 
        service.subcategory_name || ''
      );
      
      console.log(`   🖼️  Selected ${images.length} images`);
      
      // Update the service
      const result = await updateServiceImages(service.id, images);
      
      if (result.success) {
        console.log(`   ✅ Successfully updated`);
        successCount++;
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: true,
          imagesCount: images.length
        });
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failureCount++;
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: false,
          error: result.error
        });
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Update process completed!');
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`❌ Failed updates: ${failureCount}`);
    
    if (failureCount > 0) {
      console.log('\n💥 Failed services:');
      results
        .filter(r => !r.success)
        .forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.serviceName} - ${r.error}`);
        });
    }

    return {
      success: successCount,
      failed: failureCount,
      results: results
    };

  } catch (error) {
    console.error('💥 Failed to update service images:', error.message);
    throw error;
  }
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateAllServiceImages };
}

// For browser environment
if (typeof window !== 'undefined') {
  window.updateAllServiceImages = updateAllServiceImages;
}

// If run directly with Node.js
if (typeof require !== 'undefined' && require.main === module) {
  // Add fetch polyfill for Node.js
  if (typeof fetch === 'undefined') {
    const { default: fetch } = require('node-fetch');
    global.fetch = fetch;
  }
  
  updateAllServiceImages()
    .then((result) => {
      console.log('\n🎊 Script completed successfully!');
      console.log(`📈 Summary: ${result.success} successful, ${result.failed} failed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💀 Script failed:', error.message);
      process.exit(1);
    });
}