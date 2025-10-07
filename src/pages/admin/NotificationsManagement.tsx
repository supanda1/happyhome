import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  notification_type: 'SMS' | 'EMAIL' | 'PUSH';
  event_type: string;
  priority: string;
  subject?: string;
  message: string;
  order_number?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  event_type: string;
  notification_type: 'SMS' | 'EMAIL' | 'PUSH';
  subject_template?: string;
  message_template: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface NotificationAnalytics {
  period_days: number;
  total_notifications: number;
  success_rate_percentage: number;
  status_breakdown: Record<string, number>;
  type_breakdown: Record<string, number>;
  event_breakdown: Record<string, number>;
  generated_at: string;
}

interface NotificationsManagementProps {
  onNavigate?: (tabId: string) => void;
}

const NotificationsManagement: React.FC<NotificationsManagementProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'analytics' | 'settings'>('history');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Mock data - Replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      
      // Mock notifications data
      const mockNotifications: Notification[] = [
        {
          id: '1',
          customer_name: 'Rajesh Kumar',
          customer_phone: '+91 9876543210',
          customer_email: 'rajesh@example.com',
          notification_type: 'SMS',
          event_type: 'ORDER_PLACED',
          priority: 'HIGH',
          message: 'Hi Rajesh Kumar! Your order HH-20250913143000-A1B2C3D4 has been placed successfully.',
          order_number: 'HH-20250913143000-A1B2C3D4',
          status: 'SENT',
          sent_at: '2025-09-13T10:30:00Z',
          delivered_at: '2025-09-13T10:30:05Z',
          retry_count: 0,
          created_at: '2025-09-13T10:30:00Z'
        },
        {
          id: '2',
          customer_name: 'Priya Sharma',
          customer_email: 'priya@example.com',
          notification_type: 'EMAIL',
          event_type: 'ENGINEER_ASSIGNED',
          priority: 'NORMAL',
          subject: 'Engineer Assigned - HH-20250913143001-B1C2D3E4',
          message: 'Dear Priya Sharma, Great news! We have assigned an expert engineer to your order.',
          order_number: 'HH-20250913143001-B1C2D3E4',
          status: 'DELIVERED',
          sent_at: '2025-09-13T11:15:00Z',
          delivered_at: '2025-09-13T11:15:12Z',
          retry_count: 0,
          created_at: '2025-09-13T11:15:00Z'
        },
        {
          id: '3',
          customer_name: 'Amit Patel',
          customer_phone: '+91 8765432109',
          notification_type: 'SMS',
          event_type: 'SERVICE_COMPLETED',
          priority: 'NORMAL',
          message: 'Great news Amit Patel! Your service for order HH-20250913143002-C1D2E3F4 is completed.',
          order_number: 'HH-20250913143002-C1D2E3F4',
          status: 'FAILED',
          error_message: 'Network timeout',
          retry_count: 2,
          created_at: '2025-09-13T12:00:00Z'
        }
      ];

      // Mock templates data
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'order_placed_sms',
          event_type: 'ORDER_PLACED',
          notification_type: 'SMS',
          message_template: 'Hi {customer_name}! Your order {order_number} has been placed successfully. Total: ₹{final_amount}. - Happy Homes',
          description: 'SMS sent when customer places an order',
          is_active: true,
          created_at: '2025-09-10T00:00:00Z'
        },
        {
          id: '2',
          name: 'engineer_assigned_email',
          event_type: 'ENGINEER_ASSIGNED',
          notification_type: 'EMAIL',
          subject_template: 'Engineer Assigned - {order_number} | Happy Homes',
          message_template: 'Dear {customer_name}, Great news! We have assigned an expert engineer to your order.',
          description: 'Email sent when engineer is assigned to order',
          is_active: true,
          created_at: '2025-09-10T00:00:00Z'
        }
      ];

      // Mock analytics data
      const mockAnalytics: NotificationAnalytics = {
        period_days: 7,
        total_notifications: 145,
        success_rate_percentage: 92.4,
        status_breakdown: {
          'SENT': 89,
          'DELIVERED': 45,
          'FAILED': 8,
          'PENDING': 3
        },
        type_breakdown: {
          'SMS': 98,
          'EMAIL': 47
        },
        event_breakdown: {
          'ORDER_PLACED': 52,
          'ENGINEER_ASSIGNED': 38,
          'SERVICE_COMPLETED': 32,
          'SERVICE_SCHEDULED': 23
        },
        generated_at: '2025-09-13T14:00:00Z'
      };

      setNotifications(mockNotifications);
      setTemplates(mockTemplates);
      setAnalytics(mockAnalytics);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesStatus = statusFilter === 'all' || notification.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === 'all' || notification.notification_type.toLowerCase() === typeFilter;
    const matchesEvent = eventFilter === 'all' || notification.event_type.toLowerCase() === eventFilter;
    const matchesSearch = searchTerm === '' || 
      notification.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesEvent && matchesSearch;
  });

  // Get status badge color with gradient styling
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-700 shadow-md font-semibold';
      case 'DELIVERED':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-700 shadow-md font-semibold';
      case 'PENDING':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border border-amber-700 shadow-md font-semibold';
      case 'FAILED':
        return 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-700 shadow-md font-semibold';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-gray-600 to-gray-700 text-white border border-gray-700 shadow-md font-semibold';
      default:
        return 'bg-gray-600 text-white border border-gray-700 shadow-md';
    }
  };

  // Get status text
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': return 'SENT';
      case 'DELIVERED': return 'OK';
      case 'PENDING': return 'WAIT';
      case 'FAILED': return 'FAIL';
      case 'CANCELLED': return 'STOP';
      default: return 'UNKN';
    }
  };

  // Get notification type text and color
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS':
        return { text: 'SMS', color: 'text-blue-600' };
      case 'EMAIL':
        return { text: 'EMAIL', color: 'text-green-600' };
      case 'PUSH':
        return { text: 'PUSH', color: 'text-purple-600' };
      default:
        return { text: 'NOTIF', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 font-semibold">Loading Notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📱 Notifications Management Dashboard</h1>
        <p className="text-orange-100">Monitor and manage customer notifications across SMS and Email channels</p>
      </div>

      {/* Stats Grid */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-100 mb-2">Total Notifications</p>
              <p className="text-4xl font-bold text-white">{analytics.total_notifications}</p>
              <p className="text-xs text-blue-200 mt-2">Last 7 Days</p>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-100 mb-2">Success Rate</p>
              <p className="text-4xl font-bold text-white">{analytics.success_rate_percentage}%</p>
              <p className="text-xs text-green-200 mt-2">Delivery Rate</p>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-purple-100 mb-2">SMS Sent</p>
              <p className="text-4xl font-bold text-white">{analytics.type_breakdown.SMS || 0}</p>
              <p className="text-xs text-purple-200 mt-2">Text Messages</p>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-orange-100 mb-2">Emails Sent</p>
              <p className="text-4xl font-bold text-white">{analytics.type_breakdown.EMAIL || 0}</p>
              <p className="text-xs text-orange-200 mt-2">Email Messages</p>
            </div>
          </div>

        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'history', label: 'Notification History' },
              { key: 'templates', label: 'Templates' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'history' | 'templates' | 'analytics' | 'settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Status Filter Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'all', label: 'All Notifications', count: notifications.length, color: 'from-gray-600 to-gray-700', hoverColor: 'hover:from-gray-500 hover:to-gray-600' },
                    { key: 'pending', label: 'Pending', count: notifications.filter(n => n.status === 'PENDING').length, color: 'from-amber-600 to-yellow-600', hoverColor: 'hover:from-amber-500 hover:to-yellow-500' },
                    { key: 'sent', label: 'Sent', count: notifications.filter(n => n.status === 'SENT').length, color: 'from-blue-600 to-indigo-600', hoverColor: 'hover:from-blue-500 hover:to-indigo-500' },
                    { key: 'delivered', label: 'Delivered', count: notifications.filter(n => n.status === 'DELIVERED').length, color: 'from-green-600 to-emerald-600', hoverColor: 'hover:from-green-500 hover:to-emerald-500' },
                    { key: 'failed', label: 'Failed', count: notifications.filter(n => n.status === 'FAILED').length, color: 'from-red-600 to-rose-600', hoverColor: 'hover:from-red-500 hover:to-rose-500' },
                    { key: 'cancelled', label: 'Cancelled', count: notifications.filter(n => n.status === 'CANCELLED').length, color: 'from-gray-600 to-gray-700', hoverColor: 'hover:from-gray-500 hover:to-gray-600' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`p-4 rounded-xl text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                        statusFilter === tab.key
                          ? `bg-gradient-to-br ${tab.color} text-white shadow-lg ring-2 ring-white ring-opacity-60`
                          : `bg-gradient-to-br from-gray-50 to-white hover:bg-gradient-to-br ${tab.hoverColor} hover:text-white text-gray-700 border border-gray-200 hover:border-transparent`
                      }`}
                    >
                      <div className="text-sm font-semibold mb-2">{tab.label}</div>
                      <div className={`text-2xl font-bold ${
                        statusFilter === tab.key ? 'text-white' : 'text-gray-900'
                      }`}>
                        {tab.count}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Notifications</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search: Customer name, order number, message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="sms">SMS Only</option>
                      <option value="email">Email Only</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setEventFilter('all');
                        setSearchTerm('');
                      }}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200 font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {statusFilter === 'all' ? 'All Notifications' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Notifications`}
                      </h3>
                      <p className="text-sm text-gray-600">{filteredNotifications.length} notifications found</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Success Rate</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {analytics ? `${analytics.success_rate_percentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Notification Info
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status & Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Timing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredNotifications.map((notification) => {
                        const typeConfig = getNotificationTypeIcon(notification.notification_type);
                        
                        return (
                          <tr key={notification.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg bg-gray-100 ${typeConfig.color} text-xs font-bold`}>
                                  {typeConfig.text}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {notification.notification_type}
                                    </span>
                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                                      {notification.event_type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 truncate max-w-xs">
                                    {notification.subject || notification.message}
                                  </p>
                                </div>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.customer_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {notification.customer_phone || notification.customer_email}
                                </p>
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-blue-600 font-medium">
                                {notification.order_number || 'N/A'}
                              </span>
                            </td>
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-2">
                                <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 ${getStatusBadgeColor(notification.status)}`}>
                                  <span className="mr-1.5">{getStatusIcon(notification.status)}</span>
                                  <span className="capitalize">{notification.status.toLowerCase()}</span>
                                </div>
                                {notification.error_message && (
                                  <p className="text-xs text-red-600">
                                    {notification.error_message}
                                  </p>
                                )}
                                {notification.retry_count > 0 && (
                                  <p className="text-xs text-orange-600">
                                    Retries: {notification.retry_count}
                                  </p>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {notification.sent_at ? new Date(notification.sent_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Not sent'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📱</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'Try adjusting your filters'
                          : 'No notifications have been sent yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Notification Templates</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          template.notification_type === 'SMS' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {template.notification_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          template.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 text-xs font-medium px-2 py-1 rounded">
                        EDIT
                      </button>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    
                    {template.subject_template && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Subject:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {template.subject_template}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Message:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 max-h-20 overflow-y-auto">
                        {template.message_template}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Analytics (Last 7 days)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Delivery Status</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.status_breakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(status)}`}>
                          {status}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Type Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Notification Types</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.type_breakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{type}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Event Types</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.event_breakdown).map(([event, count]) => (
                      <div key={event} className="flex items-center justify-between">
                        <span className="text-sm">{event.replace('_', ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-yellow-800 mb-2">
                      <strong>Mock Mode Active:</strong> Notifications are being simulated. 
                      Configure SMS (Twilio, TextLocal, Teleo) and Email (SendGrid) providers to enable real sending.
                    </p>
                    <p className="text-yellow-700 text-sm">
                      Real SMS providers can reduce costs by up to 83% (₹0.25 vs ₹1.20 per SMS for Indian numbers).
                    </p>
                  </div>
                  <button 
                    onClick={() => onNavigate?.('sms-config')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 flex-shrink-0 ml-4"
                  >
                    Configure SMS
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">SMS Provider (Twilio)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Mock Mode
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Provider:</span>
                      <span>Twilio</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Email Provider (SendGrid)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Mock Mode
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Provider:</span>
                      <span>SendGrid</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagement;