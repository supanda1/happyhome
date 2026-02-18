import React, { useState } from 'react';
import Button from '../ui/Button';
import { bulkDownloadAllServiceImages } from '../../utils/adminDataManager';

interface DownloadResult {
  serviceId: string;
  serviceName: string;
  images: string[];
  success: boolean;
}

interface BulkDownloadResult {
  success: number;
  failed: number;
  results: DownloadResult[];
}

export const BulkImageDownloader: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<BulkDownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚀 Starting bulk download of service images...');
      
      const downloadResult = await bulkDownloadAllServiceImages(5); // Download 5 images per service
      
      setResult(downloadResult);
      console.log('✅ Bulk download completed:', downloadResult);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Bulk download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Service Images Manager
        </h2>
        <p className="text-gray-600">
          Download high-quality images for all services from free stock photo websites.
          Each service will get 4-5 professional, relevant images.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleBulkDownload}
          disabled={isDownloading}
          className="w-full sm:w-auto"
          size="lg"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Downloading Images...
            </>
          ) : (
            'Download Images for All Services'
          )}
        </Button>

        {isDownloading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              📥 Downloading images... This may take a few minutes.
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Please keep this tab open and wait for completion.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">❌ Download Failed</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-3">
              ✅ Bulk Download Completed!
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {result.results && result.results.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-2">Detailed Results:</h4>
                <div className="space-y-1">
                  {result.results.map((item) => (
                    <div
                      key={item.serviceId}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        item.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">
                          {item.success ? '✅' : '❌'}
                        </span>
                        <span className="font-medium">{item.serviceName}</span>
                      </span>
                      <span className="text-xs">
                        {item.images?.length || 0} images
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">ℹ️ How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Downloads high-quality images from free stock photo websites</li>
            <li>• Each service gets 4-5 relevant, professional images</li>
            <li>• Images are automatically saved and linked to services</li>
            <li>• All images are properly licensed for commercial use</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkImageDownloader;