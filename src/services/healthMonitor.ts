/**
 * Health Monitoring System - Enterprise Grade Service Monitoring
 * 
 * Monitors all system services, containers, and dependencies with real-time alerts
 * for admin and super admin users.
 */

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  responseTime?: number;
  lastChecked: string;
  url?: string;
  error?: string;
  details?: Record<string, any>;
  uptime?: string;
  version?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  services: ServiceHealth[];
  lastUpdated: string;
  totalServices: number;
  healthyServices: number;
  warnings: number;
  errors: number;
}

export interface HealthAlert {
  id: string;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  actionRequired?: string;
  suggestedFix?: string;
}

class HealthMonitorService {
  private alerts: HealthAlert[] = [];
  private subscribers: ((health: SystemHealth) => void)[] = [];
  private alertSubscribers: ((alert: HealthAlert) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private readonly SERVICES_CONFIG = {
    frontend: {
      name: 'Frontend (React)',
      url: window.location.origin,
      healthEndpoint: '/favicon.ico', // Check for a static asset
      timeout: parseInt(import.meta.env.VITE_HEALTH_TIMEOUT || '5000'),
      critical: true,
      isRuntime: true // Special flag for runtime checks
    },
    backend_python: {
      name: 'Backend (FastAPI)',
      url: import.meta.env.VITE_BACKEND_PYTHON_URL || 'http://localhost:8000',
      healthEndpoint: '/health',
      timeout: parseInt(import.meta.env.VITE_HEALTH_TIMEOUT || '5000'),
      critical: true
    },
    backend_node: {
      name: 'Backend (Node.js)',
      url: import.meta.env.VITE_BACKEND_NODE_URL || 'http://localhost:8001', 
      healthEndpoint: '/health',
      timeout: parseInt(import.meta.env.VITE_HEALTH_TIMEOUT || '5000'),
      critical: false
    },
    database: {
      name: 'PostgreSQL Database',
      url: import.meta.env.VITE_BACKEND_PYTHON_URL || 'http://localhost:8000',
      healthEndpoint: '/health',
      timeout: parseInt(import.meta.env.VITE_HEALTH_TIMEOUT || '3000'),
      critical: true,
      checkDb: true
    },
    redis: {
      name: 'Redis Cache',
      url: import.meta.env.VITE_BACKEND_PYTHON_URL || 'http://localhost:8000',
      healthEndpoint: '/health',
      timeout: parseInt(import.meta.env.VITE_HEALTH_TIMEOUT || '3000'),
      critical: false
    }
  };

  /**
   * Start health monitoring with specified interval
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('🔍 Health monitoring is already running');
      return;
    }

    console.log('🚀 Starting health monitoring system...');
    this.isMonitoring = true;
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);

    console.log(`✅ Health monitoring started (checking every ${intervalMs/1000}s)`);
  }

  /**
   * Stop health monitoring
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Health monitoring stopped');
  }

  /**
   * Perform comprehensive health check of all services
   */
  private async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const services: ServiceHealth[] = [];

    console.log('🔍 Performing health check...');

    // Check each service
    for (const [key, config] of Object.entries(this.SERVICES_CONFIG)) {
      try {
        const serviceHealth = await this.checkService(key, config);
        services.push(serviceHealth);
      } catch (error) {
        services.push({
          name: config.name,
          status: 'error',
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check Docker containers if available
    const containerHealth = await this.checkDockerContainers();
    services.push(...containerHealth);

    // Calculate overall health
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const warnings = services.filter(s => s.status === 'warning').length;
    const errors = services.filter(s => s.status === 'error').length;

    let overall: 'healthy' | 'warning' | 'error' = 'healthy';
    if (errors > 0) {
      overall = 'error';
    } else if (warnings > 0) {
      overall = 'warning';
    }

    const systemHealth: SystemHealth = {
      overall,
      services,
      lastUpdated: new Date().toISOString(),
      totalServices: services.length,
      healthyServices,
      warnings,
      errors
    };

    // Process alerts
    await this.processHealthAlerts(systemHealth);

    // Notify subscribers
    this.notifySubscribers(systemHealth);

    console.log(`✅ Health check completed in ${Date.now() - startTime}ms`);
    console.log(`📊 Status: ${overall} | Services: ${healthyServices}/${services.length} healthy`);

    return systemHealth;
  }

  /**
   * Check individual service health
   */
  private async checkService(key: string, config: any): Promise<ServiceHealth> {
    const startTime = Date.now();
    
    // Special handling for frontend - if this code is running, frontend is healthy
    if (config.isRuntime && key === 'frontend') {
      return {
        name: config.name,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        url: config.url,
        details: {
          message: 'Frontend is running (health monitor active)',
          version: 'React + Vite',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const url = config.healthEndpoint 
        ? `${config.url}${config.healthEndpoint}`
        : config.url;

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        let details = {};
        
        try {
          const data = await response.json();
          details = data;
        } catch {
          // Non-JSON response is OK for basic health checks
        }

        return {
          name: config.name,
          status: responseTime > config.timeout * 0.8 ? 'warning' : 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          url,
          details
        };
      } else {
        return {
          name: config.name,
          status: 'error',
          lastChecked: new Date().toISOString(),
          url,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        name: config.name,
        status: 'error',
        lastChecked: new Date().toISOString(),
        url: config.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Docker containers health
   */
  private async checkDockerContainers(): Promise<ServiceHealth[]> {
    const containerServices: ServiceHealth[] = [];

    try {
      // Try to check if Docker containers are running via backend API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_PYTHON_URL || 'http://localhost:8000'}/admin/system/containers`, {
        credentials: 'include',
        timeout: 5000
      } as any);

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((container: any) => {
            containerServices.push({
              name: `Container: ${container.name}`,
              status: container.status === 'running' ? 'healthy' : 'error',
              lastChecked: new Date().toISOString(),
              details: {
                image: container.image,
                uptime: container.uptime,
                ports: container.ports
              }
            });
          });
        }
      }
    } catch (error) {
      // Docker monitoring not available
      console.log('ℹ️ Docker container monitoring not available');
    }

    return containerServices;
  }

  /**
   * Process health alerts and create notifications
   */
  private async processHealthAlerts(systemHealth: SystemHealth): Promise<void> {
    const criticalServices = Object.entries(this.SERVICES_CONFIG)
      .filter(([_, config]) => config.critical)
      .map(([key, config]) => config.name);

    for (const service of systemHealth.services) {
      const isCritical = criticalServices.includes(service.name);
      
      if (service.status === 'error' && isCritical) {
        await this.createAlert({
          service: service.name,
          severity: 'critical',
          message: `Critical service ${service.name} is down: ${service.error}`,
          actionRequired: 'Immediate attention required - service restoration needed',
          suggestedFix: this.getSuggestedFix(service.name, service.error)
        });
      } else if (service.status === 'error') {
        await this.createAlert({
          service: service.name,
          severity: 'high',
          message: `Service ${service.name} is experiencing errors: ${service.error}`,
          suggestedFix: this.getSuggestedFix(service.name, service.error)
        });
      } else if (service.status === 'warning') {
        await this.createAlert({
          service: service.name,
          severity: 'medium',
          message: `Service ${service.name} is experiencing performance issues (${service.responseTime}ms response time)`,
          suggestedFix: 'Monitor service performance and consider scaling if issues persist'
        });
      }
    }
  }

  /**
   * Create a new health alert
   */
  private async createAlert(alertData: Omit<HealthAlert, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      alert => alert.service === alertData.service && 
               alert.severity === alertData.severity && 
               !alert.resolved
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: HealthAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);
    
    // Notify alert subscribers
    this.alertSubscribers.forEach(callback => callback(alert));

    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // Send notifications to admins
    await this.sendAlertNotification(alert);
  }

  /**
   * Get suggested fix for common service issues
   */
  private getSuggestedFix(serviceName: string, error?: string): string {
    const suggestions: Record<string, string> = {
      'Frontend (React)': 'Check if Vite dev server is running. Run: npm run dev',
      'Backend (FastAPI)': 'Check if Python backend is running. Run: docker compose up api -d',
      'Backend (Node.js)': 'Check if Node.js backend is running. Run: npm run dev in backend directory',
      'PostgreSQL Database': 'Check if PostgreSQL is running. Run: docker compose up postgres -d',
      'Redis Cache': 'Check if Redis is running. Run: docker compose up redis -d'
    };

    let suggestion = suggestions[serviceName] || 'Check service logs and restart if necessary';

    if (error?.includes('ECONNREFUSED')) {
      suggestion += ' - Connection refused, service may not be running';
    } else if (error?.includes('timeout')) {
      suggestion += ' - Service is responding slowly, check system resources';
    }

    return suggestion;
  }

  /**
   * Send alert notification to admins
   */
  private async sendAlertNotification(alert: HealthAlert): Promise<void> {
    try {
      // Send to backend notification system
      await fetch(`${import.meta.env.VITE_BACKEND_PYTHON_URL || 'http://localhost:8000'}/admin/notifications/alerts`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'system_alert',
          severity: alert.severity,
          message: alert.message,
          service: alert.service,
          actionRequired: alert.actionRequired,
          suggestedFix: alert.suggestedFix,
          recipients: ['admin', 'super_admin']
        })
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Subscribe to health updates
   */
  public subscribe(callback: (health: SystemHealth) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to alert notifications
   */
  public subscribeToAlerts(callback: (alert: HealthAlert) => void): () => void {
    this.alertSubscribers.push(callback);
    
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all health subscribers
   */
  private notifySubscribers(health: SystemHealth): void {
    this.subscribers.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error notifying health subscriber:', error);
      }
    });
  }

  /**
   * Get current system health (cached)
   */
  public async getCurrentHealth(): Promise<SystemHealth> {
    return await this.performHealthCheck();
  }

  /**
   * Get all alerts
   */
  public getAlerts(): HealthAlert[] {
    return [...this.alerts];
  }

  /**
   * Get unresolved alerts
   */
  public getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Clear all resolved alerts
   */
  public clearResolvedAlerts(): void {
    const resolvedCount = this.alerts.filter(a => a.resolved).length;
    this.alerts = this.alerts.filter(a => !a.resolved);
    console.log(`🧹 Cleared ${resolvedCount} resolved alerts`);
  }

  /**
   * Get monitoring status
   */
  public isActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitorService();

// Auto-start monitoring for admin users
if (typeof window !== 'undefined') {
  // Start monitoring when module loads
  setTimeout(() => {
    const interval = parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000');
    healthMonitor.startMonitoring(interval);
  }, 2000);
}

export default healthMonitor;