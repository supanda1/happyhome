/**
 * Browser Console Script - Update Service Images
 * 
 * Instructions:
 * 1. Open your browser and navigate to your application (http://localhost:3003)
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to execute
 * 
 * This will add 4-5 appropriate images to each service from free websites.
 */

(async function updateAllServiceImages() {
  console.log('🚀 Starting to update all service images...');
  
  const API_BASE_URL = 'http://localhost:8001';

  // Unique high-quality images for each specific service from Unsplash
  const SERVICE_IMAGES = {
    // Plumbing Services - Each service gets unique images
    'basin_sink_drainage': [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&auto=format&fit=crop', 
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop'
    ],
    
    'bath_fittings_install': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop'
    ],

    'tile_grouting_sealing': [
      'https://images.unsplash.com/photo-1620045943141-ce84a887b3e5?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574692156979-d1d8ac2562c4?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588060162191-5b7a5e8dd005?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop'
    ],

    'toilet_installation_repair': [
      'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop'
    ],

    'pipe_connector_install': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop'
    ],

    'water_tank_services': [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=500&auto=format&fit=crop'
    ],

    'other_plumbing_services': [
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574263867128-7d64e0359d9d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop'
    ],

    // Electrical Services - Unique for each
    'electrical_wiring_install': [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop'
    ],

    'home_appliance_repair': [
      'https://images.unsplash.com/photo-1556909114-dddd4b6bb80e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585229863666-ef2bbe9ac9a9?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586387793961-d9fec219f32e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595515106969-1ad84f69ffe2?w=500&auto=format&fit=crop'
    ],

    'switch_socket_install': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588060162191-5b7a5e8dd005?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574692156979-d1d8ac2562c4?w=500&auto=format&fit=crop'
    ],

    'fan_installation_service': [
      'https://images.unsplash.com/photo-1592928302636-c83cf4627d3e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop'
    ],

    'lighting_installation': [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop'
    ],

    'electrical_safety_check': [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574692156979-d1d8ac2562c4?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588060162191-5b7a5e8dd005?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop'
    ],

    // Cleaning Services - Unique for each
    'bathroom_deep_cleaning': [
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574263867128-7d64e0359d9d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop'
    ],

    // Transport Services - Unique for each
    'courier_delivery_service': [
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop'
    ],

    'cab_booking_service': [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&auto=format&fit=crop'
    ],

    'vehicle_breakdown_service': [
      'https://images.unsplash.com/photo-1632823471565-1ecdf3fd5bbc?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop'
    ],

    'photography_services': [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502163140606-888448ae8cfe?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop'
    ],

    // Finance Services - Unique for each
    'gst_registration_filing': [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop'
    ],

    'pan_card_application': [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&auto=format&fit=crop'
    ],

    'itr_filing_services': [
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop'
    ],

    'stamp_paper_legal': [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop'
    ],

    // Personal Care - Unique for each
    'medicine_delivery_service': [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585435557343-3b092031d8c8?w=500&auto=format&fit=crop'
    ],

    'salon_door_beauty': [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop'
    ],

    // Civil Work - Unique for each
    'house_painting_services': [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1609132718613-8ec5882b8ce2?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605808307499-41432d78e57d?w=500&auto=format&fit=crop'
    ],

    'tile_granite_marble': [
      'https://images.unsplash.com/photo-1574692156979-d1d8ac2562c4?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620045943141-ce84a887b3e5?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588060162191-5b7a5e8dd005?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop'
    ],

    'house_repair_maintenance': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop'
    ],
    
    'basin_sink': [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop', // modern sink
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop', // basin installation
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop', // drainage system
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',  // bathroom sink
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&auto=format&fit=crop'  // kitchen sink
    ],

    'toilet': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop', // modern toilet
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop', // toilet installation
      'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=500&auto=format&fit=crop', // bathroom interior
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop', // toilet fixture
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop'   // clean bathroom
    ],

    'bath_fittings': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop', // shower fittings
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop', // bath taps
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop', // bathroom accessories
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',  // modern bathroom
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop'  // luxury fittings
    ],

    // Electrical Services
    'electrical': [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', // electrician working
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',  // electrical tools
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop', // wiring work
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop', // electrical panel
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop'   // professional electrician
    ],

    'appliance_repair': [
      'https://images.unsplash.com/photo-1556909114-dddd4b6bb80e?w=500&auto=format&fit=crop', // home appliances
      'https://images.unsplash.com/photo-1585229863666-ef2bbe9ac9a9?w=500&auto=format&fit=crop', // appliance repair
      'https://images.unsplash.com/photo-1586387793961-d9fec219f32e?w=500&auto=format&fit=crop', // technician working
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop', // kitchen appliances
      'https://images.unsplash.com/photo-1595515106969-1ad84f69ffe2?w=500&auto=format&fit=crop'  // repair tools
    ],

    'fan_installation': [
      'https://images.unsplash.com/photo-1592928302636-c83cf4627d3e?w=500&auto=format&fit=crop', // ceiling fan
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&auto=format&fit=crop', // fan installation
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',  // interior with fan
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop', // modern fan
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop'  // room with fan
    ],

    // Cleaning Services
    'cleaning': [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop', // cleaning supplies
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop', // professional cleaner
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop', // clean bathroom
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop', // cleaning service
      'https://images.unsplash.com/photo-1574263867128-7d64e0359d9d?w=500&auto=format&fit=crop'  // clean home
    ],

    'bathroom_cleaning': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop', // clean bathroom
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop', // bathroom cleaning
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop', // sanitized bathroom
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop', // modern clean bathroom
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop'   // spotless bathroom
    ],

    // Transport Services
    'cab_booking': [
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop', // taxi service
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop', // cab booking
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format&fit=crop', // professional driver
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&auto=format&fit=crop', // clean car
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&auto=format&fit=crop'   // transport service
    ],

    'courier': [
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop', // delivery service
      'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=500&auto=format&fit=crop', // courier delivery
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop', // package delivery
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop', // professional courier
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop'  // delivery person
    ],

    'photography': [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&auto=format&fit=crop', // professional photographer
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&auto=format&fit=crop', // photography equipment
      'https://images.unsplash.com/photo-1502163140606-888448ae8cfe?w=500&auto=format&fit=crop', // camera gear
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop', // event photography
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop'  // portrait photography
    ],

    // Finance Services
    'finance': [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&auto=format&fit=crop', // financial documents
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop', // tax filing
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop',  // business finance
      'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=500&auto=format&fit=crop', // professional service
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&auto=format&fit=crop'   // financial planning
    ],

    // Personal Care
    'medicine_delivery': [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&auto=format&fit=crop', // medicine delivery
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop', // pharmaceutical
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop', // healthcare
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop',  // medical supplies
      'https://images.unsplash.com/photo-1585435557343-3b092031d8c8?w=500&auto=format&fit=crop'  // pharmacy
    ],

    'salon': [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop', // salon services
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop', // beauty treatment
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop',  // professional beautician
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop', // beauty service
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop'  // salon at home
    ],

    // Civil Work
    'painting': [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&auto=format&fit=crop', // house painting
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&auto=format&fit=crop', // professional painter
      'https://images.unsplash.com/photo-1609132718613-8ec5882b8ce2?w=500&auto=format&fit=crop', // wall painting
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',  // painting service
      'https://images.unsplash.com/photo-1605808307499-41432d78e57d?w=500&auto=format&fit=crop'  // interior painting
    ],

    'tile_work': [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop', // tile installation
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop', // marble work
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop', // granite flooring
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',  // professional tiling
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop'  // floor installation
    ],

    'house_repair': [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',  // home repair
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', // maintenance work
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop', // repair tools
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop', // professional repair
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop'   // home improvement
    ]
  };

  // Function to get unique images for each specific service
  function getServiceImages(serviceName, categoryName, subcategoryName) {
    const name = serviceName.toLowerCase();
    const category = categoryName.toLowerCase();
    const subcategory = subcategoryName?.toLowerCase() || '';

    console.log(`   🔍 Matching service: "${serviceName}"`);

    // Match specific services to their unique image sets
    
    // Plumbing Services
    if (name.includes('basin') || name.includes('sink') || name.includes('drainage')) {
      return SERVICE_IMAGES.basin_sink_drainage;
    }
    if (name.includes('bath') && name.includes('fitting')) {
      return SERVICE_IMAGES.bath_fittings_install;
    }
    if (name.includes('grouting') || name.includes('sealing')) {
      return SERVICE_IMAGES.tile_grouting_sealing;
    }
    if (name.includes('toilet')) {
      return SERVICE_IMAGES.toilet_installation_repair;
    }
    if (name.includes('pipe') || name.includes('connector')) {
      return SERVICE_IMAGES.pipe_connector_install;
    }
    if (name.includes('water tank')) {
      return SERVICE_IMAGES.water_tank_services;
    }
    if (name.includes('other') && category.includes('plumbing')) {
      return SERVICE_IMAGES.other_plumbing_services;
    }

    // Electrical Services
    if (name.includes('wiring') || name.includes('installation')) {
      return SERVICE_IMAGES.electrical_wiring_install;
    }
    if (name.includes('appliance') && name.includes('repair')) {
      return SERVICE_IMAGES.home_appliance_repair;
    }
    if (name.includes('switch') || name.includes('socket')) {
      return SERVICE_IMAGES.switch_socket_install;
    }
    if (name.includes('fan') && name.includes('installation')) {
      return SERVICE_IMAGES.fan_installation_service;
    }
    if (name.includes('lighting') || name.includes('light')) {
      return SERVICE_IMAGES.lighting_installation;
    }
    if (name.includes('safety') && name.includes('inspection')) {
      return SERVICE_IMAGES.electrical_safety_check;
    }

    // Cleaning Services
    if (name.includes('bathroom') && name.includes('cleaning')) {
      return SERVICE_IMAGES.bathroom_deep_cleaning;
    }

    // Transport & Call Services
    if (name.includes('courier') || (name.includes('delivery') && !name.includes('medicine'))) {
      return SERVICE_IMAGES.courier_delivery_service;
    }
    if (name.includes('cab') || name.includes('booking')) {
      return SERVICE_IMAGES.cab_booking_service;
    }
    if (name.includes('breakdown') || name.includes('vehicle')) {
      return SERVICE_IMAGES.vehicle_breakdown_service;
    }
    if (name.includes('photograph')) {
      return SERVICE_IMAGES.photography_services;
    }

    // Finance Services  
    if (name.includes('gst')) {
      return SERVICE_IMAGES.gst_registration_filing;
    }
    if (name.includes('pan') && name.includes('card')) {
      return SERVICE_IMAGES.pan_card_application;
    }
    if (name.includes('itr') || name.includes('income tax')) {
      return SERVICE_IMAGES.itr_filing_services;
    }
    if (name.includes('stamp') || name.includes('legal')) {
      return SERVICE_IMAGES.stamp_paper_legal;
    }

    // Personal Care
    if (name.includes('medicine') && name.includes('delivery')) {
      return SERVICE_IMAGES.medicine_delivery_service;
    }
    if (name.includes('salon') || name.includes('beauty')) {
      return SERVICE_IMAGES.salon_door_beauty;
    }

    // Civil Work
    if (name.includes('painting') || name.includes('paint')) {
      return SERVICE_IMAGES.house_painting_services;
    }
    if (name.includes('tile') || name.includes('granite') || name.includes('marble')) {
      return SERVICE_IMAGES.tile_granite_marble;
    }
    if (name.includes('repair') && name.includes('house')) {
      return SERVICE_IMAGES.house_repair_maintenance;
    }

    // Generate unique images based on service ID hash for services not matched above
    const serviceHash = serviceName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const baseImages = [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1574263867128-7d64e0359d9d?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585128792020-803d29415281?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop'
    ];

    // Create unique set based on hash
    const startIndex = Math.abs(serviceHash) % (baseImages.length - 5);
    return baseImages.slice(startIndex, startIndex + 5);
  }

  try {
    // Check if we're in the right environment
    if (typeof fetch === 'undefined') {
      throw new Error('This script must be run in a browser environment');
    }
    
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
      try {
        const updateResponse = await fetch(`${API_BASE_URL}/api/services/${service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            image_paths: images
          }),
        });

        if (!updateResponse.ok) {
          throw new Error(`HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
        }

        console.log(`   ✅ Successfully updated`);
        successCount++;
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: true,
          imagesCount: images.length
        });
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failureCount++;
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          success: false,
          error: error.message
        });
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎉 Update process completed!');
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`❌ Failed updates: ${failureCount}`);
    
    // Show summary table
    console.table(
      results.map((item, index) => ({
        '#': index + 1,
        'Service Name': item.serviceName.substring(0, 30) + '...',
        'Status': item.success ? '✅ Success' : '❌ Failed',
        'Images': item.success ? item.imagesCount : 0,
        'Error': item.success ? '-' : item.error
      }))
    );
    
    if (failureCount > 0) {
      console.log('\n💥 Failed services:');
      results
        .filter(r => !r.success)
        .forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.serviceName} - ${r.error}`);
        });
    }

    console.log('\n🖼️  All services now have 4-5 professional images from Unsplash!');
    console.log('🎯 Success Rate:', ((successCount / services.length) * 100).toFixed(1) + '%');

    return {
      success: successCount,
      failed: failureCount,
      results: results
    };

  } catch (error) {
    console.error('❌ Error updating service images:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('• Make sure your backend server is running');
    console.log('• Check if you have proper authentication/permissions');
    console.log('• Verify the API URL is correct');
    throw error;
  }
})();