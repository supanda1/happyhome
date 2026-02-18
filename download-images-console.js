/**
 * Browser Console Script - Download Service Images
 * 
 * Instructions:
 * 1. Open your browser and navigate to your application
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to execute
 * 
 * This will download 4-5 images for each service from free websites.
 */

(async function downloadServiceImages() {
  console.log('🚀 Starting service images download...');
  
  const API_BASE_URL = 'http://localhost:8001'; // Backend is running on port 8001
  
  try {
    // Check if we're in the right environment
    if (typeof fetch === 'undefined') {
      throw new Error('This script must be run in a browser environment');
    }
    
    console.log('📡 Sending bulk download request...');
    
    const response = await fetch(`${API_BASE_URL}/services/images/bulk-download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        image_count: 5  // Download 5 images per service
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Bulk download completed successfully!');
    console.log(`📊 Summary: ${result.success} successful, ${result.failed} failed`);
    
    // Display detailed results
    if (result.results && result.results.length > 0) {
      console.log('\n📋 Detailed Results:');
      console.table(
        result.results.map((item, index) => ({
          '#': index + 1,
          'Service Name': item.serviceName,
          'Status': item.success ? '✅ Success' : '❌ Failed',
          'Images Downloaded': item.images?.length || 0,
          'Service ID': item.serviceId
        }))
      );
      
      // Show success rate
      const successRate = ((result.success / result.results.length) * 100).toFixed(1);
      console.log(`\n🎯 Success Rate: ${successRate}%`);
      
      if (result.success > 0) {
        console.log(`\n🖼️  Total images downloaded: ${result.results.reduce((sum, item) => sum + (item.images?.length || 0), 0)}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error downloading service images:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('• Make sure your backend server is running');
    console.log('• Check if the API URL is correct');
    console.log('• Verify you have proper authentication/permissions');
    throw error;
  }
})();