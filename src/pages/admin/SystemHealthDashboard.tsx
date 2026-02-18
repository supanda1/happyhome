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
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 rounded-2xl p-8 text-white shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3 tracking-tight">System Health Monitor</h1>
            <p className="text-gray-300 text-lg">Real-time monitoring of all services and infrastructure components</p>
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
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-200 font-semibold backdrop-blur-sm border border-white/20 hover:border-white/30"
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className={`bg-gradient-to-br ${getStatusColor(systemHealth.overall)} rounded-xl p-6 text-center text-white shadow-lg`}>
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Overall Status</h3>
              <div className="text-4xl font-bold mb-2">
                {systemHealth.overall.toUpperCase()}
              </div>
              <p className="text-sm opacity-90">System Health</p>
            </div>
          </div>

          {/* Total Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-center text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Total Services</h3>
              <div className="text-4xl font-bold mb-2">{systemHealth.totalServices}</div>
              <p className="text-sm opacity-90">Monitored</p>
            </div>
          </div>

          {/* Healthy Services */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-center text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Healthy Services</h3>
              <div className="text-4xl font-bold mb-2">{systemHealth.healthyServices}</div>
              <p className="text-sm opacity-90">Running Properly</p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-6 text-center text-white shadow-lg">
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Active Alerts</h3>
              <div className="text-4xl font-bold mb-2">{alerts.length}</div>
              <p className="text-sm opacity-90">Need Attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Application Health Section */}
      {systemHealth && (
        <>
          {(() => {
            // Separate application services from container services
            const applicationServices = systemHealth.services.filter(service => 
              !service.name.toLowerCase().includes('container:') && 
              !service.name.toLowerCase().includes('myapp_')
            );
            const infrastructureServices = systemHealth.services.filter(service => 
              service.name.toLowerCase().includes('container:') || 
              service.name.toLowerCase().includes('myapp_')
            );

            return (
              <>
                {/* Application Health */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2 tracking-tight">
                          Application Health
                        </h3>
                        <p className="text-blue-100 text-lg">
                          Core application services - Frontend, Backend API, Database
                        </p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                          <span className="text-sm text-blue-100 font-medium">Healthy</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                          <span className="text-sm text-blue-100 font-medium">Warning</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <span className="text-sm text-blue-100 font-medium">Error</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {applicationServices.map((service, index) => (
                        <div
                          key={`app-${index}`}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg mb-2">{service.name}</h4>
                              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${getStatusColor(service.status)} shadow-sm`}>
                                {service.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {service.responseTime && (
                              <div className="bg-white/70 rounded-lg p-3">
                                <div className="text-sm text-gray-600">
                                  Response Time: <span className="font-bold text-blue-700">{service.responseTime}ms</span>
                                </div>
                              </div>
                            )}

                            {service.url && (
                              <div className="bg-white/50 rounded-lg p-3">
                                <div className="text-xs text-gray-600 break-all font-mono">
                                  {service.url}
                                </div>
                              </div>
                            )}

                            {service.error && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="text-sm text-red-700 font-medium">
                                  {service.error}
                                </div>
                              </div>
                            )}

                            {service.details && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <details className="text-gray-600">
                                  <summary className="cursor-pointer font-semibold text-sm">Technical Details</summary>
                                  <pre className="mt-2 text-xs overflow-auto bg-white rounded p-2 font-mono">
                                    {JSON.stringify(service.details, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 bg-white/60 rounded-lg p-2">
                              Last checked: <span className="font-medium">{new Date(service.lastChecked).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Infrastructure Health */}
                {infrastructureServices.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-8 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold mb-2 tracking-tight">
                            Infrastructure Health
                          </h3>
                          <p className="text-purple-100 text-lg">
                            Docker containers and infrastructure components
                          </p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                            <span className="text-sm text-purple-100 font-medium">Healthy</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                            <span className="text-sm text-purple-100 font-medium">Warning</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <span className="text-sm text-purple-100 font-medium">Error</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {infrastructureServices.map((service, index) => (
                          <div
                            key={`infra-${index}`}
                            className="bg-gradient-to-br from-gray-50 to-purple-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{service.name}</h4>
                                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${getStatusColor(service.status)} shadow-sm`}>
                                  {service.status.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {service.responseTime && (
                                <div className="bg-white/70 rounded-lg p-3">
                                  <div className="text-sm text-gray-600">
                                    Response Time: <span className="font-bold text-purple-700">{service.responseTime}ms</span>
                                  </div>
                                </div>
                              )}

                              {service.url && (
                                <div className="bg-white/50 rounded-lg p-3">
                                  <div className="text-xs text-gray-600 break-all font-mono">
                                    {service.url}
                                  </div>
                                </div>
                              )}

                              {service.error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                  <div className="text-sm text-red-700 font-medium">
                                    {service.error}
                                  </div>
                                </div>
                              )}

                              {service.details && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <details className="text-gray-600">
                                    <summary className="cursor-pointer font-semibold text-sm">Technical Details</summary>
                                    <pre className="mt-2 text-xs overflow-auto bg-white rounded p-2 font-mono">
                                      {JSON.stringify(service.details, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 bg-white/60 rounded-lg p-2">
                                Last checked: <span className="font-medium">{new Date(service.lastChecked).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 px-8 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">Active Alerts</h3>
                <p className="text-red-100 text-lg">{alerts.length} alerts require attention</p>
              </div>
              <button
                onClick={clearAllResolvedAlerts}
                className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition-all duration-200 font-semibold backdrop-blur-sm border border-white/20 hover:border-white/30"
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
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <h5 className="text-sm font-bold text-blue-900 mb-2">Suggested Fix</h5>
                          <p className="text-sm text-blue-800">{alert.suggestedFix}</p>
                        </div>
                      )}

                      {alert.actionRequired && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h5 className="text-sm font-bold text-orange-900 mb-2">Action Required</h5>
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
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900 mb-3 tracking-tight">All Systems Operational</h3>
          <p className="text-emerald-700 text-lg">No active alerts. All services are running smoothly.</p>
        </div>
      )}
    </div>
  );
};

export default SystemHealthDashboard;