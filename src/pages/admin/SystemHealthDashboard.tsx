import React, { useState, useEffect, useCallback } from 'react';
import { healthMonitor } from '../../services/healthMonitor';
import type { SystemHealth, ServiceHealth, HealthAlert } from '../../services/healthMonitor';

interface SystemHealthDashboardProps {
  className?: string;
}

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ className = '' }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load initial health data
  useEffect(() => {
    let mounted = true;

    const loadHealthData = async () => {
      try {
        setLoading(true);
        const health = await healthMonitor.getCurrentHealth();
        if (mounted) {
          setSystemHealth(health);
          setAlerts(healthMonitor.getActiveAlerts());
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('Failed to load health data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHealthData();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to health updates
  useEffect(() => {
    const unsubscribeHealth = healthMonitor.subscribe((health: SystemHealth) => {
      setSystemHealth(health);
      setLastRefresh(new Date());
    });

    const unsubscribeAlerts = healthMonitor.subscribeToAlerts((alert: HealthAlert) => {
      setAlerts(prev => [...prev, alert]);
    });

    return () => {
      unsubscribeHealth();
      unsubscribeAlerts();
    };
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      setLoading(true);
      const health = await healthMonitor.getCurrentHealth();
      setSystemHealth(health);
      setAlerts(healthMonitor.getActiveAlerts());
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh health data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    healthMonitor.resolveAlert(alertId);
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllResolvedAlerts = useCallback(() => {
    healthMonitor.clearResolvedAlerts();
    setAlerts(healthMonitor.getActiveAlerts());
  }, []);

  const getStatusIcon = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <span className="text-green-500 text-2xl">●</span>;
      case 'warning':
        return <span className="text-yellow-500 text-2xl">●</span>;
      case 'error':
        return <span className="text-red-500 text-2xl">●</span>;
      default:
        return <span className="text-gray-400 text-2xl">●</span>;
    }
  };

  const getStatusColor = (status: ServiceHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'from-green-500 to-emerald-600';
      case 'warning':
        return 'from-yellow-500 to-orange-600';
      case 'error':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getAlertSeverityColor = (severity: HealthAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'from-red-600 to-rose-700 ring-red-200';
      case 'high':
        return 'from-orange-500 to-red-600 ring-orange-200';
      case 'medium':
        return 'from-yellow-500 to-orange-600 ring-yellow-200';
      default:
        return 'from-blue-500 to-indigo-600 ring-blue-200';
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔍 System Health Monitor</h1>
            <p className="text-purple-100">Real-time monitoring of all services and infrastructure components</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <button
              onClick={refreshHealth}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Overall Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className={`bg-gradient-to-r ${getStatusColor(systemHealth.overall)} rounded-lg p-4 text-center text-white`}>
              <h3 className="text-sm font-medium mb-2">Overall Status</h3>
              <div className="text-3xl font-bold mb-1">
                {systemHealth.overall.toUpperCase()}
              </div>
              <p className="text-xs opacity-90">System Health</p>
            </div>
          </div>

          {/* Total Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center text-white">
              <h3 className="text-sm font-medium mb-2">Total Services</h3>
              <div className="text-3xl font-bold mb-1">{systemHealth.totalServices}</div>
              <p className="text-xs opacity-90">Monitored</p>
            </div>
          </div>

          {/* Healthy Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-center text-white">
              <h3 className="text-sm font-medium mb-2">Healthy Services</h3>
              <div className="text-3xl font-bold mb-1">{systemHealth.healthyServices}</div>
              <p className="text-xs opacity-90">Running Properly</p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-lg p-4 text-center text-white">
              <h3 className="text-sm font-medium mb-2">Active Alerts</h3>
              <div className="text-3xl font-bold mb-1">{alerts.length}</div>
              <p className="text-xs opacity-90">Need Attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Grid */}
      {systemHealth && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Service Status</h3>
                <p className="text-gray-600 mt-1">
                  Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500 text-xl">●</span>
                  <span className="text-sm text-gray-600">Healthy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500 text-xl">●</span>
                  <span className="text-sm text-gray-600">Warning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-red-500 text-xl">●</span>
                  <span className="text-sm text-gray-600">Error</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemHealth.services.map((service, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>

                  {service.responseTime && (
                    <div className="text-sm text-gray-600 mb-2">
                      Response: <span className="font-medium">{service.responseTime}ms</span>
                    </div>
                  )}

                  {service.url && (
                    <div className="text-xs text-gray-500 mb-2 break-all">
                      {service.url}
                    </div>
                  )}

                  {service.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {service.error}
                    </div>
                  )}

                  {service.details && (
                    <div className="text-xs text-gray-500 mt-2">
                      <details>
                        <summary className="cursor-pointer">Details</summary>
                        <pre className="mt-2 text-xs overflow-auto">
                          {JSON.stringify(service.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Last checked: {new Date(service.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">🚨 Active Alerts</h3>
                <p className="text-gray-600 mt-1">{alerts.length} alerts require attention</p>
              </div>
              <button
                onClick={clearAllResolvedAlerts}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Clear Resolved
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getAlertSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-gray-900">{alert.service}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3">{alert.message}</p>

                      {alert.suggestedFix && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                          <h5 className="text-sm font-medium text-blue-900 mb-1">💡 Suggested Fix:</h5>
                          <p className="text-sm text-blue-800">{alert.suggestedFix}</p>
                        </div>
                      )}

                      {alert.actionRequired && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-3">
                          <h5 className="text-sm font-medium text-orange-900 mb-1">⚠️ Action Required:</h5>
                          <p className="text-sm text-orange-800">{alert.actionRequired}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Alerts Message */}
      {alerts.length === 0 && systemHealth && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-green-600 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">All Systems Operational</h3>
          <p className="text-green-700">No active alerts. All services are running smoothly.</p>
        </div>
      )}
    </div>
  );
};

export default SystemHealthDashboard;