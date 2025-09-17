import React, { useState, useEffect } from 'react';
import { FiPlus, FiSettings, FiTrash2, FiSend, FiCheck, FiX, FiEdit, FiEye } from 'react-icons/fi';

interface SMSProvider {
  id: string;
  name: string;
  provider_type: 'twilio' | 'textlocal' | 'teleo' | 'aws_sns' | 'mock';
  description?: string;
  is_enabled: boolean;
  is_primary: boolean;
  priority: number;
  total_sent: number;
  total_failed: number;
  success_rate: number;
  cost_per_sms?: number;
  current_balance?: number;
  last_used_at?: string;
  created_at: string;
}

interface ProviderConfig {
  [key: string]: string | boolean | number;
}

const SMSProviders: React.FC = () => {
  const [providers, setProviders] = useState<SMSProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SMSProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<SMSProvider | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    provider_type: 'twilio' as const,
    description: '',
    is_enabled: false,
    is_primary: false,
    priority: 1,
    cost_per_sms: 0,
    daily_limit: 1000,
    rate_limit_per_minute: 60
  });

  const [config, setConfig] = useState<ProviderConfig>({});
  const [testData, setTestData] = useState({
    test_phone: '',
    test_message: ''
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sms-providers`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        setProviders(result.data || []);
      } else {
        console.error('Failed to fetch SMS providers');
      }
    } catch (error) {
      console.error('Error fetching SMS providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        config_data: config
      };

      const url = editingProvider ? `${import.meta.env.VITE_API_BASE_URL}/sms-providers/${editingProvider.id}` : `${import.meta.env.VITE_API_BASE_URL}/sms-providers`;
      const method = editingProvider ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchProviders();
        resetForm();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving SMS provider:', error);
      alert('Failed to save SMS provider');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS provider?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sms-providers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchProviders();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting SMS provider:', error);
      alert('Failed to delete SMS provider');
    }
  };

  const handleTest = async (providerId: string) => {
    if (!testData.test_phone) {
      alert('Please enter a test phone number');
      return;
    }

    try {
      setTestingProvider(providerId);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/sms-providers/${providerId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Test SMS sent successfully!\n\nProvider: ${result.data.provider_name}\nPhone: ${result.data.test_phone}\nTime: ${new Date(result.data.timestamp).toLocaleString()}`);
      } else {
        alert(`Test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error testing SMS provider:', error);
      alert('Failed to test SMS provider');
    } finally {
      setTestingProvider(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider_type: 'twilio',
      description: '',
      is_enabled: false,
      is_primary: false,
      priority: 1,
      cost_per_sms: 0,
      daily_limit: 1000,
      rate_limit_per_minute: 60
    });
    setConfig({});
    setEditingProvider(null);
  };

  const startEdit = (provider: SMSProvider) => {
    setFormData({
      name: provider.name,
      provider_type: provider.provider_type,
      description: provider.description || '',
      is_enabled: provider.is_enabled,
      is_primary: provider.is_primary,
      priority: provider.priority,
      cost_per_sms: provider.cost_per_sms || 0,
      daily_limit: 1000, // Default, would need to fetch from API
      rate_limit_per_minute: 60
    });
    setEditingProvider(provider);
    setShowForm(true);
  };

  const getProviderTypeIcon = (type: string) => {
    switch (type) {
      case 'twilio':
        return '📞';
      case 'textlocal':
        return '🇮🇳';
      case 'teleo':
        return '📱';
      case 'aws_sns':
        return '☁️';
      case 'mock':
        return '🧪';
      default:
        return '📨';
    }
  };

  const getConfigFields = (providerType: string) => {
    switch (providerType) {
      case 'twilio':
        return [
          { key: 'account_sid', label: 'Account SID', type: 'text', required: true },
          { key: 'auth_token', label: 'Auth Token', type: 'password', required: true },
          { key: 'from_number', label: 'From Number', type: 'tel', required: true }
        ];
      case 'textlocal':
        return [
          { key: 'api_key', label: 'API Key', type: 'password', required: true },
          { key: 'sender', label: 'Sender ID (6 chars)', type: 'text', required: true, maxLength: 6 },
          { key: 'use_hash_auth', label: 'Use Hash Authentication', type: 'checkbox', required: false },
          { key: 'username', label: 'Username (for hash auth)', type: 'text', required: false },
          { key: 'hash_key', label: 'Hash Key (for hash auth)', type: 'password', required: false }
        ];
      case 'teleo':
        return [
          { key: 'username', label: 'Username', type: 'text', required: true },
          { key: 'password', label: 'Password', type: 'password', required: true },
          { key: 'sender_id', label: 'Sender ID (6 chars)', type: 'text', required: true, maxLength: 6 },
          { key: 'base_url', label: 'Base URL (optional)', type: 'url', required: false }
        ];
      case 'aws_sns':
        return [
          { key: 'access_key_id', label: 'Access Key ID', type: 'text', required: true },
          { key: 'secret_access_key', label: 'Secret Access Key', type: 'password', required: true },
          { key: 'region', label: 'AWS Region', type: 'text', required: true }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📱 SMS Providers Management</h1>
        <p className="text-orange-100">Configure and manage SMS service providers for customer notifications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Providers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Providers</p>
            <p className="text-4xl font-bold text-white">{providers.length}</p>
            <p className="text-xs text-blue-200 mt-2">Configured</p>
          </div>
        </div>

        {/* Active Providers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active Providers</p>
            <p className="text-4xl font-bold text-white">{providers.filter(p => p.is_enabled).length}</p>
            <p className="text-xs text-green-200 mt-2">Ready to Send</p>
          </div>
        </div>

        {/* Total Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Total Sent</p>
            <p className="text-4xl font-bold text-white">{providers.reduce((sum, p) => sum + p.total_sent, 0)}</p>
            <p className="text-xs text-purple-200 mt-2">SMS Messages</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Avg Success Rate</p>
            <p className="text-4xl font-bold text-white">
              {providers.length > 0 ? Math.round(providers.reduce((sum, p) => sum + p.success_rate, 0) / providers.length) : 0}%
            </p>
            <p className="text-xs text-orange-200 mt-2">Delivery Rate</p>
          </div>
        </div>

      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Provider Configuration</h3>
            <p className="text-sm text-gray-600">Manage SMS service providers and their settings</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all duration-200 font-semibold shadow-md"
          >
            <FiPlus className="text-lg" />
            Add New Provider
          </button>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SMS Provider Status</h3>
              <p className="text-sm text-gray-600">{providers.length} providers configured</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Active Providers</div>
              <div className="text-lg font-semibold text-gray-900">
                {providers.filter(p => p.is_enabled).length} / {providers.length}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-md ${
                  provider.is_primary 
                    ? 'border-green-500 ring-2 ring-green-200 ring-opacity-50' 
                    : provider.is_enabled
                    ? 'border-blue-200 hover:border-blue-400'
                    : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 bg-gray-100 rounded-lg">
                      {getProviderTypeIcon(provider.provider_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{provider.name}</h3>
                      <p className="text-sm text-gray-500 capitalize font-medium">
                        {provider.provider_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {provider.is_primary && (
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                        ⭐ Primary
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${provider.is_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs font-medium text-gray-600">
                        {provider.is_enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {provider.description && (
                  <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">{provider.description}</p>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-blue-600 mb-1">Messages Sent</div>
                    <div className="text-lg font-bold text-blue-900">{provider.total_sent.toLocaleString()}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-red-600 mb-1">Failed</div>
                    <div className="text-lg font-bold text-red-900">{provider.total_failed.toLocaleString()}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-green-600 mb-1">Success Rate</div>
                    <div className="text-lg font-bold text-green-900">{provider.success_rate.toFixed(1)}%</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-orange-600 mb-1">Cost per SMS</div>
                    <div className="text-lg font-bold text-orange-900">₹{provider.cost_per_sms?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>

                {provider.last_used_at && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <span className="font-medium">Last used:</span> {new Date(provider.last_used_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(provider)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                      title="Edit Provider"
                    >
                      <FiEdit />
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedProvider(provider)}
                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                      title="View Details"
                    >
                      <FiEye />
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1"
                      title="Delete Provider"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleTest(provider.id)}
                    disabled={!provider.is_enabled || testingProvider === provider.id}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm"
                    title="Send Test SMS"
                  >
                    {testingProvider === provider.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <FiSend />
                        Test SMS
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {providers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No SMS Providers Configured</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by adding your first SMS provider. Configure TextLocal for India (₹0.25/SMS) 
              or Twilio for global coverage (₹1.20/SMS).
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 font-semibold shadow-md"
            >
              Add Your First Provider
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingProvider ? 'Edit SMS Provider' : 'Add SMS Provider'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Type *
                    </label>
                    <select
                      value={formData.provider_type}
                      onChange={(e) => {
                        setFormData({...formData, provider_type: e.target.value as any});
                        setConfig({}); // Reset config when provider type changes
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="twilio">Twilio (Global)</option>
                      <option value="textlocal">TextLocal (India)</option>
                      <option value="teleo">Teleo (India)</option>
                      <option value="aws_sns">AWS SNS</option>
                      <option value="mock">Mock (Development)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={2}
                  />
                </div>

                {/* Provider Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Provider Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getConfigFields(formData.provider_type).map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label} {field.required && '*'}
                        </label>
                        {field.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={Boolean(config[field.key])}
                            onChange={(e) => setConfig({...config, [field.key]: e.target.checked})}
                            className="rounded border-gray-300"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={config[field.key] || ''}
                            onChange={(e) => setConfig({...config, [field.key]: e.target.value})}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            required={field.required}
                            maxLength={field.maxLength}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1 = highest)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost per SMS (₹)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.cost_per_sms}
                      onChange={(e) => setFormData({...formData, cost_per_sms: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_enabled}
                      onChange={(e) => setFormData({...formData, is_enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enable Provider
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_primary}
                      onChange={(e) => setFormData({...formData, is_primary: e.target.checked})}
                      className="mr-2"
                    />
                    Set as Primary Provider
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingProvider ? 'Update Provider' : 'Create Provider'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <h3 className="font-medium text-gray-900 mb-3">Test SMS</h3>
        <div className="space-y-2">
          <input
            type="tel"
            placeholder="Test phone number (+91xxxxxxxxxx)"
            value={testData.test_phone}
            onChange={(e) => setTestData({...testData, test_phone: e.target.value})}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Custom test message (optional)"
            value={testData.test_message}
            onChange={(e) => setTestData({...testData, test_message: e.target.value})}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default SMSProviders;