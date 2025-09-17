/**
 * Health Monitor Hook - React Hook for System Health Monitoring
 * 
 * Provides real-time health status and alerts for admin users
 */

import { useState, useEffect, useCallback } from 'react';
import { healthMonitor } from '../services/healthMonitor';
import type { SystemHealth, HealthAlert } from '../services/healthMonitor';

interface HealthMonitorState {
  systemHealth: SystemHealth | null;
  alerts: HealthAlert[];
  isMonitoring: boolean;
  loading: boolean;
  lastUpdate: Date | null;
}

interface HealthMonitorActions {
  startMonitoring: (interval?: number) => void;
  stopMonitoring: () => void;
  refreshHealth: () => Promise<void>;
  resolveAlert: (alertId: string) => void;
  clearResolvedAlerts: () => void;
  getServiceStatus: (serviceName: string) => 'healthy' | 'warning' | 'error' | 'unknown';
  getCriticalAlerts: () => HealthAlert[];
  getHealthSummary: () => {
    overall: string;
    criticalIssues: number;
    totalServices: number;
    healthyServices: number;
  };
}

export type UseHealthMonitorReturn = HealthMonitorState & HealthMonitorActions;

/**
 * React Hook for Health Monitoring
 */
export const useHealthMonitor = (): UseHealthMonitorReturn => {
  const [state, setState] = useState<HealthMonitorState>({
    systemHealth: null,
    alerts: [],
    isMonitoring: false,
    loading: false,
    lastUpdate: null
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<HealthMonitorState> | ((prev: HealthMonitorState) => Partial<HealthMonitorState>)) => {
    setState(prev => ({ 
      ...prev, 
      ...(typeof updates === 'function' ? updates(prev) : updates) 
    }));
  }, []);

  // Load initial health data
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      try {
        updateState({ loading: true });
        
        const health = await healthMonitor.getCurrentHealth();
        const alerts = healthMonitor.getActiveAlerts();
        
        if (mounted) {
          updateState({
            systemHealth: health,
            alerts,
            isMonitoring: healthMonitor.isActive(),
            loading: false,
            lastUpdate: new Date()
          });
        }
      } catch (error) {
        console.error('Failed to load initial health data:', error);
        if (mounted) {
          updateState({ loading: false });
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [updateState]);

  // Subscribe to health updates
  useEffect(() => {
    const unsubscribeHealth = healthMonitor.subscribe((health: SystemHealth) => {
      updateState({
        systemHealth: health,
        lastUpdate: new Date()
      });
    });

    const unsubscribeAlerts = healthMonitor.subscribeToAlerts((alert: HealthAlert) => {
      updateState((prev: HealthMonitorState) => ({
        alerts: [...(prev.alerts || []), alert]
      }));
      
      // Show browser notification for critical alerts
      if (alert.severity === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`🚨 Critical System Alert`, {
            body: `${alert.service}: ${alert.message}`,
            icon: '/favicon.ico',
            requireInteraction: true
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(`🚨 Critical System Alert`, {
                body: `${alert.service}: ${alert.message}`,
                icon: '/favicon.ico',
                requireInteraction: true
              });
            }
          });
        }
      }
    });

    return () => {
      unsubscribeHealth();
      unsubscribeAlerts();
    };
  }, [updateState]);

  // Actions
  const startMonitoring = useCallback((interval: number = 30000) => {
    healthMonitor.startMonitoring(interval);
    updateState({ isMonitoring: true });
  }, [updateState]);

  const stopMonitoring = useCallback(() => {
    healthMonitor.stopMonitoring();
    updateState({ isMonitoring: false });
  }, [updateState]);

  const refreshHealth = useCallback(async () => {
    try {
      updateState({ loading: true });
      const health = await healthMonitor.getCurrentHealth();
      const alerts = healthMonitor.getActiveAlerts();
      
      updateState({
        systemHealth: health,
        alerts,
        loading: false,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Failed to refresh health data:', error);
      updateState({ loading: false });
    }
  }, [updateState]);

  const resolveAlert = useCallback((alertId: string) => {
    healthMonitor.resolveAlert(alertId);
    updateState((prev: HealthMonitorState) => ({
      alerts: prev.alerts.filter((alert: HealthAlert) => alert.id !== alertId)
    }));
  }, [updateState]);

  const clearResolvedAlerts = useCallback(() => {
    healthMonitor.clearResolvedAlerts();
    updateState({ alerts: healthMonitor.getActiveAlerts() });
  }, [updateState]);

  const getServiceStatus = useCallback((serviceName: string): 'healthy' | 'warning' | 'error' | 'unknown' => {
    if (!state.systemHealth) return 'unknown';
    
    const service = state.systemHealth.services.find(s => 
      s.name.toLowerCase().includes(serviceName.toLowerCase())
    );
    
    return service?.status || 'unknown';
  }, [state.systemHealth]);

  const getCriticalAlerts = useCallback((): HealthAlert[] => {
    return state.alerts.filter(alert => 
      alert.severity === 'critical' && !alert.resolved
    );
  }, [state.alerts]);

  const getHealthSummary = useCallback(() => {
    if (!state.systemHealth) {
      return {
        overall: 'unknown',
        criticalIssues: 0,
        totalServices: 0,
        healthyServices: 0
      };
    }

    return {
      overall: state.systemHealth.overall,
      criticalIssues: getCriticalAlerts().length,
      totalServices: state.systemHealth.totalServices,
      healthyServices: state.systemHealth.healthyServices
    };
  }, [state.systemHealth, getCriticalAlerts]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    refreshHealth,
    resolveAlert,
    clearResolvedAlerts,
    getServiceStatus,
    getCriticalAlerts,
    getHealthSummary
  };
};

/**
 * Health Status Indicator Hook for UI Components
 */
export const useHealthStatus = () => {
  const { systemHealth, getCriticalAlerts } = useHealthMonitor();
  
  const getStatusColor = useCallback(() => {
    if (!systemHealth) return 'gray';
    
    switch (systemHealth.overall) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  }, [systemHealth]);

  const getStatusIcon = useCallback(() => {
    if (!systemHealth) return '❓';
    
    switch (systemHealth.overall) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '🚨';
      default:
        return '❓';
    }
  }, [systemHealth]);

  const hasAlerts = useCallback(() => {
    return getCriticalAlerts().length > 0;
  }, [getCriticalAlerts]);

  return {
    statusColor: getStatusColor(),
    statusIcon: getStatusIcon(),
    hasAlerts: hasAlerts(),
    criticalAlertsCount: getCriticalAlerts().length,
    overallStatus: systemHealth?.overall || 'unknown'
  };
};

export default useHealthMonitor;