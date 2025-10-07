import React, { useState, useEffect } from 'react';
import { 
  getOrders,
  updateOrderStatus,
  getEmployees,
  getOrderHistory,
  getEffectiveOrderStatus,
  getStatusDisplayName,
  getStatusColor
} from '../../utils/adminDataManager';
import type { OrderHistory } from '../../types/api';

// Enhanced Order and OrderItem types for this component
interface OrderItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  price?: number; // Computed field for backward compatibility
  item_status: 'pending' | 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  status?: 'pending' | 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; // Computed field
  notes?: string;
  item_notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  service_address?: any; // Support for JSONB address format from backend
  status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  notes?: string;
  // Additional fields that might be in API response
  customer_id?: string;
  service_date?: string;
  final_amount?: number;
  [key: string]: any; // Allow additional properties from API
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [showDetailsInline, setShowDetailsInline] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [showCallOptions, setShowCallOptions] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<{orderId: string, itemId: string, serviceName: string} | null>(null);
  // const [showScheduleModal, setShowScheduleModal] = useState<{orderId: string, itemId: string, serviceName: string} | null>(null); // Removed - using inline scheduling
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  // const [scheduleLoading, setScheduleLoading] = useState(false); // Removed - using inline scheduling
  // const [scheduledDate, setScheduledDate] = useState<string>(''); // Removed - using inline scheduling  
  // const [scheduledTimeSlot, setScheduledTimeSlot] = useState<string>(''); // Removed - using inline scheduling
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<Record<string, OrderHistory>>({});
  // const [historyLoading, setHistoryLoading] = useState<string | null>(null); // Unused - keeping for future history feature
  
  // Status selection modal states
  const [showStatusModal, setShowStatusModal] = useState<{orderId: string, orderNumber: string} | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');

  // Helper function to set order-specific errors
  const setOrderError = (orderId: string, message: string) => {
    setOrderErrors(prev => ({ ...prev, [orderId]: message }));
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setOrderErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[orderId];
        return newErrors;
      });
    }, 5000);
  };

  // Helper function to clear order-specific errors
  const clearOrderError = (orderId: string) => {
    setOrderErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[orderId];
      return newErrors;
    });
  };

  // Helper function to format status names for display
  const formatStatusForDisplay = (status: string): string => {
    if (status === 'all') return 'all';
    return status.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle individual task completion
  const handleCompleteTask = async (orderId: string, itemId: string, serviceName: string) => {
    try {
      console.log(`🏁 Completing task ${serviceName} for order ${orderId}...`);
      
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          item_status: 'completed',
          item_notes: `Completed: ${new Date().toISOString().substring(0, 10)}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to complete task: ${response.status}`);
      }

      console.log(`✅ Task ${serviceName} completed successfully`);
      
      // Update local state immediately
      setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => 
            item.id === itemId 
              ? { ...item, status: 'completed' as const, item_status: 'completed' as const }
              : item
          );
          
          return {
            ...order,
            items: updatedItems
          };
        }
        return order;
      }));
      
      // Clear any existing errors
      clearOrderError(orderId);
      setNotification({type: 'success', message: `✅ ${serviceName} completed successfully! Checking if all tasks are done...`});
      
      // Refresh data from backend
      await fetchData();
      
      // Check if all tasks are now completed and auto-complete order
      await checkAndCompleteOrder(orderId);
      
    } catch (error) {
      console.error('❌ Failed to complete task:', error);
      setOrderError(orderId, `Failed to complete ${serviceName}. Please try again.`);
    }
  };

  // Check if all tasks are completed and auto-complete the order
  const checkAndCompleteOrder = async (orderId: string) => {
    try {
      // Get fresh order data
      const orderResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const freshOrder = orderData.data || orderData;
        
        if (freshOrder && freshOrder.items && freshOrder.items.length > 0) {
          // Check if all items are completed
          const allItemsCompleted = freshOrder.items.every((item: any) => 
            item.item_status === 'completed' || item.status === 'completed'
          );
          
          if (allItemsCompleted && freshOrder.status !== 'completed') {
            console.log('✅ All tasks completed - Auto-completing order');
            await handleOrderStatusUpdate(orderId, 'completed');
            
            // Additional local state update to ensure UI consistency
            setOrders(prevOrders => prevOrders.map(order => {
              if (order.id === orderId) {
                return {
                  ...order,
                  status: 'completed' as const,
                  items: order.items.map(item => ({
                    ...item,
                    status: 'completed' as const,
                    item_status: 'completed' as const
                  }))
                };
              }
              return order;
            }));
            
            setNotification({
              type: 'success', 
              message: `🎉 All tasks completed! Order #${freshOrder.order_number || freshOrder.id.slice(0, 8).toUpperCase()} automatically marked as completed.`
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to check order completion status:', error);
      // Don't fail the task completion if auto-completion check fails
    }
  };

  // Helper function to get available time slots based on selected date
  const getAvailableTimeSlots = (selectedDate: string) => {
    const allTimeSlots = [
      { value: '07:00-09:00', label: '7:00 AM - 9:00 AM', startHour: 7, endHour: 9 },
      { value: '09:00-11:00', label: '9:00 AM - 11:00 AM', startHour: 9, endHour: 11 },
      { value: '11:00-13:00', label: '11:00 AM - 1:00 PM', startHour: 11, endHour: 13 },
      { value: '13:00-15:00', label: '1:00 PM - 3:00 PM', startHour: 13, endHour: 15 },
      { value: '15:00-17:00', label: '3:00 PM - 5:00 PM', startHour: 15, endHour: 17 },
      { value: '17:00-19:00', label: '5:00 PM - 7:00 PM', startHour: 17, endHour: 19 },
      { value: '19:00-21:00', label: '7:00 PM - 9:00 PM', startHour: 19, endHour: 21 }
    ];

    // If no date selected, return all slots
    if (!selectedDate) return allTimeSlots;

    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    // If selected date is not today, return all slots
    if (!isToday) return allTimeSlots;

    // For today, filter out past time slots
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    return allTimeSlots.filter(slot => {
      // Allow slot if current time is before the end time (with 30-minute buffer for booking)
      const slotEndTimeInMinutes = slot.endHour * 60;
      const bufferTimeInMinutes = 30; // 30-minute minimum booking window
      
      return currentTimeInMinutes + bufferTimeInMinutes < slotEndTimeInMinutes;
    });
  };
  const [statusChangeReason, setStatusChangeReason] = useState<string>('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching orders data...');
      
      const ordersData = await getOrders();
      console.log('📊 Raw orders data received:', {
        type: typeof ordersData,
        isArray: Array.isArray(ordersData),
        length: ordersData?.length || 0,
        sample: ordersData?.[0]
      });
      
      if (!ordersData || !Array.isArray(ordersData)) {
        console.warn('⚠️ Invalid orders data received:', ordersData);
        setOrders([]);
        return;
      }
      
      // Process orders to fix pricing and status synchronization
      const processedOrders = ordersData.map((order: any) => {
        try {
          const processedItems = (order.items || []).map((item: any) => {
            // Fix price mapping: use total_price or unit_price as fallback
            const itemPrice = item.total_price || item.unit_price || item.price || 0;
            
            // Fix status synchronization: if main order is cancelled, override item status
            const itemStatus = order.status === 'cancelled' ? 'cancelled' : (item.item_status || item.status || 'pending');
            
            return {
              ...item,
              price: itemPrice, // Map to expected field name
              status: itemStatus // Map to expected field name with sync logic
            };
          });
          
          return {
            ...order,
            items: processedItems,
            // Ensure required fields exist
            customer_address: order.customer_address || 'Address not provided'
          };
        } catch (itemError) {
          console.error('Error processing order:', order.id, itemError);
          return order; // Return original order if processing fails
        }
      });
      
      console.log('✅ Processed orders:', {
        count: processedOrders.length,
        sample: processedOrders[0]
      });
      
      setOrders(processedOrders);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  // Fetch available employees
  const fetchEmployees = async () => {
    try {
      const employeesData = await getEmployees();
      setEmployees(employeesData || []);
      console.log('✅ Employees loaded:', employeesData?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load employees:', error);
      setEmployees([]);
    }
  };

  // Close call options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the CALL button or dropdown itself
      const target = event.target as HTMLElement;
      if (target.closest('.call-dropdown') || target.closest('.call-button')) {
        return;
      }
      
      if (showCallOptions) {
        console.log('🔄 Closing call options due to outside click');
        setShowCallOptions(null);
      }
    };

    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCallOptions]);

  // Filter orders by status with unified status logic
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => {
        const effectiveStatus = getEffectiveOrderStatus(order).toLowerCase().trim();
        const filterStatus = statusFilter.toLowerCase().trim();
        
        // Handle different status formats
        return effectiveStatus === filterStatus || 
               (filterStatus === 'cancelled' && effectiveStatus === 'canceled') ||
               (filterStatus === 'canceled' && effectiveStatus === 'cancelled');
      });
      
  console.log('🔍 Orders filtering:', {
    totalOrders: orders.length,
    statusFilter: statusFilter,
    filteredCount: filteredOrders.length,
    orderStatuses: orders.map(o => o.status)
  });

  // Handle order status update with automatic item status synchronization
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log(`🔄 Updating order ${orderId} status to ${newStatus}...`);
      
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result) {
        console.log(`✅ Order status updated successfully:`, result);
        
        // If completing or cancelling the order, also update all item statuses
        if (newStatus === 'completed') {
          try {
            const order = orders.find(o => o.id === orderId);
            if (order && order.items) {
              console.log(`🔄 Updating ${order.items.length} item statuses to completed...`);
              
              const itemUpdatePromises = order.items.map(async (item) => {
                try {
                  const response = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      item_status: 'completed',
                      item_notes: `${item.item_notes || ''}\n[${new Date().toISOString().substring(0, 10)}] Completed via order completion`
                    }),
                  });
                  
                  if (response.ok) {
                    console.log(`✅ Item ${item.service_name} status updated to completed`);
                  } else {
                    console.warn(`⚠️ Failed to update item ${item.service_name} status:`, response.status);
                  }
                } catch (itemError) {
                  console.warn(`⚠️ Item update failed for ${item.service_name}:`, itemError);
                }
              });
              
              await Promise.allSettled(itemUpdatePromises);
              console.log(`✅ All item statuses updated for order ${orderId}`);
            }
          } catch (itemsError) {
            console.warn('⚠️ Failed to update some item statuses:', itemsError);
            // Don't fail the order update if item updates fail
          }
        }
        
        // Immediately update local state for better UX
        setOrders(prevOrders => prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              status: newStatus,
              // Update item statuses for cancelled and completed orders
              items: (newStatus === 'cancelled') ? order.items.map(item => ({
                ...item,
                status: 'cancelled',
                item_status: 'cancelled'
              })) : (newStatus === 'completed') ? order.items.map(item => ({
                ...item,
                status: 'completed',
                item_status: 'completed'
              })) : order.items
            };
          }
          return order;
        }));
        
        await fetchData(); // Refresh data from backend
        setNotification({
          type: 'success', 
          message: newStatus === 'completed' 
            ? `Order completed successfully! All items marked as completed.`
            : `Order status updated to ${newStatus} successfully.`
        });
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({type: 'error', message: 'Failed to update order status. Please try again.'});
    }
  };

  // Handle employee assignment to order item
  const handleAssignEmployee = async (orderId: string, itemId: string, employeeId: string) => {
    try {
      setAssignmentLoading(true);
      
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          engineer_id: employeeId,
          scheduled_date: new Date().toISOString(),
          notes: 'Manually assigned by admin'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Assignment failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Employee assigned successfully:', result);
      
      // After successful assignment, update item status to scheduled
      try {
        const statusResponse = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            item_status: 'scheduled',
            item_notes: `Task moved from ${(orders.find(o => o.id === orderId)?.items?.find(i => i.id === itemId)?.status || 'unknown')} to scheduled after employee assignment`
          }),
        });

        if (statusResponse.ok) {
          console.log('✅ Task status updated to scheduled');
        } else {
          console.warn('⚠️ Failed to update task status, but assignment succeeded');
        }
      } catch (statusError) {
        console.warn('⚠️ Assignment succeeded but status update failed:', statusError);
      }
      
      await fetchData(); // Refresh orders data
      
      // Check if all tasks are now assigned and auto-move to scheduled if order is confirmed
      try {
        // Get fresh order data to check assignment status
        const orderResponse = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          const freshOrder = orderData.data || orderData;
          
          if (freshOrder && freshOrder.status === 'confirmed') {
            // Check if all items now have assigned engineers
            const allTasksAssigned = freshOrder.items?.every((item: any) => 
              item.assigned_engineer_id || item.assigned_engineer_name
            );
            
            if (allTasksAssigned && freshOrder.items && freshOrder.items.length > 0) {
              console.log('✅ All tasks assigned - Auto-moving order to scheduled status');
              await handleOrderStatusUpdate(orderId, 'scheduled');
            }
          }
        }
      } catch (autoScheduleError) {
        console.warn('⚠️ Failed to auto-move order to scheduled status:', autoScheduleError);
        // Don't fail the assignment if auto-scheduling fails
      }
      
      setNotification({type: 'success', message: 'Employee assigned! Task moved to scheduled. Order will auto-move to scheduled when all tasks are assigned.'});
      setShowAssignModal(null);
      setSelectedEmployee('');
    } catch (error) {
      console.error('❌ Failed to assign employee:', error);
      setNotification({type: 'error', message: `Failed to assign employee: ${error instanceof Error ? error.message : 'Unknown error'}`});
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle manual scheduling of individual task/service - Removed, using inline scheduling
  /*
  const handleScheduleTask = async () => {
    if (!showScheduleModal || !scheduledDate || !scheduledTimeSlot) {
      setNotification({type: 'error', message: 'Please select both date and time slot'});
      return;
    }

    try {
      setScheduleLoading(true);
      
      const response = await fetch(`/api/orders/${showScheduleModal.orderId}/items/${showScheduleModal.itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          scheduled_date: scheduledDate,
          scheduled_time_slot: scheduledTimeSlot,
          item_status: 'scheduled',
          item_notes: `Manually scheduled by admin for ${scheduledDate} at ${scheduledTimeSlot}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Scheduling failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Task scheduled successfully:', result);
      
      await fetchData(); // Refresh orders data
      setNotification({
        type: 'success', 
        message: `${showScheduleModal.serviceName} scheduled for ${scheduledDate} at ${scheduledTimeSlot}`
      });
      
      // Check if all tasks in the order are now scheduled and update order status
      const currentOrder = orders.find(order => order.id === showScheduleModal.orderId);
      if (currentOrder && currentOrder.status === 'confirmed') {
        // Check if all items will be scheduled after this update
        const allItemsScheduled = currentOrder.items.every(item => 
          item.id === showScheduleModal.itemId || // Current item being scheduled
          item.status === 'scheduled' || // Already scheduled items
          ((item as any).scheduled_date && (item as any).scheduled_time_slot) // Has scheduling data
        );
        
        if (allItemsScheduled) {
          // Auto-update order status to scheduled
          await handleOrderStatusUpdate(showScheduleModal.orderId, 'scheduled');
        }
      }
      
      // Reset form
      setShowScheduleModal(null);
      setScheduledDate('');
      setScheduledTimeSlot('');
    } catch (error) {
      console.error('❌ Failed to schedule task:', error);
      setNotification({
        type: 'error', 
        message: `Failed to schedule task: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setScheduleLoading(false);
    }
  };
  */

  // Handle auto-assignment for entire order
  const handleAutoAssignOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Auto-assignment failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Order auto-assigned successfully:', result);
      
      // After successful auto-assignment, update all assigned items to in_progress
      try {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const updatePromises = order.items.map(async (item) => {
            const currentStatus = item.status || 'pending';
            try {
              const statusResponse = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  item_status: 'scheduled',
                  item_notes: `Task moved from ${currentStatus} to scheduled after auto-assignment`
                }),
              });
              
              if (statusResponse.ok) {
                console.log(`✅ Task "${item.service_name}" status: ${currentStatus} → scheduled`);
              } else {
                console.warn(`⚠️ Failed to update status for ${item.service_name}`);
              }
            } catch (itemError) {
              console.warn(`⚠️ Status update failed for ${item.service_name}:`, itemError);
            }
          });
          
          await Promise.allSettled(updatePromises);
        }
      } catch (statusError) {
        console.warn('⚠️ Auto-assignment succeeded but some status updates failed:', statusError);
      }
      
      await fetchData(); // Refresh orders data
      
      // Auto-move order to scheduled status if it was confirmed and all tasks are now assigned
      try {
        // Get fresh order data to check status
        const orderResponse = await fetch(`/api/orders/${orderId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          const freshOrder = orderData.data || orderData;
          
          if (freshOrder && freshOrder.status === 'confirmed') {
            console.log('✅ All tasks auto-assigned - Auto-moving order to scheduled status');
            await handleOrderStatusUpdate(orderId, 'scheduled');
          }
        }
      } catch (autoScheduleError) {
        console.warn('⚠️ Failed to auto-move order to scheduled status:', autoScheduleError);
        // Don't fail the auto-assignment if auto-scheduling fails
      }
      
      setNotification({type: 'success', message: 'All tasks auto-assigned and moved to scheduled! Order status updated to scheduled.'});
    } catch (error) {
      console.error('❌ Failed to auto-assign order:', error);
      setNotification({type: 'error', message: `Failed to auto-assign order: ${error instanceof Error ? error.message : 'Unknown error'}`});
    }
  };

  // Handle starting scheduled order with validation
  const handleStartScheduledOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        setNotification({type: 'error', message: 'Order not found'});
        return;
      }

      // Check if all tasks have scheduled times configured
      const unscheduledTasks = order.items?.filter(item => {
        const hasDate = (item as any).scheduled_date;
        const hasTimeSlot = (item as any).scheduled_time_slot;
        return !hasDate || !hasTimeSlot;
      }) || [];

      if (unscheduledTasks.length > 0) {
        const taskDetails = unscheduledTasks.map(task => {
          const hasDate = (task as any).scheduled_date;
          const hasTimeSlot = (task as any).scheduled_time_slot;
          const missing = [];
          if (!hasDate) missing.push('date');
          if (!hasTimeSlot) missing.push('time slot');
          return `${task.service_name || 'Unknown Task'} (missing: ${missing.join(', ')})`;
        }).join('; ');
        
        setOrderError(orderId, `⚠️ Cannot start order! ${unscheduledTasks.length} task(s) need scheduling: ${taskDetails}. Please set dates and times first.`);
        return;
      }

      // All tasks are scheduled, proceed to start
      clearOrderError(orderId); // Clear any previous errors
      await handleOrderStatusUpdate(orderId, 'in_progress');
      
      // Update all task statuses from scheduled to in_progress
      try {
        const updatePromises = order.items.map(async (item) => {
          try {
            const statusResponse = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                item_status: 'in_progress',
                item_notes: `Task moved from scheduled to in_progress when order started`
              }),
            });
            
            if (statusResponse.ok) {
              console.log(`✅ Task "${item.service_name}" status: scheduled → in_progress`);
            } else {
              console.warn(`⚠️ Failed to update status for ${item.service_name}`);
            }
          } catch (itemError) {
            console.warn(`⚠️ Status update failed for ${item.service_name}:`, itemError);
          }
        });
        
        await Promise.allSettled(updatePromises);
      } catch (taskStatusError) {
        console.warn('⚠️ Order started but some task status updates failed:', taskStatusError);
      }
      
      setNotification({type: 'success', message: 'Order started successfully! All tasks are now in progress.'});
    } catch (error) {
      console.error('❌ Failed to start scheduled order:', error);
      setNotification({type: 'error', message: 'Failed to start order. Please try again.'});
    }
  };

  // Handle status update with reason
  const handleStatusUpdateWithReason = async () => {
    if (!showStatusModal || !selectedNewStatus) {
      setNotification({type: 'error', message: 'Please select a status'});
      return;
    }

    // Validate reason for postponed and cancelled
    if (selectedNewStatus === 'postponed' || selectedNewStatus === 'cancelled') {
      if (!statusChangeReason.trim()) {
        setNotification({type: 'error', message: `Please provide a reason for ${selectedNewStatus} status`});
        return;
      }
      
      // Check minimum word count (10 words)
      const wordCount = statusChangeReason.trim().split(/\s+/).length;
      if (wordCount < 10) {
        setNotification({type: 'error', message: `Reason must be at least 10 words. Current: ${wordCount} words`});
        return;
      }
    }

    try {
      setStatusUpdateLoading(true);
      
      const result = await updateOrderStatus(showStatusModal.orderId, selectedNewStatus as any, statusChangeReason);
      
      if (result) {
        await fetchData(); // Refresh data from backend
        setNotification({
          type: 'success', 
          message: `Order ${showStatusModal.orderNumber} status updated to ${selectedNewStatus}${statusChangeReason ? ` (Reason: ${statusChangeReason})` : ''}`
        });
        
        // Reset modal
        setShowStatusModal(null);
        setSelectedNewStatus('');
        setStatusChangeReason('');
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({type: 'error', message: 'Failed to update order status. Please try again.'});
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle resuming postponed order from pending status
  const handleResumeFromPending = async (orderId: string) => {
    try {
      console.log(`🔄 Resuming postponed order ${orderId} from pending status...`);
      
      // Update order status back to pending
      const result = await updateOrderStatus(orderId, 'pending', 'Order resumed from postponed status - restarting workflow');
      
      if (result) {
        console.log(`✅ Order ${orderId} resumed successfully`);
        
        // Reset all item statuses to pending to restart the workflow
        try {
          const order = orders.find(o => o.id === orderId);
          if (order && order.items) {
            console.log(`🔄 Resetting ${order.items.length} item statuses to pending...`);
            
            const itemUpdatePromises = order.items.map(async (item) => {
              try {
                const response = await fetch(`/api/orders/${orderId}/items/${item.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    item_status: 'pending',
                    item_notes: `${item.item_notes || ''}\\n[${new Date().toISOString().substring(0, 10)}] Order resumed - reset to pending for workflow restart`
                  }),
                });
                
                if (response.ok) {
                  console.log(`✅ Item ${item.service_name} status reset to pending`);
                } else {
                  console.warn(`⚠️ Failed to reset item ${item.service_name} status:`, response.status);
                }
              } catch (itemError) {
                console.warn(`⚠️ Item reset failed for ${item.service_name}:`, itemError);
              }
            });
            
            await Promise.allSettled(itemUpdatePromises);
            console.log(`✅ All item statuses reset for order ${orderId}`);
          }
        } catch (itemsError) {
          console.warn('⚠️ Failed to reset some item statuses:', itemsError);
          // Don't fail the order update if item updates fail
        }
        
        // Immediately update local state for better UX
        setOrders(prevOrders => prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              status: 'pending' as const,
              // Reset all item statuses to pending
              items: order.items.map(item => ({
                ...item,
                status: 'pending' as const,
                item_status: 'pending' as const
              }))
            };
          }
          return order;
        }));
        
        await fetchData(); // Refresh data from backend
        setNotification({
          type: 'success', 
          message: `Order resumed successfully! Status changed from postponed to pending. All tasks reset to pending for workflow restart.`
        });
      } else {
        throw new Error('Failed to resume order from postponed status');
      }
    } catch (error) {
      console.error('Error resuming postponed order:', error);
      setNotification({
        type: 'error', 
        message: 'Failed to resume order. Please try again.'
      });
    }
  };

  // Handle order history display - Currently unused, keeping for future feature
  /*
  const toggleOrderHistory = async (orderId: string) => {
    if (showHistory === orderId) {
      // Hide history if already showing
      setShowHistory(null);
      return;
    }

    // Check if we already have the history cached
    if (orderHistory[orderId]) {
      setShowHistory(orderId);
      return;
    }

    // Fetch history from API
    try {
      setHistoryLoading(orderId);
      const history = await getOrderHistory(orderId);
      
      if (history) {
        setOrderHistory(prev => ({
          ...prev,
          [orderId]: history
        }));
        setShowHistory(orderId);
      } else {
        setNotification({
          type: 'error', 
          message: 'Failed to load order history. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch order history:', error);
      setNotification({
        type: 'error', 
        message: 'Failed to load order history. Please try again.'
      });
    } finally {
      setHistoryLoading(null);
    }
  };
  */

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
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center animate-bounce-in">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-border mx-auto"></div>
              <div className="absolute inset-3 bg-white rounded-full"></div>
              <div className="absolute inset-4 animate-pulse bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 rounded-full"></div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Loading Orders
                </h3>
                <p className="text-gray-600 font-medium">Fetching latest order data and business intelligence...</p>
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

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => getEffectiveOrderStatus(o) === 'pending').length,
    scheduled: orders.filter(o => getEffectiveOrderStatus(o) === 'scheduled').length,
    inProgress: orders.filter(o => getEffectiveOrderStatus(o) === 'in_progress').length,
    completed: orders.filter(o => getEffectiveOrderStatus(o) === 'completed').length,
    totalRevenue: Math.round(orders
      .filter(o => getEffectiveOrderStatus(o) === 'completed') // Only count completed orders for revenue
      .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0))
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Enhanced Inline Notification */}
          {notification && (
            <div className={`rounded-2xl p-4 border-2 shadow-2xl backdrop-blur-sm animate-bounce-in relative overflow-hidden ${
              notification.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
              notification.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
              'bg-blue-50/90 border-blue-200 text-blue-800'
            }`}>
              <div className={`absolute inset-0 opacity-20 ${
                notification.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                notification.type === 'error' ? 'bg-gradient-to-r from-red-400 to-rose-400' :
                'bg-gradient-to-r from-blue-400 to-indigo-400'
              }`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-3 p-2 rounded-xl shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    <span className="text-white text-lg">
                      {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
                    </span>
                  </div>
                  <span className="font-bold text-base">{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className={`ml-4 p-2 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 ${
                    notification.type === 'success' ? 'hover:bg-green-100' :
                    notification.type === 'error' ? 'hover:bg-red-100' :
                    'hover:bg-blue-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* Modern Header Section */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-8 shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-white/20 rounded-2xl p-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Orders Management</h1>
                      <p className="text-indigo-100 text-lg">Monitor and manage all customer service orders</p>
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{orders.length}</div>
                      <div className="text-sm text-indigo-100">Total Orders</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Orders */}
          <div className="group stats-3d">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 icon-3d">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{orderStats.total}</p>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="group stats-3d">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-3 icon-3d">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{orderStats.pending}</p>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">Need attention</p>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="group stats-3d">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-3 icon-3d">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{orderStats.inProgress}</p>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">Active work</p>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="group stats-3d">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 icon-3d">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹{orderStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Completed orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter & Actions Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <h3 className="text-xl font-bold text-gray-900">
                Order Filters 
                <span className="text-sm font-normal text-gray-600 ml-2">• Filter and manage orders by status</span>
              </h3>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchData}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm flex items-center space-x-2 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-sm flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {/* Enhanced Status Filter Pills */}
          <div className="flex overflow-x-auto gap-3 pb-2" style={{scrollbarWidth: 'thin'}}>
            {(['all', 'pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'] as const).map(status => {
              const count = status === 'all' ? orders.length : orders.filter(o => getEffectiveOrderStatus(o) === status).length;
              const isActive = statusFilter === status;
              
              return (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    fetchData();
                  }}
                  className={`group relative flex-shrink-0 px-3 py-2 rounded-xl font-medium text-xs transition-all duration-200 transform hover:scale-105 whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>
                      {status === 'all' ? 'All' : formatStatusForDisplay(status)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[18px] text-center ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List with Compact Layout */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01" />
                </svg>
                Orders ({filteredOrders.length})
              </h3>
              {filteredOrders.length > 0 && (
                <div className="text-sm text-gray-600">
                  Showing {formatStatusForDisplay(statusFilter)} orders
                </div>
              )}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
                <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6m-7-7h.01M8 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                {statusFilter === 'all' ? 'No Orders Displaying' : `No ${formatStatusForDisplay(statusFilter)} Orders`}
              </h3>
              <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
                {orders.length === 0 
                  ? 'No orders found in database. Check backend connection.' 
                  : statusFilter === 'all'
                    ? 'Orders exist but not displaying. Check processing logic.'
                    : `No orders with "${formatStatusForDisplay(statusFilter)}" status found. Try a different filter.`}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg mr-4"
                >
                  View All Orders
                </button>
              )}
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  fetchData();
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🔄 Reload Orders
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id}>
                  {/* Order-specific Error Message */}
                  {orderErrors[order.id] && (
                    <div className="mb-3 rounded-xl p-3 border-2 bg-red-50/95 border-red-200 text-red-800 shadow-md animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-3 text-lg">❌</span>
                          <span className="font-semibold text-sm">{orderErrors[order.id]}</span>
                        </div>
                        <button
                          onClick={() => clearOrderError(order.id)}
                          className="ml-4 p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div 
                    className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-4 lg:p-6 group card-3d"
                  >
                  {/* Order Header with Inline Actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2 icon-3d">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 truncate mb-1">
                          #{order.order_number || `HH${order.id.slice(0, 3).toUpperCase()}`}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                            {order.customer_name}
                          </span>
                          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            ₹{order.total_amount?.toLocaleString() || 0}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            📞 {order.customer_phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Inline Status and Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(getEffectiveOrderStatus(order))}`}>
                        {getStatusDisplayName(getEffectiveOrderStatus(order))}
                      </span>
                      
                      {/* Inline Action Buttons - Conditional based on order status */}
                      {/* Status button only for pending orders */}
                      {getEffectiveOrderStatus(order) === 'pending' && (
                        <button
                          onClick={() => setShowStatusModal({
                            orderId: order.id,
                            orderNumber: order.order_number || `HH${order.id.slice(0, 3).toUpperCase()}`
                          })}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Status</span>
                        </button>
                      )}
                      
                      {/* Auto button only for confirmed orders */}
                      {getEffectiveOrderStatus(order) === 'confirmed' && (
                        <button
                          onClick={() => handleAutoAssignOrder(order.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Auto</span>
                        </button>
                      )}
                      
                      {/* Start button for scheduled orders (only show when all tasks are scheduled) */}
                      {getEffectiveOrderStatus(order) === 'scheduled' && (
                        <button
                          onClick={() => handleStartScheduledOrder(order.id)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Start Work</span>
                        </button>
                      )}
                      
                      {/* Resume from Pending option for postponed orders */}
                      {getEffectiveOrderStatus(order) === 'postponed' && (
                        <button
                          onClick={() => handleResumeFromPending(order.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Resume</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setShowDetailsInline(showDetailsInline === order.id ? null : order.id)}
                        className="bg-violet-500 hover:bg-violet-600 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>
                          {(showDetailsInline === order.id || getEffectiveOrderStatus(order) === 'scheduled') ? 'Hide' : 'Details'}
                        </span>
                      </button>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const newValue = showCallOptions === order.id ? null : order.id;
                            console.log('📱 CALL Button Clicked!', {
                              orderId: order.id,
                              currentShowCallOptions: showCallOptions,
                              newValue: newValue,
                              willShow: newValue !== null
                            });
                            setShowCallOptions(newValue);
                          }}
                          className="call-button bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-medium py-1 px-3 rounded-full transition-colors duration-200 text-xs flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>CALL</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Call Options Dropdown - Compact Size */}
                        {showCallOptions === order.id && (
                          <div 
                            className="call-dropdown absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border-2 border-gray-300 p-3 z-[9999] min-w-44"
                            style={{
                              position: 'absolute',
                              bottom: '100%',
                              right: '0',
                              marginBottom: '8px',
                              zIndex: 9999,
                              backgroundColor: 'white',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-xs font-bold text-gray-800 mb-2 text-center">
                              📞 Contact Customer
                            </div>
                            <div className="text-xs text-gray-600 mb-3 text-center border-b border-gray-200 pb-2">
                              📱 {order.customer_phone || 'No Phone'}
                            </div>
                            <div className="space-y-2">
                              {/* WhatsApp Call */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('📞 WhatsApp Call Button Clicked!');
                                  
                                  const rawPhone = order.customer_phone || '';
                                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                                  
                                  console.log('📞 Processing WhatsApp Call:', {
                                    rawPhone,
                                    cleanPhone,
                                    customerName: order.customer_name
                                  });
                                  
                                  if (cleanPhone && cleanPhone.length >= 10) {
                                    let formattedPhone = cleanPhone;
                                    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
                                      formattedPhone = '91' + formattedPhone;
                                    }
                                    
                                    const whatsappURL = `https://wa.me/${formattedPhone}`;
                                    console.log('📞 Opening WhatsApp URL:', whatsappURL);
                                    
                                    try {
                                      window.open(whatsappURL, '_blank');
                                      setNotification({type: 'success', message: `Opening WhatsApp for ${order.customer_name}`});
                                      setShowCallOptions(null);
                                    } catch (error) {
                                      console.error('Failed to open WhatsApp:', error);
                                      setNotification({type: 'error', message: 'Failed to open WhatsApp. Please try again.'});
                                    }
                                  } else {
                                    setNotification({type: 'error', message: 'Invalid phone number'});
                                  }
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                                </svg>
                                <span>WhatsApp</span>
                              </button>
                              
                              {/* WhatsApp Message */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('💬 WhatsApp Message Button Clicked!');
                                  
                                  const rawPhone = order.customer_phone || '';
                                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
                                  
                                  console.log('💬 Processing WhatsApp Message:', {
                                    rawPhone,
                                    cleanPhone,
                                    customerName: order.customer_name
                                  });
                                  
                                  if (cleanPhone && cleanPhone.length >= 10) {
                                    let formattedPhone = cleanPhone;
                                    if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
                                      formattedPhone = '91' + formattedPhone;
                                    }
                                    
                                    const message = `Hi ${order.customer_name || 'Customer'}, this is Happy Homes regarding your order #${order.order_number || order.id.slice(0, 8).toUpperCase()}. We wanted to update you on your service status. Thank you!`;
                                    
                                    const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
                                    console.log('💬 Opening WhatsApp Message URL:', whatsappURL);
                                    
                                    try {
                                      window.open(whatsappURL, '_blank');
                                      setNotification({type: 'success', message: `Opening WhatsApp message for ${order.customer_name}`});
                                      setShowCallOptions(null);
                                    } catch (error) {
                                      console.error('Failed to open WhatsApp:', error);
                                      setNotification({type: 'error', message: 'Failed to open WhatsApp. Please try again.'});
                                    }
                                  } else {
                                    setNotification({type: 'error', message: 'Invalid phone number'});
                                  }
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>Message</span>
                              </button>
                              
                              {/* Direct Phone Call */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('☎️ Direct Call Button Clicked!');
                                  
                                  const phoneNumber = order.customer_phone || '';
                                  console.log('☎️ Processing Direct Call:', {
                                    phoneNumber,
                                    customerName: order.customer_name
                                  });
                                  
                                  if (phoneNumber && phoneNumber.length >= 10) {
                                    const telURL = `tel:${phoneNumber}`;
                                    console.log('☎️ Opening Tel URL:', telURL);
                                    
                                    try {
                                      window.location.href = telURL;
                                      setShowCallOptions(null);
                                      setNotification({type: 'success', message: `Calling ${order.customer_name}...`});
                                    } catch (error) {
                                      console.error('Failed to initiate call:', error);
                                      setNotification({type: 'error', message: 'Failed to initiate call. Please try again.'});
                                    }
                                  } else {
                                    setNotification({type: 'error', message: 'Invalid phone number'});
                                  }
                                }}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>Phone</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Service Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Customer Info */}
                    <div className="panel-3d rounded-lg p-3 border border-violet-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-violet-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-semibold text-violet-800 text-xs">Customer</span>
                      </div>
                      <div className="text-violet-700 font-bold text-sm">{order.customer_name}</div>
                      <div className="text-violet-600 text-xs">{order.customer_phone}</div>
                    </div>
                    
                    {/* Address */}
                    <div className="panel-3d rounded-lg p-3 border border-fuchsia-200">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-fuchsia-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="font-semibold text-fuchsia-800 text-xs">Address</span>
                      </div>
                      <div className="text-fuchsia-700 font-bold text-xs leading-relaxed">
                        {(() => {
                          const serviceAddr = (order as any).service_address;
                          if (typeof serviceAddr === 'object' && serviceAddr !== null) {
                            const addr = serviceAddr;
                            const parts = [];
                            if (addr.area) parts.push(addr.area);
                            if (addr.city) parts.push(addr.city);
                            return parts.length > 0 ? parts.join(', ') : (order.customer_address || 'Address not provided');
                          }
                          return serviceAddr || order.customer_address || 'Address not provided';
                        })()}
                      </div>
                    </div>
                    
                    {/* Date & Schedule Times - Merged Panel */}
                    <div className="panel-3d rounded-lg p-3 border border-indigo-200 col-span-2 md:col-span-2">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold text-indigo-800 text-xs">Dates & Schedule</span>
                      </div>
                      
                      {/* Order Creation Date */}
                      <div className="mb-3 pb-2 border-b border-indigo-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-600 font-medium">Order Created:</span>
                          <span className="text-indigo-800 font-bold text-xs">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Scheduled Times per Task */}
                      <div className="space-y-1">
                        <div className="text-xs text-indigo-600 font-medium mb-1">Service Schedule:</div>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, index) => {
                            const scheduledDate = (item as any).scheduled_date;
                            const scheduledTime = (item as any).scheduled_time_slot;
                            
                            return (
                              <div key={item.id || index} className="flex items-center justify-between text-xs">
                                <div className="font-medium text-indigo-700 truncate flex-1 mr-2">
                                  {item.service_name}
                                </div>
                                <div className="text-indigo-600 font-medium text-right">
                                  {scheduledDate && scheduledTime ? (
                                    <>
                                      {new Date(scheduledDate).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })} • {scheduledTime.split('-')[0]}
                                    </>
                                  ) : scheduledDate ? (
                                    <>
                                      {new Date(scheduledDate).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })} • No time
                                    </>
                                  ) : (
                                    <span className="text-amber-600">Not scheduled</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-indigo-500 text-xs italic">No tasks available</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Postponed Order Alert */}
                  {getEffectiveOrderStatus(order) === 'postponed' && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl text-sm font-medium mb-4 shadow-md transform perspective-1000 rotateX-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.346 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>⏸️ Order Postponed - Use Resume button to restart workflow</span>
                        </div>
                        <span className="text-xs bg-orange-200 px-2 py-1 rounded-full font-bold">Paused</span>
                      </div>
                    </div>
                  )}
                  

                  {/* Inline Details - Auto-expand scheduled orders for scheduling access */}
                  {(showDetailsInline === order.id || getEffectiveOrderStatus(order) === 'scheduled') && (
                    <div className="mt-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-4 border border-indigo-200 shadow-lg">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-2 mr-3 shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Order Details
                          </h4>
                          <p className="text-indigo-600 font-semibold text-sm">
                            #{order.order_number || `HH${order.id.slice(0, 3).toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      
                      {/* Detailed Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="bg-gradient-to-br from-white via-indigo-50 to-purple-50 rounded-lg border border-indigo-200 overflow-hidden mb-4 shadow-md">
                          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 py-3">
                            <div className="flex items-center">
                              <div className="bg-white/20 rounded-lg p-2 mr-3">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-white">Service Breakdown</h5>
                                <p className="text-white/80 font-medium text-xs">{order.items.length} Service{order.items.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="space-y-3">
                              {order.items.map((item, index) => {
                                const itemPrice = Number(item.price) || Number(item.total_price) || Number(item.unit_price) || 0;
                                const itemQuantity = Number(item.quantity) || 1;
                                const totalPrice = Number(item.total_price) || (itemPrice * itemQuantity) || 0;
                                
                                return (
                                  <div key={item.id || index} className="bg-gradient-to-r from-white to-indigo-50 rounded-lg p-3 border border-indigo-100 shadow-sm">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                          </svg>
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="text-sm font-bold text-gray-900">{item.service_name || 'Service'}</h6>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-indigo-600 font-medium">Qty: {itemQuantity}</span>
                                            {(Number(item.unit_price) || 0) > 0 && (
                                              <>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-xs text-purple-600 font-medium">Rate: ₹{(Number(item.unit_price) || 0).toLocaleString()}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right flex items-center space-x-3">
                                        <div>
                                          <div className="text-lg font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                            {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : (
                                              (Number(item.unit_price) || 0) > 0 ? 
                                              `₹${((Number(item.unit_price) || 0) * itemQuantity).toLocaleString()}` : 
                                              '₹0'
                                            )}
                                          </div>
                                          {totalPrice === 0 && (Number(item.unit_price) || 0) === 0 && (
                                            <div className="text-xs text-orange-600 font-bold">Price TBD</div>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          <div className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                                            (order.status === 'cancelled' || item.status === 'cancelled') ? 'bg-red-100 text-red-700 border-red-300' :
                                            (getEffectiveOrderStatus(order) === 'completed' || item.status === 'completed') ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                            item.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                            item.status === 'assigned' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                            'bg-gray-100 text-gray-700 border-gray-300'
                                          }`}>
                                            {order.status === 'cancelled' ? 'CANCELLED' : 
                                             getEffectiveOrderStatus(order) === 'completed' ? 'COMPLETED' :
                                             (item.status || 'pending').toUpperCase()}
                                          </div>
                                          
                                          {/* Complete Task Button - Show for in_progress and scheduled tasks */}
                                          {(item.status === 'in_progress' || (item.status === 'scheduled' && getEffectiveOrderStatus(order) === 'in_progress')) && order.status !== 'cancelled' && getEffectiveOrderStatus(order) !== 'completed' && (
                                            <button
                                              onClick={() => handleCompleteTask(order.id, item.id, item.service_name)}
                                              className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-2 rounded-lg transition-colors duration-200 text-xs flex items-center space-x-1 shadow-sm hover:shadow-md transform hover:scale-105"
                                              title={`Mark ${item.service_name} as completed`}
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                              <span>Complete</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Sub-task Scheduling Controls - Only show for scheduled orders */}
                                    {getEffectiveOrderStatus(order) === 'scheduled' && (
                                      <div className="mt-3 pt-3 border-t border-indigo-200">
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
                                          <div className="flex items-center mb-3">
                                            <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h6 className="text-sm font-bold text-purple-800">Schedule: {item.service_name}</h6>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                            {/* Assigned Engineer Selection */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Engineer</label>
                                              <select
                                                value={(item as any).assigned_engineer_id || ''}
                                                onChange={async (e) => {
                                                  const newEngineerId = e.target.value;
                                                  const selectedEngineer = employees.find(emp => emp.id === newEngineerId);
                                                  
                                                  if (!selectedEngineer) {
                                                    setOrderError(order.id, 'Please select a valid engineer for this task');
                                                    return;
                                                  }
                                                  
                                                  try {
                                                    const response = await fetch(`/api/orders/${order.id}/items/${item.id}/assign`, {
                                                      method: 'POST',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      credentials: 'include',
                                                      body: JSON.stringify({
                                                        engineer_id: newEngineerId,
                                                        scheduled_date: new Date().toISOString(),
                                                        notes: `Engineer reassigned to ${selectedEngineer.name} by admin`
                                                      }),
                                                    });
                                                    if (response.ok) {
                                                      clearOrderError(order.id);
                                                      setNotification({type: 'success', message: `${selectedEngineer.name} assigned to ${item.service_name}`});
                                                      fetchData(); // Refresh
                                                    }
                                                  } catch (error) {
                                                    setOrderError(order.id, 'Failed to reassign engineer for this task');
                                                  }
                                                }}
                                                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              >
                                                <option value="">Select Engineer</option>
                                                {employees.map((engineer) => (
                                                  <option key={engineer.id} value={engineer.id}>
                                                    {engineer.name} {engineer.is_active ? '' : '(Inactive)'}
                                                  </option>
                                                ))}
                                              </select>
                                              {(item as any).assigned_engineer_name && (
                                                <div className="text-xs text-blue-600 mt-1 font-medium">
                                                  Current: {(item as any).assigned_engineer_name}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Date Selection */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Service Date 
                                                <span className="text-gray-500 font-normal">(today or later)</span>
                                              </label>
                                              <input
                                                type="date"
                                                value={(item as any).scheduled_date || ''}
                                                onChange={async (e) => {
                                                  const newDate = e.target.value;
                                                  
                                                  // Validate date is not in the past
                                                  const today = new Date().toISOString().split('T')[0];
                                                  if (newDate < today) {
                                                    setOrderError(order.id, 'Cannot schedule service for past dates. Please select today or a future date.');
                                                    e.target.value = ''; // Reset the input
                                                    return;
                                                  }
                                                  
                                                  try {
                                                    const response = await fetch(`/api/orders/${order.id}/items/${item.id}`, {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      credentials: 'include',
                                                      body: JSON.stringify({
                                                        scheduled_date: newDate,
                                                        item_notes: `Date updated to ${newDate} by admin`
                                                      }),
                                                    });
                                                    if (response.ok) {
                                                      clearOrderError(order.id);
                                                      setNotification({type: 'success', message: `Date set for ${item.service_name}`});
                                                      
                                                      // Check if current time slot is still valid for the new date
                                                      const currentTimeSlot = (item as any).scheduled_time_slot;
                                                      if (currentTimeSlot) {
                                                        const availableSlots = getAvailableTimeSlots(newDate);
                                                        const isCurrentSlotValid = availableSlots.some(slot => slot.value === currentTimeSlot);
                                                        
                                                        if (!isCurrentSlotValid) {
                                                          // Clear the invalid time slot
                                                          try {
                                                            await fetch(`/api/orders/${order.id}/items/${item.id}`, {
                                                              method: 'PUT',
                                                              headers: { 'Content-Type': 'application/json' },
                                                              credentials: 'include',
                                                              body: JSON.stringify({
                                                                scheduled_time_slot: null,
                                                                item_notes: `Time slot cleared due to date change - was no longer available`
                                                              }),
                                                            });
                                                            setNotification({type: 'info', message: `Time slot cleared - please select a new time slot for ${item.service_name}`});
                                                          } catch (clearError) {
                                                            console.warn('Failed to clear invalid time slot:', clearError);
                                                          }
                                                        }
                                                      }
                                                      
                                                      fetchData(); // Refresh
                                                    }
                                                  } catch (error) {
                                                    setOrderError(order.id, 'Failed to update date for this task');
                                                  }
                                                }}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                              />
                                            </div>
                                            
                                            {/* Time Slot Selection */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Time Slot
                                                <span className="text-gray-500 font-normal">
                                                  {(() => {
                                                    const selectedDate = (item as any).scheduled_date;
                                                    const today = new Date().toISOString().split('T')[0];
                                                    if (selectedDate === today) {
                                                      return ' (30+ min remaining)';
                                                    }
                                                    return '';
                                                  })()}
                                                </span>
                                              </label>
                                              <select
                                                value={(item as any).scheduled_time_slot || ''}
                                                onChange={async (e) => {
                                                  const newTimeSlot = e.target.value;
                                                  const selectedDate = (item as any).scheduled_date;
                                                  
                                                  // Validate time slot for today's date
                                                  if (selectedDate) {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    if (selectedDate === today) {
                                                      const availableSlots = getAvailableTimeSlots(selectedDate);
                                                      const isValidSlot = availableSlots.some(slot => slot.value === newTimeSlot);
                                                      
                                                      if (!isValidSlot) {
                                                        setOrderError(order.id, 'Cannot schedule service for past time slots. Please select a time slot with at least 30 minutes remaining.');
                                                        return;
                                                      }
                                                    }
                                                  }
                                                  
                                                  try {
                                                    const response = await fetch(`/api/orders/${order.id}/items/${item.id}`, {
                                                      method: 'PUT',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      credentials: 'include',
                                                      body: JSON.stringify({
                                                        scheduled_time_slot: newTimeSlot,
                                                        item_notes: `Time slot updated to ${newTimeSlot} by admin`
                                                      }),
                                                    });
                                                    if (response.ok) {
                                                      clearOrderError(order.id);
                                                      setNotification({type: 'success', message: `Time slot set for ${item.service_name}`});
                                                      fetchData(); // Refresh
                                                    }
                                                  } catch (error) {
                                                    setOrderError(order.id, 'Failed to update time slot for this task');
                                                  }
                                                }}
                                                className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                              >
                                                <option value="">
                                                  {(() => {
                                                    const availableSlots = getAvailableTimeSlots((item as any).scheduled_date || '');
                                                    const selectedDate = (item as any).scheduled_date;
                                                    const today = new Date().toISOString().split('T')[0];
                                                    
                                                    if (selectedDate === today && availableSlots.length === 0) {
                                                      return 'No slots available (need 30+ min remaining)';
                                                    }
                                                    return 'Select time slot';
                                                  })()}
                                                </option>
                                                {getAvailableTimeSlots((item as any).scheduled_date || '').map(slot => (
                                                  <option key={slot.value} value={slot.value}>
                                                    {slot.label}
                                                  </option>
                                                ))}
                                              </select>
                                              {(() => {
                                                const selectedDate = (item as any).scheduled_date;
                                                const today = new Date().toISOString().split('T')[0];
                                                const availableSlots = getAvailableTimeSlots(selectedDate || '');
                                                
                                                if (selectedDate === today && availableSlots.length === 0) {
                                                  return (
                                                    <div className="text-xs text-orange-600 mt-1 font-medium">
                                                      ⏰ No time slots available for today (need 30+ min remaining in slot). Please select a future date.
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              })()}
                                            </div>
                                          </div>
                                          
                                          {/* Schedule Status and Actions */}
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              {(item as any).scheduled_date && (item as any).scheduled_time_slot ? (
                                                <div className="flex items-center text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full border border-green-300">
                                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                  <span>Scheduled for {(item as any).scheduled_date} at {(item as any).scheduled_time_slot}</span>
                                                </div>
                                              ) : (
                                                <div className="flex items-center text-xs text-amber-700 bg-amber-100 px-3 py-2 rounded-full border border-amber-300">
                                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <span>Please set date and time to complete scheduling</span>
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Task Completion Button in Scheduling Section */}
                                            {((item.status === 'in_progress' || item.status === 'scheduled') && getEffectiveOrderStatus(order) === 'in_progress' && getEffectiveOrderStatus(order) !== 'completed') && (
                                              <div className="ml-3">
                                                <button
                                                  onClick={() => handleCompleteTask(order.id, item.id, item.service_name)}
                                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 text-xs flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                  title={`Complete ${item.service_name} task`}
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <span>Mark Complete</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Employee Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50 animate-bounce-in">
              <div className="p-6 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-t-3xl relative overflow-hidden">
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="text-center mb-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Assign Employee</h3>
                  <p className="text-gray-700 font-medium">Select an employee to assign to <span className="font-bold text-purple-600">{showAssignModal.serviceName}</span></p>
                </div>

                <div className="space-y-4 mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-3">Available Employees ({employees.length})</label>
                    {employees.length === 0 ? (
                      <div className="text-center p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <p className="text-gray-600 font-medium">No employees available. Please add employees first.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {employees.map((employee) => (
                          <label key={employee.id} className="group flex items-center p-4 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-[1.02]">
                            <input
                              type="radio"
                              name="employee"
                              value={employee.id}
                              checked={selectedEmployee === employee.id}
                              onChange={(e) => setSelectedEmployee(e.target.value)}
                              className="mr-4 text-blue-600 focus:ring-blue-500 scale-125"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{employee.name}</div>
                              <div className="text-sm text-gray-600">
                                📧 {employee.email} • 📞 {employee.phone}
                              </div>
                              {employee.expertise_areas && employee.expertise_areas.length > 0 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  🛠️ Skills: {employee.expertise_areas.join(', ')}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                ⭐ Rating: {employee.rating || 'N/A'} • ✅ Jobs: {employee.completed_jobs || 0}
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                              employee.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm p-4 rounded-b-3xl border-t border-white/20">
                  <button
                    onClick={() => {
                      setShowAssignModal(null);
                      setSelectedEmployee('');
                    }}
                    className="group relative flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">Cancel</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedEmployee && showAssignModal) {
                        handleAssignEmployee(showAssignModal.orderId, showAssignModal.itemId, selectedEmployee);
                      }
                    }}
                    disabled={!selectedEmployee || assignmentLoading}
                    className="group relative flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">{assignmentLoading ? 'Assigning...' : 'Assign Employee'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50 animate-bounce-in">
              <div className="p-6 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-t-3xl relative overflow-hidden">
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="text-center mb-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Update Order Status</h3>
                  <p className="text-gray-700 font-medium">Change status for Order <span className="font-bold text-purple-600">#{showStatusModal.orderNumber}</span></p>
                </div>

                <div className="space-y-4 mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-3">New Status</label>
                    <select
                      value={selectedNewStatus}
                      onChange={(e) => setSelectedNewStatus(e.target.value)}
                      className="w-full p-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                      required
                    >
                      <option value="">Select status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>

                  {(selectedNewStatus === 'cancelled' || selectedNewStatus === 'postponed') && (
                    <div>
                      <label className="block text-base font-bold text-gray-800 mb-3">
                        Reason <span className="text-red-500 font-bold">*</span>
                        <span className="text-sm text-gray-600 font-medium">(minimum 10 words)</span>
                      </label>
                      <textarea
                        value={statusChangeReason}
                        onChange={(e) => setStatusChangeReason(e.target.value)}
                        placeholder={`Please provide a detailed reason for ${selectedNewStatus} this order...`}
                        rows={4}
                        className="w-full p-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 resize-none font-medium shadow-sm hover:shadow-md"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Word count: {statusChangeReason.trim().split(/\s+/).filter(word => word.length > 0).length}
                      </div>
                    </div>
                  )}

                  {selectedNewStatus && statusChangeReason && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 shadow-md">
                      <p className="text-base text-indigo-800 font-medium">
                        <strong className="font-bold">Summary:</strong><br/>
                        Order #{showStatusModal.orderNumber} will be marked as <span className="font-bold uppercase text-purple-600">{selectedNewStatus}</span>
                        {statusChangeReason && <><br/>Reason: {statusChangeReason}</>}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm p-4 rounded-b-3xl border-t border-white/20">
                  <button
                    onClick={() => {
                      setShowStatusModal(null);
                      setSelectedNewStatus('');
                      setStatusChangeReason('');
                    }}
                    className="group relative flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">Cancel</span>
                  </button>
                  <button
                    onClick={handleStatusUpdateWithReason}
                    disabled={!selectedNewStatus || statusUpdateLoading}
                    className="group relative flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">{statusUpdateLoading ? 'Updating...' : 'Update Status'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default OrdersManagement;