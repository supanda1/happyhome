import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../../utils/adminDataManager';

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
          totalServices: stats.totalServices || 0,
          totalCategories: stats.totalCategories || 0,
          totalBookings: stats.totalBookings || 0,
          totalUsers: stats.totalUsers || 0,
          activeServices: stats.activeServices || 0,
          pendingReviews: stats.pendingReviews || 0,
          activeCoupons: stats.activeCoupons || 0,
          todayBookings: stats.todayBookings || 0,
          monthlyRevenue: stats.monthlyRevenue || 0,
          completedRevenue: stats.completedRevenue || 0,
          pendingRevenue: stats.pendingRevenue || 0,
          topServices: stats.topServices || [],
          recentActivity: stats.recentActivity || []
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
      <div className="flex items-center justify-center h-64">
        <div className="text-blue-600 font-semibold">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Happy Homes Admin Dashboard</h1>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Services</p>
            <p className="text-4xl font-bold text-white">{dashboardData.totalServices}</p>
            <p className="text-xs text-blue-200 mt-2">{dashboardData.activeServices} Active</p>
          </div>
        </div>

        {/* Total Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Categories</p>
            <p className="text-4xl font-bold text-white">{dashboardData.totalCategories}</p>
            <p className="text-xs text-purple-200 mt-2">All Active</p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Total Bookings</p>
            <p className="text-4xl font-bold text-white">{dashboardData.totalBookings.toLocaleString()}</p>
            <p className="text-xs text-green-200 mt-2">{dashboardData.todayBookings} Today</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Total Users</p>
            <p className="text-4xl font-bold text-white">{dashboardData.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-orange-200 mt-2">Active Members</p>
          </div>
        </div>

      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-emerald-100 mb-2">Monthly Revenue</p>
            <p className="text-3xl font-bold text-white">₹{Math.ceil(dashboardData.monthlyRevenue).toLocaleString()}</p>
            <div className="flex justify-center space-x-4 mt-3">
              <span className="text-xs text-emerald-200 font-medium">
                Completed: ₹{Math.ceil(dashboardData.completedRevenue || 0).toLocaleString()}
              </span>
              <span className="text-xs text-emerald-200 font-medium">
                Pending: ₹{Math.ceil(dashboardData.pendingRevenue || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-yellow-100 mb-2">Pending Reviews</p>
            <p className="text-3xl font-bold text-white">{dashboardData.pendingReviews}</p>
            <p className="text-xs text-yellow-200 mt-2">Awaiting Approval</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-pink-100 mb-2">Active Coupons</p>
            <p className="text-3xl font-bold text-white">{dashboardData.activeCoupons}</p>
            <p className="text-xs text-pink-200 mt-2">Available Offers</p>
          </div>
        </div>

      </div>

      {/* Top Services & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
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
  );
};

export default DashboardStats;