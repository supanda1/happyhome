import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
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
  };

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

  // Simple bar chart component using CSS
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
          <div className="w-16 text-xs text-gray-600 text-right">₹{item.value.toLocaleString()}</div>
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

    const maxRevenue = Math.max(...data.map(d => d.value));
    const width = 400;
    const height = 200;
    const padding = 40;

    const points = data.map((point, index) => ({
      x: padding + (index * (width - 2 * padding)) / (data.length - 1),
      y: height - padding - ((point.value / maxRevenue) * (height - 2 * padding))
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
            {point.date.split('-')[1]}
          </text>
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Analytics Dashboard...</div>
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
    <div className="space-y-6">
      {/* Welcome Section - Match Dashboard Style */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-blue-100">Comprehensive revenue breakdown and analytics by service categories</p>
      </div>

      {/* Time Period Selector & Export Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-0">Time Period & Export</h3>
            
            {/* Export Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting || !analyticsData}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                <span>{isExporting ? '⏳' : '📊'}</span>
                <span>{isExporting ? 'GENERATING...' : 'EXPORT CSV'}</span>
              </button>
              <button
                onClick={() => handleExportData('excel')}
                disabled={isExporting || !analyticsData}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                <span>{isExporting ? '⏳' : '📈'}</span>
                <span>{isExporting ? 'GENERATING...' : 'EXPORT EXCEL'}</span>
              </button>
            </div>
          </div>

          {/* Export Success Message */}
          {exportSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium">{exportSuccess}</span>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            {(['daily', 'weekly', 'monthly', 'yearly'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wide transition-all transform hover:scale-105 shadow-md ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1).toUpperCase()}
              </button>
            ))}
          </div>
      </div>

      {/* KPI Cards - Match Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-emerald-100 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-white">₹{analyticsData?.totalRevenue?.toLocaleString() || '0'}</p>
            <p className="text-xs text-emerald-200 mt-2">
              {(analyticsData?.revenueGrowth || 0) > 0 ? '+' : ''}{analyticsData?.revenueGrowth || 0}% vs last period
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-white">{analyticsData?.totalOrders?.toLocaleString() || '0'}</p>
            <p className="text-xs text-blue-200 mt-2">Active Bookings</p>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Avg Order Value</p>
            <p className="text-3xl font-bold text-white">₹{analyticsData ? Math.round((analyticsData.totalRevenue || 0) / (analyticsData.totalOrders || 1)) : '0'}</p>
            <p className="text-xs text-purple-200 mt-2">Per Transaction</p>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Top Category</p>
            <p className="text-xl font-bold text-white">{analyticsData?.topCategories?.[0]?.categoryName || 'N/A'}</p>
            <p className="text-xs text-orange-200 mt-2">₹{analyticsData?.topCategories?.[0]?.revenue?.toLocaleString() || '0'}</p>
          </div>
        </div>

      </div>

      {/* System Coverage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-indigo-100 mb-2">Total Categories</p>
            <p className="text-3xl font-bold text-white">{categories.length || analyticsData?.topCategories?.length || 0}</p>
            <p className="text-xs text-indigo-200 mt-2">Service Categories Available</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-teal-100 mb-2">Total Subcategories</p>
            <p className="text-3xl font-bold text-white">
              {subcategories.length || 0}
            </p>
            <p className="text-xs text-teal-200 mt-2">Specialized Services</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-rose-100 mb-2">Coverage Scope</p>
            <p className="text-xl font-bold text-white">Complete</p>
            <p className="text-xs text-rose-200 mt-2">All Major Home Services</p>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <LineChart data={analyticsData?.revenueTimeSeries || []} />
        </div>

        {/* Top Categories Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          <BarChart 
            data={(analyticsData?.topCategories || []).map((cat, index) => ({
              name: cat.categoryName,
              value: cat.revenue,
              color: ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b'][index % 4]
            }))}
            maxValue={Math.max(...(analyticsData?.topCategories || []).map(cat => cat.revenue), 1)}
          />
        </div>
      </div>

      {/* Detailed Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown by Categories</h3>
        </div>
        
        <div className="p-6">
          {(analyticsData?.topCategories || []).map((category) => (
            <div key={category.categoryName} className="mb-8 last:mb-0">
              
              {/* Category Header */}
              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{category.categoryName}</h4>
                  <p className="text-sm text-gray-600">{category.orders} orders</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₹{category.revenue.toLocaleString()}</div>
                  <div className="text-sm font-medium text-gray-600">
                    Category Revenue
                  </div>
                </div>
              </div>

              {/* Category Details */}
              <div className="ml-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Revenue:</span> ₹{category.revenue.toLocaleString()} • 
                  <span className="font-semibold"> Orders:</span> {category.orders} • 
                  <span className="font-semibold"> Avg Order Value:</span> ₹{Math.round(category.revenue / category.orders)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;