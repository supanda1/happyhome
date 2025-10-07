import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../utils/adminDataManager';

// Custom CSS for enhanced animations
const customStyles = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes bounce-in {
    0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
    50% { transform: translateY(0px) scale(1.05); opacity: 1; }
    65% { transform: translateY(-10px) scale(1.02); }
    81% { transform: translateY(0px) scale(1); }
    100% { transform: translateY(0px) scale(1); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

interface DashboardData {
  totalServices: number;
  totalCategories: number;
  totalBookings: number;
  totalUsers: number;
  activeServices: number;
  pendingReviews: number;
  activeCoupons: number;
  todayBookings: number;
  monthlyRevenue: number;
  completedRevenue?: number;
  pendingRevenue?: number;
  topServices: Array<{
    name: string;
    bookings: number;
    category: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'booking' | 'review' | 'service' | 'user';
    message: string;
    timestamp: string;
  }>;
}

const DashboardStats: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalServices: 0,
    totalCategories: 0,
    totalBookings: 0,
    totalUsers: 0,
    activeServices: 0,
    pendingReviews: 0,
    activeCoupons: 0,
    todayBookings: 0,
    monthlyRevenue: 0,
    completedRevenue: 0,
    pendingRevenue: 0,
    topServices: [],
    recentActivity: []
  });

  // No more mock data - fetched from database

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching dashboard stats from database...');
        
        const stats = await getDashboardStats();
        console.log('✅ Dashboard stats loaded:', stats);
        
        setDashboardData({
          totalServices: (stats && typeof stats.totalServices === 'number') ? stats.totalServices : 0,
          totalCategories: (stats && typeof stats.totalCategories === 'number') ? stats.totalCategories : 0,
          totalBookings: (stats && typeof stats.totalBookings === 'number') ? stats.totalBookings : 0,
          totalUsers: (stats && typeof stats.totalUsers === 'number') ? stats.totalUsers : 0,
          activeServices: (stats && typeof stats.activeServices === 'number') ? stats.activeServices : 0,
          pendingReviews: (stats && typeof stats.pendingReviews === 'number') ? stats.pendingReviews : 0,
          activeCoupons: (stats && typeof stats.activeCoupons === 'number') ? stats.activeCoupons : 0,
          todayBookings: (stats && typeof stats.todayBookings === 'number') ? stats.todayBookings : 0,
          monthlyRevenue: (stats && typeof stats.monthlyRevenue === 'number') ? stats.monthlyRevenue : 0,
          completedRevenue: (stats && typeof stats.completedRevenue === 'number') ? stats.completedRevenue : 0,
          pendingRevenue: (stats && typeof stats.pendingRevenue === 'number') ? stats.pendingRevenue : 0,
          topServices: (stats && Array.isArray(stats.topServices)) ? stats.topServices : [],
          recentActivity: (stats && Array.isArray(stats.recentActivity)) ? stats.recentActivity : []
        });
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Set empty data in case of error
        setDashboardData({
          totalServices: 0,
          totalCategories: 0,
          totalBookings: 0,
          totalUsers: 0,
          activeServices: 0,
          pendingReviews: 0,
          activeCoupons: 0,
          todayBookings: 0,
          monthlyRevenue: 0,
          completedRevenue: 0,
          pendingRevenue: 0,
          topServices: [],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'service': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Loading Dashboard
                </h3>
                <p className="text-gray-600 font-medium">Fetching analytics and dashboard statistics...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12 blur-xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                        <p className="text-blue-100 text-lg">Real-time business insights and analytics</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{dashboardData.totalBookings}</div>
                        <div className="text-sm text-blue-100">Total Bookings</div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-blue-100 text-xl leading-relaxed mt-4">Monitor performance, track growth, and optimize your business operations</p>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Services */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.totalServices}</p>
                  <p className="text-sm font-medium text-gray-600">Total Services</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">{dashboardData.activeServices} Active</p>
                </div>
              </div>
            </div>

            {/* Total Categories */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.totalCategories}</p>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">Service groups</p>
                </div>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.totalBookings.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">{dashboardData.todayBookings} Today</p>
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div className="group">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{dashboardData.totalUsers.toLocaleString()}</p>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">Active members</p>
                </div>
              </div>
            </div>

          </div>

          {/* Enhanced Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-center">
                <p className="text-base font-medium text-emerald-100 mb-2">Monthly Revenue</p>
                <p className="text-3xl font-bold text-white">₹{Math.ceil(dashboardData.monthlyRevenue).toLocaleString()}</p>
                <div className="flex justify-center space-x-4 mt-3">
                  <span className="text-sm text-emerald-200 font-medium">
                    Completed: ₹{Math.ceil(dashboardData.completedRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-sm text-emerald-200 font-medium">
                    Pending: ₹{Math.ceil(dashboardData.pendingRevenue || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl p-4 text-center">
                <p className="text-base font-medium text-yellow-100 mb-2">Pending Reviews</p>
                <p className="text-3xl font-bold text-white">{dashboardData.pendingReviews}</p>
                <p className="text-sm text-yellow-200 mt-2">Awaiting Approval</p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 text-center">
                <p className="text-base font-medium text-pink-100 mb-2">Active Coupons</p>
                <p className="text-3xl font-bold text-white">{dashboardData.activeCoupons}</p>
            <p className="text-sm text-pink-200 mt-2">Available Offers</p>
          </div>
        </div>

      </div>

      {/* Top Services & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-4">
            {dashboardData.topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{service.bookings}</p>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActivityColor(activity.type)}`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors text-white text-center">
            <span className="text-sm font-medium">Add Service</span>
          </button>
          <button className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-colors text-white text-center">
            <span className="text-sm font-medium">Create Coupon</span>
          </button>
          <button className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-colors text-white text-center">
            <span className="text-sm font-medium">Add Banner</span>
          </button>
          <button className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors text-white text-center">
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>
    </div>
    </div>
    </>
  );
};

export default DashboardStats;