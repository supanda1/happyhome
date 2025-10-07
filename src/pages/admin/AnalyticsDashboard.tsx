import React, { useState, useEffect, useCallback } from 'react';

// Custom CSS for enhanced animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-in {
    0% { transform: translateY(-100px); opacity: 0; }
    50% { transform: translateY(0px); opacity: 1; }
    65% { transform: translateY(-10px); }
    81% { transform: translateY(0px); }
    100% { transform: translateY(0px); opacity: 1; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
  }
  
  @keyframes slide-down {
    from { 
      opacity: 0; 
      max-height: 0; 
      transform: translateY(-10px); 
    }
    to { 
      opacity: 1; 
      max-height: 1000px; 
      transform: translateY(0); 
    }
  }
  
  @keyframes slide-up {
    from { 
      opacity: 1; 
      max-height: 1000px; 
      transform: translateY(0); 
    }
    to { 
      opacity: 0; 
      max-height: 0; 
      transform: translateY(-10px); 
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }
  
  .animate-bounce-in {
    animation: bounce-in 0.8s ease-out;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s infinite;
  }
  
  .animate-slide-down {
    animation: slide-down 0.4s ease-out forwards;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-in forwards;
  }
  
  .chart-container {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    padding: 16px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  }
`;
import { 
  getAnalyticsOverview,
  exportAnalyticsData,
  getCategories,
  getSubcategories,
  type AnalyticsOverview,
  type TimePeriod,
  type TimeSeriesPoint,
  type Category,
  type Subcategory
} from '../../utils/adminDataManager';

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Toggle category collapse state
  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Toggle all categories collapse state
  const toggleAllCategories = () => {
    const allCategoryIds = (analyticsData?.topCategories || []).map((cat, index) => 
      cat.categoryId || `category-${index}`
    );
    
    // If all categories are collapsed, expand all; otherwise collapse all
    const allCollapsed = allCategoryIds.every(id => collapsedCategories.has(id));
    
    if (allCollapsed) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(allCategoryIds));
    }
  };

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setExportSuccess(''); // Clear any previous success messages
    
    try {
      console.log(`📊 Fetching analytics data from backend API for period: ${selectedPeriod}`);
      
      // Backend-first approach: Load all data from APIs with proper error handling
      const [analyticsResult, categoriesResult, subcategoriesResult] = await Promise.allSettled([
        getAnalyticsOverview(selectedPeriod),
        getCategories(),
        getSubcategories()
      ]);
      
      // Handle analytics data
      if (analyticsResult.status === 'fulfilled') {
        setAnalyticsData(analyticsResult.value);
        console.log('✅ Analytics data loaded from backend successfully');
      } else {
        console.warn('⚠️ Analytics backend API not available - no analytics data loaded');
        setAnalyticsData(null);
      }
      
      // Handle categories data
      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value);
        console.log(`✅ Categories loaded: ${categoriesResult.value.length} categories`);
      } else {
        console.warn('⚠️ Categories API failed:', categoriesResult.reason);
        setCategories([]);
      }
      
      // Handle subcategories data  
      if (subcategoriesResult.status === 'fulfilled') {
        setSubcategories(subcategoriesResult.value);
        console.log(`✅ Subcategories loaded: ${subcategoriesResult.value.length} subcategories`);
      } else {
        console.warn('⚠️ Subcategories API failed:', subcategoriesResult.reason);
        setSubcategories([]);
      }
      
      // Log final status
      const totalCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.length : 0;
      const totalSubcategories = subcategoriesResult.status === 'fulfilled' ? subcategoriesResult.value.length : 0;
      console.log(`📊 Analytics dashboard loaded with ${totalCategories} categories and ${totalSubcategories} subcategories`);
      
    } catch (error) {
      console.error('❌ Critical error loading analytics dashboard:', error);
      setAnalyticsData(null);
      setCategories([]);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, loadAnalyticsData]);

  // Production-grade backend export functionality
  const handleExportData = async (format: 'csv' | 'excel') => {
    if (!analyticsData) {
      console.warn('📊 No analytics data available for export');
      alert('No data available to export. Please wait for data to load.');
      return;
    }

    setIsExporting(true);
    try {
      console.log(`📊 Requesting ${format.toUpperCase()} export from backend for period: ${selectedPeriod}`);
      
      // Use backend API for production-grade export
      const blob = await exportAnalyticsData(format, selectedPeriod);
      
      // Create download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `happy-homes-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ Successfully exported ${format.toUpperCase()} file from backend`);
      setExportSuccess(`${format.toUpperCase()} report downloaded successfully!`);
      
      // Clear success message after 4 seconds
      setTimeout(() => {
        setExportSuccess('');
      }, 4000);
      
    } catch (error) {
      console.error('❌ Backend export failed:', error);
      
      // Production-grade error handling - no client-side fallback for security
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      
      if (errorMessage.includes('404') || errorMessage.includes('Route not found')) {
        alert('Export functionality is currently unavailable. The analytics export API endpoint needs to be implemented on the backend server.');
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        alert('You do not have permission to export analytics data. Please check your admin credentials.');
      } else {
        alert(`Export failed: ${errorMessage}. Please contact technical support if the issue persists.`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Enhanced bar chart component with animations and tooltips
  const BarChart: React.FC<{ data: { name: string; value: number; color: string }[]; maxValue: number }> = ({ data, maxValue }) => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-24 text-xs font-medium text-gray-700 truncate">{item.name}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div
              className="h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color
              }}
            >
              <span className="text-xs font-bold text-white">₹{(item.value / 1000).toFixed(0)}k</span>
            </div>
          </div>
          <div className="w-16 text-xs text-gray-600 text-right">₹{(item.value || 0).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );

  // Simple line chart using SVG
  const LineChart: React.FC<{ data: TimeSeriesPoint[] }> = ({ data }) => {
    // Handle empty or undefined data
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">No chart data available</div>
          </div>
        </div>
      );
    }

    const maxRevenue = Math.max(...data.map(d => d.value || 0));
    const width = 400;
    const height = 200;
    const padding = 40;

    const points = data.map((point, index) => ({
      x: padding + (index * (width - 2 * padding)) / (data.length - 1),
      y: height - padding - (((point.value || 0) / maxRevenue) * (height - 2 * padding))
    }));

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1={padding}
            y1={padding + i * (height - 2 * padding) / 4}
            x2={width - padding}
            y2={padding + i * (height - 2 * padding) / 4}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="2"
          />
        ))}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        
        {/* Labels */}
        {data.map((point, index) => (
          <text
            key={index}
            x={points[index].x}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {point.date ? point.date.split('-')[1] : ''}
          </text>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-border mx-auto mb-6"></div>
            <div className="absolute inset-2 bg-white rounded-full"></div>
            <div className="absolute inset-3 animate-pulse bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
          </div>
          <div className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            Loading Analytics Dashboard...
          </div>
          <div className="text-sm text-gray-500 mt-2">Fetching your business insights</div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="text-gray-800 text-xl font-semibold mb-2">Analytics Backend Not Available</div>
          <div className="text-gray-600 mb-4">
            The analytics data cannot be loaded because the backend API endpoints are not implemented yet.
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <div className="font-semibold mb-2">Required Backend Endpoints:</div>
            <ul className="text-left space-y-1">
              <li>• GET /api/analytics/overview</li>
              <li>• GET /api/analytics/export</li>
              <li>• GET /api/categories</li>
              <li>• GET /api/subcategories</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 animate-fade-in p-6">
      {/* Welcome Section - Enhanced Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight">Analytics Dashboard</h1>
              <p className="text-white/80 text-lg">Comprehensive revenue breakdown and analytics by service categories</p>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="flex items-center space-x-6 mt-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90">Live Data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white/90">Real-time Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-white/90">Business Intelligence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Selector & Export Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">Time Period & Export</h3>
            <p className="text-gray-500 text-sm">Analyze data across different time periods and export reports</p>
          </div>
            
            {/* Export Buttons - Enhanced */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting || !analyticsData}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">{isExporting ? '⏳' : '📊'}</span>
                <span className="relative z-10">{isExporting ? 'GENERATING...' : 'EXPORT CSV'}</span>
              </button>
              <button
                onClick={() => handleExportData('excel')}
                disabled={isExporting || !analyticsData}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">{isExporting ? '⏳' : '📈'}</span>
                <span className="relative z-10">{isExporting ? 'GENERATING...' : 'EXPORT EXCEL'}</span>
              </button>
            </div>
          </div>

          {/* Export Success Message - Enhanced */}
          {exportSuccess && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl flex items-center space-x-3 shadow-sm animate-bounce-in">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-semibold">{exportSuccess}</p>
                <p className="text-sm text-green-600">Report ready for download</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`group relative px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl overflow-hidden ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white shadow-violet-500/30'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border border-gray-200 hover:shadow-lg'
                }`}
              >
                {selectedPeriod === period && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                )}
                <span className="relative z-10">
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </span>
                {selectedPeriod === period && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
      </div>

      {/* KPI Cards - Enhanced with animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue - Enhanced */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-emerald-100 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">₹{analyticsData?.totalRevenue?.toLocaleString() || '0'}</p>
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${(analyticsData?.monthlyGrowth || 0) >= 0 ? 'bg-green-300' : 'bg-red-300'} animate-pulse`}></div>
                <p className="text-xs text-emerald-200">
                  {(analyticsData?.monthlyGrowth || 0) > 0 ? '+' : ''}{analyticsData?.monthlyGrowth?.toFixed(1) || 0}% monthly growth
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders - Enhanced */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-blue-100 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">{analyticsData?.totalOrders?.toLocaleString() || '0'}</p>
              <p className="text-xs text-blue-200">Active Bookings</p>
            </div>
          </div>
        </div>

        {/* Average Order Value - Enhanced */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-purple-100 mb-2">Avg Order Value</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">₹{analyticsData?.avgOrderValue?.toLocaleString() || '0'}</p>
              <p className="text-xs text-purple-200">Per Transaction</p>
            </div>
          </div>
        </div>

        {/* Top Category - Enhanced */}
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-orange-100 mb-2">Top Category</p>
              <p className="text-xl font-bold text-white mb-2 truncate">{analyticsData?.topCategories?.[0]?.category || 'N/A'}</p>
              <p className="text-xs text-orange-200">₹{analyticsData?.topCategories?.[0]?.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* System Coverage Statistics - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m10 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1m10 0V6a2 2 0 00-2-2" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-indigo-100 mb-2">Total Categories</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">{categories.length || analyticsData?.topCategories?.length || 0}</p>
              <p className="text-xs text-indigo-200">Service Categories Available</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 via-emerald-600 to-green-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-teal-100 mb-2">Total Subcategories</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">
                {subcategories.length || 0}
              </p>
              <p className="text-xs text-teal-200">Specialized Services</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-1 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
          <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 rounded-xl p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-rose-100 mb-2">Revenue-Generating Services</p>
              <p className="text-3xl font-bold text-white mb-2 animate-pulse">
                {analyticsData?.topCategories?.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0) || 
                 analyticsData?.topServices?.length || 
                 categories.length || '0'}
              </p>
              <div className="flex items-center justify-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  (analyticsData?.topCategories?.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0) || 
                   analyticsData?.topServices?.length || 
                   categories.length || 0) > 0 
                    ? 'bg-green-300' 
                    : 'bg-yellow-300'
                }`}></div>
                <p className="text-xs text-rose-200">
                  {(analyticsData?.topCategories?.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0) || 
                    analyticsData?.topServices?.length || 
                    categories.length || 0) > 0 
                    ? 'Services With Active Orders' 
                    : 'No Revenue Generated Yet'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Charts Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Trend Chart - Enhanced */}
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Revenue Trend</h3>
              <p className="text-gray-500 text-sm mt-1">Monthly revenue performance</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <LineChart data={(analyticsData?.timeSeriesData || []).map(point => ({
              ...point,
              value: point.revenue || point.value || 0
            }))} />
          </div>
        </div>

        {/* Top Categories Chart - Enhanced */}
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Revenue by Category</h3>
              <p className="text-gray-500 text-sm mt-1">Top performing service categories</p>
            </div>
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <BarChart 
              data={(analyticsData?.topCategories || []).map((cat, index) => ({
                name: cat.category || 'Unknown',
                value: cat.totalRevenue || 0,
                color: ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#f97316', '#ef4444', '#8b5a2b'][index % 8]
              }))}
              maxValue={Math.max(...(analyticsData?.topCategories || []).map(cat => cat.totalRevenue || 0), 1)}
            />
          </div>
        </div>
      </div>

      {/* Detailed Category Breakdown - Enhanced */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Detailed Category Breakdown</h3>
              <p className="text-gray-500 mt-1">Complete performance analysis by service categories and subcategories</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>{analyticsData?.topCategories?.length || 0} categories</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${collapsedCategories.size > 0 ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                    <span className="text-xs">
                      {collapsedCategories.size > 0 
                        ? `${collapsedCategories.size} collapsed` 
                        : 'all expanded'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={toggleAllCategories}
                className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                title={(() => {
                  const allCategoryIds = (analyticsData?.topCategories || []).map((cat, index) => 
                    cat.categoryId || `category-${index}`
                  );
                  const allCollapsed = allCategoryIds.every(id => collapsedCategories.has(id));
                  return allCollapsed ? 'Expand all categories' : 'Collapse all categories';
                })()}
              >
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${(() => {
                    const allCategoryIds = (analyticsData?.topCategories || []).map((cat, index) => 
                      cat.categoryId || `category-${index}`
                    );
                    const allCollapsed = allCategoryIds.every(id => collapsedCategories.has(id));
                    return allCollapsed ? 'rotate-180' : 'rotate-0';
                  })()}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-sm font-medium">
                  {(() => {
                    const allCategoryIds = (analyticsData?.topCategories || []).map((cat, index) => 
                      cat.categoryId || `category-${index}`
                    );
                    const allCollapsed = allCategoryIds.every(id => collapsedCategories.has(id));
                    return allCollapsed ? 'Expand All' : 'Collapse All';
                  })()}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {(analyticsData?.topCategories || []).map((category, index) => (
            <div key={category.category || `category-${index}`} className="mb-8 last:mb-0">
              
              {/* Category Header - Enhanced */}
              <div className="group relative overflow-hidden mb-6 p-6 bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m10 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1m10 0V6a2 2 0 00-2-2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">{category.category || 'Unknown Category'}</h4>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <p className="text-sm text-gray-600 font-medium">{category.totalOrders || 0} orders</p>
                        </div>
                        {category.growth !== 0 && (
                          <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                            category.growth > 0 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            <svg className={`w-3 h-3 ${category.growth > 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.growth > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                            </svg>
                            <span>{category.growth > 0 ? '+' : ''}{category.growth.toFixed(1)}% growth</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₹{(category.totalRevenue || 0).toLocaleString()}</div>
                      <div className="text-sm font-medium text-gray-500 mt-1">
                        Category Revenue
                      </div>
                    </div>
                    
                    {/* Collapse/Expand Button */}
                    <button
                      onClick={() => toggleCategoryCollapse(category.categoryId || `category-${index}`)}
                      className="group/btn p-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-indigo-500 hover:to-purple-600 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
                      title={collapsedCategories.has(category.categoryId || `category-${index}`) ? 'Expand category details' : 'Collapse category details'}
                    >
                      <svg 
                        className={`w-5 h-5 text-gray-600 group-hover/btn:text-white transition-all duration-300 transform ${
                          collapsedCategories.has(category.categoryId || `category-${index}`) 
                            ? 'rotate-0' 
                            : 'rotate-180'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Content */}
              {!collapsedCategories.has(category.categoryId || `category-${index}`) && (
                <div className="animate-slide-down overflow-hidden">
                  {/* Category Details - Enhanced */}
                  <div className="ml-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-emerald-800">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">₹{(category.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-blue-800">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{category.totalOrders || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-purple-800">Avg Order Value</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">₹{Math.round((category.totalRevenue || 0) / (category.totalOrders || 1))}</p>
                  </div>
                </div>
              </div>

              {/* Subcategories Breakdown - Enhanced */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="ml-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h5 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-indigo-700 bg-clip-text text-transparent">Subcategories Performance</h5>
                    <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                      {category.subcategories.length} subcategories
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.subcategories.map((sub, subIndex) => (
                      <div key={sub.subcategoryId || `sub-${subIndex}`} className="group relative bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="font-bold text-gray-900 text-sm truncate flex-1 mr-2">{sub.name}</h6>
                            {sub.growth !== 0 && (
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                                sub.growth > 0 
                                  ? 'bg-green-100 text-green-600 border border-green-200' 
                                  : 'bg-red-100 text-red-600 border border-red-200'
                              }`}>
                                <svg className={`w-3 h-3 ${sub.growth > 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sub.growth > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                                </svg>
                                <span>{sub.growth > 0 ? '+' : ''}{sub.growth.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">₹{sub.revenue.toLocaleString()}</div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-600 font-medium">{sub.orders} orders</span>
                              </div>
                              <div className="text-gray-500 font-medium">
                                Avg: ₹{Math.round(sub.revenue / (sub.orders || 1))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
        </div>
      </div>
    </>
  );
};

export default AnalyticsDashboard;