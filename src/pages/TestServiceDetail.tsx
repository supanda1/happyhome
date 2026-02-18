import React from 'react';

interface TestServiceDetailProps {
  serviceId?: string;
  onNavigateHome?: () => void;
}

const TestServiceDetail: React.FC<TestServiceDetailProps> = ({ 
  serviceId, 
  onNavigateHome 
}) => {
  console.log('🧪 TEST COMPONENT RENDERED with serviceId:', serviceId);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ✅ TEST SERVICE DETAIL PAGE WORKS!
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-lg mb-4">
            <strong>Service ID:</strong> {serviceId || 'No service ID provided'}
          </p>
          
          <p className="text-gray-600 mb-4">
            This is a minimal test component to verify that navigation is working.
          </p>
          
          <button
            onClick={() => {
              console.log('🏠 Test navigate home clicked');
              onNavigateHome?.();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Home (Test)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestServiceDetail;