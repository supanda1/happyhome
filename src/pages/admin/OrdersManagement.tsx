import React, { useState, useEffect } from 'react';
import { 
  CATEGORY_EXPERTISE_MAP
} from '../../utils/adminDataManager';
import { ordersAPI, employeesAPI, handleAPIError } from '../../services/api';
import type { Order, OrderItem, Employee } from '../../types/api';

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  // Fetch orders and employees from API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders from API
      const ordersResponse = await ordersAPI.getAll();
      if (ordersResponse.success && ordersResponse.data) {
        setOrders(ordersResponse.data);
      } else {
        console.error('Failed to fetch orders:', ordersResponse.error);
        setOrders([]);
      }
      
      // Fetch employees from API
      const employeesResponse = await employeesAPI.getAll({ active_only: true });
      if (employeesResponse.success && employeesResponse.data) {
        setEmployees(employeesResponse.data);
      } else {
        console.error('Failed to fetch employees:', employeesResponse.error);
        setEmployees([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Failed to load data: ${handleAPIError(error)}\n\nCheck if backend server is running.`);
      
      // Set empty arrays on network errors
      setOrders([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to get engineers by category using loaded employees
  const getEngineersByCategory = (categoryId: string) => {
    const expertiseArea = CATEGORY_EXPERTISE_MAP[categoryId as keyof typeof CATEGORY_EXPERTISE_MAP];
    if (!expertiseArea) return [];
    
    return employees.filter(emp => 
      emp.is_active && (
        // Check if employee has multi-expertise areas
        (emp.expertise_areas && emp.expertise_areas.includes(expertiseArea)) ||
        // Fallback to legacy expert field
        (!emp.expertise_areas && emp.expert === expertiseArea)
      )
    );
  };

  // Filter orders by status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  // Handle engineer assignment to specific item via API
  const handleAssignEngineer = async (engineerId: string) => {
    if (!selectedOrder || !selectedItem) return;

    try {
      const response = await ordersAPI.assignEngineer(
        selectedOrder.id, 
        selectedItem.id, 
        { engineer_id: engineerId }
      );
      
      if (response.success) {
        await fetchData();
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedItem(null);
        alert(response.message || 'Engineer assigned successfully');
      } else {
        alert(response.error || 'Failed to assign engineer');
      }
    } catch (error) {
      console.error('Error assigning engineer:', error);
      alert(`Error assigning engineer: ${handleAPIError(error)}`);
    }
  };

  // Handle item status update via API
  const handleItemStatusUpdate = async (status: OrderItem['item_status'], notes?: string) => {
    if (!selectedOrder || !selectedItem) return;

    try {
      const response = await ordersAPI.updateItem(
        selectedOrder.id, 
        selectedItem.id, 
        { 
          item_status: status,
          item_notes: notes 
        }
      );
      
      if (response.success) {
        await fetchData();
        setShowStatusModal(false);
        setSelectedOrder(null);
        setSelectedItem(null);
        alert('Item status updated successfully!');
      } else {
        alert(response.error || 'Failed to update item status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Error updating item status: ${handleAPIError(error)}`);
    }
  };

  // Handle overall order status update via API
  const handleOrderStatusUpdate = async (status: Order['status'], notes?: string) => {
    if (!selectedOrder) return;

    try {
      const response = await ordersAPI.update(selectedOrder.id, {
        status,
        admin_notes: notes
      });
      
      if (response.success) {
        await fetchData();
        setShowStatusModal(false);
        setSelectedOrder(null);
        alert('Order status updated successfully!');
      } else {
        alert(response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Error updating order status: ${handleAPIError(error)}`);
    }
  };

  // Handle order priority update via API
  const handleOrderPriorityUpdate = async (priority: Order['priority']) => {
    if (!selectedOrder) return;

    try {
      const response = await ordersAPI.update(selectedOrder.id, {
        priority,
        admin_notes: `Priority changed to ${priority} by admin at ${new Date().toISOString()}`
      });
      
      if (response.success) {
        await fetchData();
        setShowPriorityModal(false);
        setSelectedOrder(null);
        alert('Order priority updated successfully!');
      } else {
        alert(response.error || 'Failed to update order priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      alert(`Error updating order priority: ${handleAPIError(error)}`);
    }
  };

  // Get status badge color with deep, vibrant styling
  const getStatusBadgeColor = (status: Order['status'] | OrderItem['item_status'] | undefined) => {
    if (!status) return 'bg-gray-600 text-white border border-gray-700 shadow-md';
    
    switch (status) {
      case 'pending': 
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border border-amber-700 shadow-md font-semibold';
      case 'scheduled': 
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-700 shadow-md font-semibold';
      case 'in_progress': 
        return 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border border-purple-700 shadow-md font-semibold';
      case 'completed': 
        return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-700 shadow-md font-semibold';
      case 'cancelled': 
        return 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-700 shadow-md font-semibold';
      case 'postponed': 
        return 'bg-gradient-to-r from-orange-600 to-amber-600 text-white border border-orange-700 shadow-md font-semibold';
      default: 
        return 'bg-gray-600 text-white border border-gray-700 shadow-md';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Order['status'] | OrderItem['item_status'] | undefined) => {
    if (!status) return '❓';
    
    switch (status) {
      case 'pending': return '⏳';
      case 'scheduled': return '📅';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'postponed': return '⏸️';
      default: return '❓';
    }
  };

  // Get priority badge color with deep, vibrant styling  
  const getPriorityBadgeColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'urgent': 
        return 'bg-gradient-to-r from-red-700 to-pink-700 text-white border border-red-800 shadow-lg ring-2 ring-red-600 ring-opacity-50 font-bold';
      case 'high': 
        return 'bg-gradient-to-r from-orange-700 to-red-700 text-white border border-orange-800 shadow-md ring-1 ring-orange-600 ring-opacity-50 font-semibold';
      case 'medium': 
        return 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white border border-yellow-700 shadow-md font-semibold';
      case 'low': 
        return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-700 shadow-md font-semibold';
      default: 
        return 'bg-gray-600 text-white border border-gray-700 shadow-md';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: Order['priority']) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⚠️';
      case 'medium': return '🔸';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Orders Management Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Orders</p>
            <p className="text-4xl font-bold text-white">{orders.length}</p>
            <p className="text-xs text-blue-200 mt-2">All Time</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-yellow-100 mb-2">Pending Orders</p>
            <p className="text-4xl font-bold text-white">{orders.filter(o => o.status === 'pending').length}</p>
            <p className="text-xs text-yellow-200 mt-2">Awaiting Action</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">In Progress</p>
            <p className="text-4xl font-bold text-white">{orders.filter(o => o.status === 'in_progress').length}</p>
            <p className="text-xs text-purple-200 mt-2">Active Jobs</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Completed</p>
            <p className="text-4xl font-bold text-white">{orders.filter(o => o.status === 'completed').length}</p>
            <p className="text-xs text-green-200 mt-2">Finished Jobs</p>
          </div>
        </div>

      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Scheduled Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-cyan-100 mb-2">Scheduled</p>
            <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'scheduled').length}</p>
            <p className="text-xs text-cyan-200 mt-2">Upcoming</p>
          </div>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-red-100 mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'cancelled').length}</p>
            <p className="text-xs text-red-200 mt-2">Cancelled</p>
          </div>
        </div>

        {/* Postponed Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Postponed</p>
            <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'postponed').length}</p>
            <p className="text-xs text-orange-200 mt-2">Delayed</p>
          </div>
        </div>

      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { key: 'all', label: 'All Orders', count: orders.length, color: 'from-gray-600 to-gray-700', hoverColor: 'hover:from-gray-500 hover:to-gray-600' },
            { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'from-amber-600 to-yellow-600', hoverColor: 'hover:from-amber-500 hover:to-yellow-500' },
            { key: 'scheduled', label: 'Scheduled', count: orders.filter(o => o.status === 'scheduled').length, color: 'from-blue-600 to-indigo-600', hoverColor: 'hover:from-blue-500 hover:to-indigo-500' },
            { key: 'in_progress', label: 'In Progress', count: orders.filter(o => o.status === 'in_progress').length, color: 'from-purple-600 to-violet-600', hoverColor: 'hover:from-purple-500 hover:to-violet-500' },
            { key: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length, color: 'from-green-600 to-emerald-600', hoverColor: 'hover:from-green-500 hover:to-emerald-500' },
            { key: 'postponed', label: 'Postponed', count: orders.filter(o => o.status === 'postponed').length, color: 'from-orange-600 to-amber-600', hoverColor: 'hover:from-orange-500 hover:to-amber-500' },
            { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: 'from-red-600 to-rose-600', hoverColor: 'hover:from-red-500 hover:to-rose-500' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as Order['status'] | 'all')}
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

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {statusFilter === 'all' ? 'All Orders' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`}
              </h3>
              <p className="text-sm text-gray-600">{filteredOrders.length} orders found</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-lg font-semibold text-gray-900">
                ₹{filteredOrders.reduce((sum, order) => sum + parseFloat(order.final_amount), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Order Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Engineer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status & Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_phone}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.service_address.area}, {order.service_address.city}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.items && order.items.length > 0 ? order.items[0].service_name : 'No service specified'}
                      </div>
                      {order.items && order.items.length > 1 && (
                        <div className="text-sm text-gray-500">
                          +{order.items.length - 1} more item(s)
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {order.items ? order.items.filter(item => item.assigned_engineer_name).length : 0}/{order.items ? order.items.length : 0} items assigned
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.items && order.items.length === 1 ? (
                      // Single item - show engineer directly
                      order.items[0].assigned_engineer_name ? (
                        <div className="text-sm font-medium text-gray-900">
                          {order.items[0].assigned_engineer_name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Not assigned
                        </span>
                      )
                    ) : order.items && order.items.length > 1 ? (
                      // Multiple items - show summary
                      <div>
                        <div className="text-sm text-gray-600">
                          Multiple items
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items.filter(item => item.assigned_engineer_name).length} assigned
                        </div>
                      </div>
                    ) : (
                      // No items - show error state
                      <span className="text-sm text-red-400 italic">
                        No items
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 ${getStatusBadgeColor(order.status)}`}>
                        <span className="mr-1.5">{getStatusIcon(order.status)}</span>
                        <span className="capitalize">{order.status.replace('_', ' ')}</span>
                      </div>
                      <br />
                      <div className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 ${getPriorityBadgeColor(order.priority)}`}>
                        <span className="mr-1.5">{getPriorityIcon(order.priority)}</span>
                        <span className="capitalize font-semibold">{order.priority}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{order.final_amount}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0} item{order.items && order.items.length > 1 ? 's' : ''})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                    >
                      View
                    </button>
                    {order.items && order.items.length === 1 ? (
                      // Single item - direct assignment
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setSelectedItem(order.items[0]);
                          setShowAssignModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs"
                      >
                        Assign
                      </button>
                    ) : order.items && order.items.length > 1 ? (
                      // Multiple items - show items modal
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowItemsModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs"
                      >
                        Items
                      </button>
                    ) : null}
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowStatusModal(true);
                      }}
                      className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded text-xs"
                    >
                      Status
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowPriorityModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded text-xs"
                    >
                      Priority
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'No orders have been placed yet' 
                : `No ${statusFilter} orders at the moment`}
            </p>
          </div>
        )}
      </div>

      {/* Order Items Management Modal */}
      {showItemsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Manage Order Items - {selectedOrder.order_number}
              </h3>
              <button
                onClick={() => {
                  setShowItemsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Customer: <span className="font-semibold">{selectedOrder.customer_name}</span> • 
                Total Items: <span className="font-semibold">{selectedOrder.items.length}</span>
              </p>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {selectedOrder.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Item {index + 1}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusBadgeColor(item.item_status || 'pending')}`}>
                          <span className="mr-1.5">{getStatusIcon(item.item_status || 'pending')}</span>
                          <span className="capitalize">{(item.item_status || 'pending').replace('_', ' ')}</span>
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {item.service_name}
                      </h4>
                      
                      {item.variant_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          Variant: {item.variant_name}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Category:</span>{' '}
                          <span className="text-blue-600 font-medium">
                            {CATEGORY_EXPERTISE_MAP[item.category_id as keyof typeof CATEGORY_EXPERTISE_MAP] || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> ₹{item.total_price}
                        </div>
                        <div>
                          <span className="font-medium">Available Engineers:</span>{' '}
                          <span className="text-sm">
                            {getEngineersByCategory(item.category_id).length} specialists
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Assigned Engineer:</span>{' '}
                          {item.assigned_engineer_name ? (
                            <span className="text-green-600 font-medium">{item.assigned_engineer_name}</span>
                          ) : (
                            <span className="text-red-500">Not assigned</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Schedule:</span>{' '}
                          {item.scheduled_date ? (
                            <span>{new Date(item.scheduled_date).toLocaleDateString()} 
                              {item.scheduled_time_slot && ` • ${item.scheduled_time_slot}`}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </div>
                      </div>

                      {item.item_notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded">
                          <span className="text-sm font-medium text-yellow-900">Notes: </span>
                          <span className="text-sm text-yellow-800">{item.item_notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowAssignModal(true);
                        }}
                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-xs font-medium"
                      >
                        {item.assigned_engineer_name ? 'Reassign' : 'Assign'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowStatusModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded text-xs font-medium"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Engineer Modal */}
      {showAssignModal && selectedOrder && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Assign Engineer
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order: <span className="font-semibold">{selectedOrder.order_number}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Service: <span className="font-semibold">{selectedItem.service_name}</span>
                {selectedItem.variant_name && <span className="text-gray-500"> ({selectedItem.variant_name})</span>}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Required Expertise: <span className="font-semibold text-blue-600">
                  {CATEGORY_EXPERTISE_MAP[selectedItem.category_id as keyof typeof CATEGORY_EXPERTISE_MAP] || 'Unknown'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Current Status: <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusBadgeColor(selectedItem.item_status || 'pending')}`}>
                  <span className="mr-1.5">{getStatusIcon(selectedItem.item_status || 'pending')}</span>
                  <span className="capitalize">{(selectedItem.item_status || 'pending').replace('_', ' ')}</span>
                </span>
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                const categoryEngineers = getEngineersByCategory(selectedItem.category_id);
                const allEngineers = employees.filter(emp => emp.is_active);
                const hasMatchingEngineers = categoryEngineers.length > 0;

                return (
                  <>
                    {hasMatchingEngineers && (
                      <>
                        <h4 className="text-sm font-medium text-green-700 flex items-center">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Recommended Engineers ({categoryEngineers.length}):
                        </h4>
                        {categoryEngineers.map((employee) => (
                          <button
                            key={employee.id}
                            onClick={() => handleAssignEngineer(employee.id)}
                            className="w-full text-left p-3 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  <span className="text-green-600 mr-2">✓</span>
                                  {employee.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {employee.employee_id} • {employee.expert} Specialist
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {employee.phone}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}

                    {allEngineers.length > categoryEngineers.length && (
                      <>
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-orange-700 flex items-center">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                            Other Engineers ({allEngineers.length - categoryEngineers.length}):
                          </h4>
                          <p className="text-xs text-orange-600 mb-2">
                            ⚠️ These engineers may not have matching expertise
                          </p>
                        </div>
                        {allEngineers
                          .filter(emp => !categoryEngineers.find(catEmp => catEmp.id === emp.id))
                          .map((employee) => (
                            <button
                              key={employee.id}
                              onClick={() => handleAssignEngineer(employee.id)}
                              className="w-full text-left p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center">
                                    <span className="text-orange-600 mr-2">⚠</span>
                                    {employee.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {employee.employee_id} • {employee.expert}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {employee.phone}
                                </div>
                              </div>
                            </button>
                          ))}
                      </>
                    )}

                    {!hasMatchingEngineers && allEngineers.length === 0 && (
                      <div className="text-center py-4">
                        <div className="text-gray-400 text-4xl mb-2">👷‍♂️</div>
                        <p className="text-sm text-gray-500">No engineers available</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Order Details - {selectedOrder.order_number}
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Customer Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customer_name}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.customer_phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customer_email}</p>
                </div>
                
                <h5 className="text-md font-semibold text-gray-900 mt-4">Service Address</h5>
                <div className="text-sm text-gray-600">
                  {selectedOrder.service_address.house_number}, {selectedOrder.service_address.area}<br />
                  {selectedOrder.service_address.landmark && `${selectedOrder.service_address.landmark}, `}
                  {selectedOrder.service_address.city}, {selectedOrder.service_address.state}<br />
                  PIN: {selectedOrder.service_address.pincode}
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Order Information</h4>
                <div className="space-y-2">
                  <p className="flex items-center"><span className="font-medium">Status:</span> 
                    <span className={`ml-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusBadgeColor(selectedOrder.status)}`}>
                      <span className="mr-1.5">{getStatusIcon(selectedOrder.status)}</span>
                      <span className="capitalize">{selectedOrder.status.replace('_', ' ')}</span>
                    </span>
                  </p>
                  <p className="flex items-center"><span className="font-medium">Priority:</span> 
                    <span className={`ml-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${getPriorityBadgeColor(selectedOrder.priority)}`}>
                      <span className="mr-1.5">{getPriorityIcon(selectedOrder.priority)}</span>
                      <span className="capitalize font-semibold">{selectedOrder.priority}</span>
                    </span>
                  </p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedOrder.created_at)}</p>
                  <p><span className="font-medium">Updated:</span> {formatDate(selectedOrder.updated_at)}</p>
                  <p><span className="font-medium">Items Status:</span> 
                    <span className="ml-2">
                      {selectedOrder.items.filter(item => item.assigned_engineer_name).length}/{selectedOrder.items.length} assigned
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                            Item {index + 1}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${getStatusBadgeColor(item.item_status || 'pending')}`}>
                            <span className="mr-1.5">{getStatusIcon(item.item_status || 'pending')}</span>
                            <span className="capitalize">{(item.item_status || 'pending').replace('_', ' ')}</span>
                          </span>
                        </div>
                        
                        <div className="font-medium text-gray-900">{item.service_name}</div>
                        {item.variant_name && (
                          <div className="text-sm text-gray-600">Variant: {item.variant_name}</div>
                        )}
                        <div className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</div>
                        
                        <div className="mt-2 space-y-1 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Category:</span>{' '}
                            <span className="text-blue-600 font-medium">
                              {CATEGORY_EXPERTISE_MAP[item.category_id as keyof typeof CATEGORY_EXPERTISE_MAP] || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({getEngineersByCategory(item.category_id).length} specialists available)
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Assigned Engineer:</span>{' '}
                            {item.assigned_engineer_name ? (
                              <span className="text-green-600">{item.assigned_engineer_name}</span>
                            ) : (
                              <span className="text-red-500">Not assigned</span>
                            )}
                          </div>
                          
                          {item.scheduled_date && (
                            <div>
                              <span className="font-medium text-gray-700">Scheduled:</span>{' '}
                              {new Date(item.scheduled_date).toLocaleDateString()}
                              {item.scheduled_time_slot && ` • ${item.scheduled_time_slot}`}
                            </div>
                          )}
                          
                          {item.completion_date && (
                            <div>
                              <span className="font-medium text-gray-700">Completed:</span>{' '}
                              {formatDate(item.completion_date)}
                            </div>
                          )}
                        </div>

                        {item.item_notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                            <span className="font-medium text-yellow-900">Notes: </span>
                            <span className="text-yellow-800">{item.item_notes}</span>
                          </div>
                        )}

                        {item.item_rating && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                            <div className="flex items-center">
                              <span className="font-medium text-green-900">Rating: </span>
                              <div className="ml-2 flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < item.item_rating! ? 'text-yellow-400' : 'text-gray-300'}>
                                    ⭐
                                  </span>
                                ))}
                              </div>
                            </div>
                            {item.item_review && (
                              <div className="text-green-800 mt-1">{item.item_review}</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="font-medium">₹{item.total_price}</div>
                        <div className="text-sm text-gray-600">@₹{item.unit_price} each</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal:</span> <span>₹{selectedOrder.total_amount}</span></div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount:</span> <span>-₹{selectedOrder.discount_amount}</span></div>
                )}
                <div className="flex justify-between"><span>GST:</span> <span>₹{selectedOrder.gst_amount}</span></div>
                <div className="flex justify-between"><span>Service Charge:</span> <span>₹{selectedOrder.service_charge}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span> <span>₹{selectedOrder.final_amount}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(selectedOrder.notes || selectedOrder.admin_notes) && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Notes</h4>
                {selectedOrder.notes && (
                  <div className="p-3 bg-blue-50 rounded-lg mb-2">
                    <div className="font-medium text-blue-900">Customer Notes:</div>
                    <div className="text-blue-800">{selectedOrder.notes}</div>
                  </div>
                )}
                {selectedOrder.admin_notes && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-900">Admin Notes:</div>
                    <div className="text-yellow-800">{selectedOrder.admin_notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Review */}
            {selectedOrder.customer_rating && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Customer Feedback</h4>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-green-900">Rating: </span>
                    <div className="ml-2 flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < selectedOrder.customer_rating! ? 'text-yellow-400' : 'text-gray-300'}>
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedOrder.customer_review && (
                    <div className="text-green-800">{selectedOrder.customer_review}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedItem ? 'Update Item Status' : 'Update Order Status'}
              </h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order: <span className="font-semibold">{selectedOrder.order_number}</span>
              </p>
              {selectedItem ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Service: <span className="font-semibold">{selectedItem.service_name}</span>
                    {selectedItem.variant_name && <span className="text-gray-500"> ({selectedItem.variant_name})</span>}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Current Status: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedItem.item_status || 'pending')}`}>
                      {(selectedItem.item_status || 'pending').replace('_', ' ')}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  Current Status: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Update to:</h4>
              {['pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'].map((status) => {
                const currentStatus = selectedItem ? (selectedItem.item_status || 'pending') : selectedOrder.status;
                const isDisabled = status === currentStatus;
                
                return (
                  <button
                    key={status}
                    onClick={() => {
                      if (selectedItem) {
                        handleItemStatusUpdate(status as OrderItem['item_status']);
                      } else {
                        handleOrderStatusUpdate(status as Order['status']);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(status as Order['status'])}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Update Priority Modal */}
      {showPriorityModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Update Order Priority
              </h3>
              <button
                onClick={() => {
                  setShowPriorityModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Order: <span className="font-semibold">{selectedOrder.order_number}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Priority: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(selectedOrder.priority)}`}>
                  {selectedOrder.priority}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Update Priority to:</h4>
              {['low', 'medium', 'high', 'urgent'].map((priority) => {
                const currentPriority = selectedOrder.priority;
                const isDisabled = priority === currentPriority;
                
                return (
                  <button
                    key={priority}
                    onClick={() => handleOrderPriorityUpdate(priority as Order['priority'])}
                    disabled={isDisabled}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(priority as Order['priority'])}`}>
                        {priority}
                      </span>
                      {priority === 'urgent' && (
                        <span className="text-xs text-red-600 font-medium">Emergency Priority</span>
                      )}
                      {priority === 'high' && (
                        <span className="text-xs text-orange-600 font-medium">High Priority</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">Note:</span> Priority changes are logged and tracked for audit purposes.
                High and Urgent priorities will notify relevant teams automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;