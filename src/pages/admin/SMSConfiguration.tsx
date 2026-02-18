import React, { useState, useEffect } from 'react';
import { 
  FiSettings, FiAlertTriangle, FiCheckCircle, FiXCircle, 
  FiCopy, FiRefreshCw, FiEye, FiEyeOff,
  FiDollarSign, FiMapPin
} from 'react-icons/fi';

interface SMSProvider {
  name: string;
  type: string;
  configured: boolean;
  enabled: boolean;
  cost_per_sms: string;
  coverage: string;
  config_fields: ConfigField[];
}

interface ConfigField {
  name: string;
  value: string;
  required: boolean;
}

interface SMSConfigStatus {
  mock_mode: boolean;
  sms_providers: { [key: string]: SMSProvider };
  email_provider: { [key: string]: SMSProvider };
  mock_settings: {
    enabled: boolean;
    simulate_failures: boolean;
    failure_rate: string;
  };
  recommendations: string[];
  setup_instructions: Record<string, unknown>;
}

interface SetupGuideOption {
  title: string;
  provider: string;
  description?: string;
  steps?: string[];
}

interface SetupGuide {
  quick_start: SetupGuideOption[];
  [key: string]: unknown;
}

const SMSConfiguration: React.FC = () => {
  const [status, setStatus] = useState<SMSConfigStatus | null>(null);
  const [setupGuide, setSetupGuide] = useState<SetupGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnvVars, setShowEnvVars] = useState<{ [key: string]: boolean }>({});
  const [showGuide, setShowGuide] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchSMSConfig();
    fetchSetupGuide();
  }, []);

  const fetchSMSConfig = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sms-config/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);
      } else {
        console.error('Failed to fetch SMS configuration status');
      }
    } catch (error) {
      console.error('Error fetching SMS configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSetupGuide = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sms-config/setup-guide`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setSetupGuide(result.data);
      }
    } catch (error) {
      console.error('Error fetching setup guide:', error);
    }
  };

  const toggleEnvVars = (providerId: string) => {
    setShowEnvVars(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getProviderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'twilio':
        return '📞';
      case 'textlocal':
        return '🇮🇳';
      case 'teleo':
        return '📱';
      case 'aws sns':
        return '☁️';
      case 'sendgrid':
        return '📧';
      default:
        return '📨';
    }
  };

  const getRecommendationColor = (text: string) => {
    if (text.includes('🔴')) return 'border-red-200 bg-red-50 text-red-800';
    if (text.includes('🟡')) return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    if (text.includes('🟢')) return 'border-green-200 bg-green-50 text-green-800';
    if (text.includes('💰')) return 'border-blue-200 bg-blue-50 text-blue-800';
    return 'border-gray-200 bg-gray-50 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiXCircle className="mx-auto text-4xl mb-2" />
          Failed to load SMS configuration
        </div>
        <button
          onClick={fetchSMSConfig}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight">SMS Configuration Dashboard</h1>
              <p className="text-white/80 text-lg">Configure and manage SMS and email provider settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Providers */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-blue-100 mb-2">SMS Providers</p>
              <p className="text-2xl font-bold text-white mb-2 animate-pulse">
                {Object.values(status.sms_providers).filter(p => p.configured).length}
              </p>
              <p className="text-xs text-blue-200">Configured</p>
            </div>
          </div>
        </div>

        {/* Active Providers */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-green-100 mb-2">Active Providers</p>
              <p className="text-2xl font-bold text-white mb-2 animate-pulse">
                {Object.values(status.sms_providers).filter(p => p.configured && p.enabled).length}
              </p>
              <p className="text-xs text-green-200">Ready to Send</p>
            </div>
          </div>
        </div>

        {/* Mock Mode Status */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className={`relative overflow-hidden bg-gradient-to-br rounded-xl p-6 text-center ${
            status.mock_mode 
              ? 'from-yellow-500 via-yellow-600 to-orange-600' 
              : 'from-green-500 via-green-600 to-emerald-600'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.mock_mode ? "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                </div>
              </div>
              <p className={`text-sm font-medium mb-2 ${
                status.mock_mode ? 'text-yellow-100' : 'text-green-100'
              }`}>Mode Status</p>
              <p className="text-2xl font-bold text-white mb-2 animate-pulse">
                {status.mock_mode ? '🧪' : '✅'}
              </p>
              <p className={`text-xs ${
                status.mock_mode ? 'text-yellow-200' : 'text-green-200'
              }`}>
                {status.mock_mode ? 'Mock Mode' : 'Production'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Provider */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-purple-100 mb-2">Email Provider</p>
              <p className="text-2xl font-bold text-white mb-2 animate-pulse">
                {Object.values(status.email_provider).filter(p => p.configured && p.enabled).length > 0 ? '📧' : '❌'}
              </p>
              <p className="text-xs text-purple-200">
                {Object.values(status.email_provider).filter(p => p.configured && p.enabled).length > 0 ? 'Active' : 'Not Setup'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Provider Configuration Status</h3>
            <p className="text-sm text-gray-600">View and manage SMS and email provider settings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all duration-200 font-semibold shadow-md"
            >
              <FiSettings className="text-lg" />
              Setup Guide
            </button>
            <button
              onClick={fetchSMSConfig}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-gray-500 hover:to-gray-600 transition-all duration-200 font-semibold shadow-md"
            >
              <FiRefreshCw className="text-lg" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Mock Mode Alert */}
      {status.mock_mode && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-lg">
              <FiAlertTriangle className="text-xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-yellow-900 font-bold text-xl mb-3">
                Mock Mode Active
              </h3>
              <p className="text-orange-700 mb-3">
                Notifications are being simulated. Configure SMS (Twilio, TextLocal, Teleo) and Email (SendGrid) 
                providers in environment variables to enable real sending.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowGuide(true)}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                >
                  View Setup Guide
                </button>
                <button
                  onClick={() => document.getElementById('providers-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-orange-600 border border-orange-600 px-3 py-1 rounded text-sm hover:bg-orange-50"
                >
                  Configure Providers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">SMS Providers</h3>
            <div className={`w-3 h-3 rounded-full ${
              Object.values(status.sms_providers).some(p => p.configured && p.enabled) 
                ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <p className="text-sm text-gray-600">
            {Object.values(status.sms_providers).filter(p => p.configured && p.enabled).length} of{' '}
            {Object.keys(status.sms_providers).length} configured
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Email Provider</h3>
            <div className={`w-3 h-3 rounded-full ${
              status.email_provider.sendgrid?.configured && status.email_provider.sendgrid?.enabled 
                ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <p className="text-sm text-gray-600">
            {status.email_provider.sendgrid?.configured && status.email_provider.sendgrid?.enabled 
              ? 'SendGrid configured' : 'Not configured'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Mode</h3>
            <div className={`w-3 h-3 rounded-full ${status.mock_mode ? 'bg-orange-500' : 'bg-green-500'}`} />
          </div>
          <p className="text-sm text-gray-600">
            {status.mock_mode ? 'Mock (Development)' : 'Production Ready'}
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
          <div className="space-y-2">
            {status.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${getRecommendationColor(rec)}`}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Providers Configuration */}
      <div id="providers-section" className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Status</h2>
        
        {/* SMS Providers */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-800 mb-3">SMS Providers</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(status.sms_providers).map(([key, provider]) => (
              <div key={key} className="bg-white rounded-lg border">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                        <p className="text-sm text-gray-500">{provider.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.configured && provider.enabled ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : (
                        <FiXCircle className="text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {provider.configured && provider.enabled ? 'Active' : 'Not Configured'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <FiDollarSign className="text-gray-400" />
                      <span>{provider.cost_per_sms}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMapPin className="text-gray-400" />
                      <span>{provider.coverage}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span>{provider.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-700">Environment Variables</h5>
                      <button
                        onClick={() => toggleEnvVars(key)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {showEnvVars[key] ? <FiEyeOff /> : <FiEye />}
                        {showEnvVars[key] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    
                    {showEnvVars[key] && (
                      <div className="space-y-2">
                        {provider.config_fields.map((field, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                            <div className="flex items-center gap-2 flex-1">
                              <code className="text-sm font-mono text-gray-700">{field.name}</code>
                              <span className="text-xs text-gray-500">
                                {field.required ? '(required)' : '(optional)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-1 py-0.5 rounded ${
                                field.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {field.value ? 'Set' : 'Missing'}
                              </span>
                              {field.value && (
                                <button
                                  onClick={() => copyToClipboard(`${field.name}=${field.value}`, field.name)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy environment variable"
                                >
                                  {copiedField === field.name ? <FiCheckCircle className="text-green-500" /> : <FiCopy />}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Provider */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-3">Email Provider</h3>
          <div className="bg-white rounded-lg border p-4">
            {Object.entries(status.email_provider).map(([key, provider]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getProviderIcon(provider.name)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-500">{provider.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.configured && provider.enabled ? (
                      <FiCheckCircle className="text-green-500" />
                    ) : (
                      <FiXCircle className="text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {provider.configured && provider.enabled ? 'Active' : 'Not Configured'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-700">Environment Variables</h5>
                    <button
                      onClick={() => toggleEnvVars(key)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {showEnvVars[key] ? <FiEyeOff /> : <FiEye />}
                      {showEnvVars[key] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showEnvVars[key] && (
                    <div className="space-y-2">
                      {provider.config_fields.map((field, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                          <div className="flex items-center gap-2 flex-1">
                            <code className="text-sm font-mono text-gray-700">{field.name}</code>
                            <span className="text-xs text-gray-500">
                              {field.required ? '(required)' : '(optional)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              field.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {field.value ? 'Set' : 'Missing'}
                            </span>
                            {field.value && (
                              <button
                                onClick={() => copyToClipboard(`${field.name}=${field.value}`, field.name)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy environment variable"
                              >
                                {copiedField === field.name ? <FiCheckCircle className="text-green-500" /> : <FiCopy />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup Guide Modal */}
      {showGuide && setupGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">SMS Provider Setup Guide</h2>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Quick Start Options */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Quick Start Options</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {setupGuide.quick_start.map((option: SetupGuideOption, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{option.title}</h4>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {option.provider}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Setup time:</span>
                          <span>{option.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium">{option.cost}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Steps:</p>
                        <ol className="text-sm space-y-1">
                          {option.steps.map((step: string, stepIndex: number) => (
                            <li key={stepIndex} className="flex">
                              <span className="text-gray-400 mr-2">{stepIndex + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environment Variables Template */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Environment Variables Template</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Add to backend/.env file:</span>
                    <button
                      onClick={() => {
                        const envTemplate = Object.values(setupGuide.env_template).flat().join('\n');
                        copyToClipboard(envTemplate, 'env-template');
                      }}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      {copiedField === 'env-template' ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  {Object.entries(setupGuide.env_template).map(([provider, vars]: [string, string[]]) => (
                    <div key={provider} className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium capitalize"># {provider}</h4>
                        <button
                          onClick={() => copyToClipboard(vars.join('\n'), provider)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {copiedField === provider ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs bg-white border rounded p-2 font-mono">
                        {vars.join('\n')}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSConfiguration;