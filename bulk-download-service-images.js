/**
 * Bulk Download Service Images Script
 * 
 * This script downloads 4-5 proper related images for all services
 * from free websites using the backend Pexels API integration.
 */

const API_BASE_URL = 'http://localhost:8001';  // Backend is running on port 8001

async function bulkDownloadServiceImages() {
  console.log('🚀 Starting bulk download of service images...');
  
  try {
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Bulk download completed!');
    console.log(`📊 Results: ${result.success} successful, ${result.failed} failed`);
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 Detailed results:');
      result.results.forEach((item, index) => {
        const status = item.success ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${item.serviceName} - ${item.images?.length || 0} images`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Bulk download failed:', error.message);
    throw error;
  }
}

// For Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bulkDownloadServiceImages };
}

// For browser environment
if (typeof window !== 'undefined') {
  window.bulkDownloadServiceImages = bulkDownloadServiceImages;
}

// If run directly
if (typeof require !== 'undefined' && require.main === module) {
  bulkDownloadServiceImages()
    .then(() => {
      console.log('🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}