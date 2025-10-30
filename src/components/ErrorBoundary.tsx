import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary details:', { error, errorInfo });
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided, otherwise default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-red-600 mb-6">🚨 Component Error Detected</h1>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-red-800 mb-4">Error Details:</h3>
              <div className="text-left bg-red-100 p-4 rounded border font-mono text-sm">
                <p className="mb-2">
                  <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
                </p>
                <p className="mb-2">
                  <strong>Stack:</strong>
                </p>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                  {this.state.error?.stack || 'No stack trace available'}
                </pre>
              </div>
              
              {this.state.errorInfo && (
                <div className="mt-4">
                  <p className="font-bold text-red-800 mb-2">Component Stack:</p>
                  <div className="text-left bg-red-100 p-4 rounded border font-mono text-xs">
                    <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                🔄 Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;