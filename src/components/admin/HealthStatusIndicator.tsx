/**
 * Health Status Indicator Component
 * 
 * Displays real-time system health status in the admin panel header
 * Shows alerts and provides quick access to health dashboard
 */

import React, { useState } from 'react';
import { useHealthStatus } from '../../hooks/useHealthMonitor';

interface HealthStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onHealthClick?: () => void;
}

const HealthStatusIndicator: React.FC<HealthStatusIndicatorProps> = ({
  className = '',
  showDetails = true,
  onHealthClick
}) => {
  const { 
    statusColor, 
    statusIcon, 
    hasAlerts, 
    criticalAlertsCount, 
    overallStatus 
  } = useHealthStatus();
  
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusColorClasses = () => {
    switch (statusColor) {
      case 'green':
        return 'bg-green-500 text-white ring-green-200';
      case 'yellow':
        return 'bg-yellow-500 text-white ring-yellow-200';
      case 'red':
        return 'bg-red-500 text-white ring-red-200 animate-pulse';
      default:
        return 'bg-gray-500 text-white ring-gray-200';
    }
  };

  const getStatusText = () => {
    switch (overallStatus) {
      case 'healthy':
        return 'All Systems Operational';
      case 'warning':
        return 'System Performance Issues';
      case 'error':
        return 'Critical System Issues';
      default:
        return 'System Status Unknown';
    }
  };

  const handleClick = () => {
    if (onHealthClick) {
      onHealthClick();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          inline-flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold text-sm
          transition-all duration-200 transform hover:scale-105 ring-2
          ${getStatusColorClasses()}
          ${onHealthClick ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
        `}
        title={getStatusText()}
      >
        <span className="text-lg">{statusIcon}</span>
        {showDetails && (
          <span className="hidden sm:inline">
            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </span>
        )}
        {hasAlerts && criticalAlertsCount > 0 && (
          <span className="bg-white text-red-600 rounded-full px-2 py-1 text-xs font-bold min-w-[20px] text-center">
            {criticalAlertsCount}
          </span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="font-semibold">{getStatusText()}</div>
            {hasAlerts && (
              <div className="text-red-300 text-xs mt-1">
                {criticalAlertsCount} critical alert{criticalAlertsCount !== 1 ? 's' : ''}
              </div>
            )}
            <div className="text-gray-300 text-xs mt-1">
              Click to view details
            </div>
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthStatusIndicator;