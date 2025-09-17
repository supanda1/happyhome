import React, { useState } from 'react';
import WhatsAppButton from '../ui/WhatsAppButton';

/**
 * WhatsApp Integration Test Component
 * Use this component to test all WhatsApp functionality before production
 */
const WhatsAppTester: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${result}`]);
  };

  const handleSuccess = (testName: string) => {
    addResult(`✅ ${testName} - SUCCESS`);
  };

  const handleError = (testName: string, error: Error) => {
    addResult(`❌ ${testName} - ERROR: ${error.message}`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test cases for different scenarios
  const testCases = [
    {
      name: 'Valid Indian Number',
      phone: '9437341234',
      message: 'Test message for valid number'
    },
    {
      name: 'Invalid Number (Short)', 
      phone: '123456',
      message: 'Test message for invalid short number'
    },
    {
      name: 'Invalid Number (Wrong Start)',
      phone: '1234567890', 
      message: 'Test message for invalid starting digit'
    },
    {
      name: 'Long Message Test',
      phone: '9437341234',
      message: 'This is a very long message that exceeds the normal length to test message truncation functionality. '.repeat(50)
    },
    {
      name: 'Special Characters',
      phone: '9437341234',
      message: 'Test with special chars: @#$%^&*()_+{}|:"<>?[]\\;\',./'
    }
  ];

  if (!isVisible) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
          title="Open WhatsApp Tester (Development Only)"
        >
          📱 WhatsApp Tester
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">📱 WhatsApp Integration Tester</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-green-700 rounded px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Test Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Variant Tests</h3>
              
              <div className="space-y-2">
                <WhatsAppButton
                  variant="inline"
                  phoneNumber="9437341234"
                  message="Testing inline variant"
                  onSuccess={() => handleSuccess('Inline Variant')}
                  onError={(error) => handleError('Inline Variant', error)}
                >
                  Inline Button
                </WhatsAppButton>

                <WhatsAppButton
                  variant="icon"
                  phoneNumber="9437341234" 
                  message="Testing icon variant"
                  onSuccess={() => handleSuccess('Icon Variant')}
                  onError={(error) => handleError('Icon Variant', error)}
                />

                <div className="text-xs text-gray-600">
                  Floating variant visible in bottom-right corner
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Size Tests</h3>
              
              <WhatsAppButton
                size="sm"
                variant="inline"
                phoneNumber="9437341234"
                message="Testing small size"
                onSuccess={() => handleSuccess('Small Size')}
                onError={(error) => handleError('Small Size', error)}
              >
                Small
              </WhatsAppButton>

              <WhatsAppButton
                size="md"
                variant="inline"
                phoneNumber="9437341234"
                message="Testing medium size"
                onSuccess={() => handleSuccess('Medium Size')}
                onError={(error) => handleError('Medium Size', error)}
              >
                Medium
              </WhatsAppButton>

              <WhatsAppButton
                size="lg"
                variant="inline"
                phoneNumber="9437341234"
                message="Testing large size"
                onSuccess={() => handleSuccess('Large Size')}
                onError={(error) => handleError('Large Size', error)}
              >
                Large
              </WhatsAppButton>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">State Tests</h3>
              
              <WhatsAppButton
                variant="inline"
                phoneNumber="9437341234"
                message="Testing enabled state"
                onSuccess={() => handleSuccess('Enabled State')}
                onError={(error) => handleError('Enabled State', error)}
              >
                Enabled
              </WhatsAppButton>

              <WhatsAppButton
                variant="inline"
                phoneNumber="9437341234"
                message="Testing disabled state"
                disabled={true}
                onSuccess={() => handleSuccess('Disabled State')}
                onError={(error) => handleError('Disabled State', error)}
              >
                Disabled
              </WhatsAppButton>
            </div>
          </div>

          {/* Automated Test Cases */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Automated Test Cases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {testCases.map((testCase, index) => (
                <WhatsAppButton
                  key={index}
                  variant="inline"
                  phoneNumber={testCase.phone}
                  message={testCase.message}
                  onSuccess={() => handleSuccess(testCase.name)}
                  onError={(error) => handleError(testCase.name, error)}
                  className="text-xs"
                >
                  {testCase.name}
                </WhatsAppButton>
              ))}
            </div>
          </div>

          {/* Test Results */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Test Results</h3>
              <button
                onClick={clearResults}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Clear Results
              </button>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-3 max-h-40 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 text-sm">Click any WhatsApp button above to see test results...</p>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-xs font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manual Testing Checklist */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Manual Testing Checklist</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>□ Test on mobile device (WhatsApp app vs web)</div>
              <div>□ Test with popup blocker enabled</div>
              <div>□ Test without WhatsApp installed</div>
              <div>□ Test keyboard navigation (Tab key)</div>
              <div>□ Test screen reader compatibility</div>
              <div>□ Test with different admin phone numbers</div>
              <div>□ Verify message formatting and encoding</div>
              <div>□ Check console for errors/warnings</div>
            </div>
          </div>

          {/* Current Environment Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Environment:</strong> {window.location.hostname} | 
            <strong> User Agent:</strong> {navigator.userAgent.slice(0, 100)}...
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppTester;