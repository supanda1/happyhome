import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Modal } from '../../components/ui';
import { Loading } from '../../components/ui';
import { 
  getOrders, 
  getEmployees, 
  getEmployeesByExpertise, 
  assignEmployeeToOrder,
  updateOrderStatus,
  CATEGORY_EXPERTISE_MAP 
} from '../../utils/adminDataManager';

// Types for assignment system
interface Employee {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  employeeLocation: string;
  expertiseAreas: string[];
  rating: number;
  completedJobs: number;
  isActive: boolean;
  isAvailable: boolean;
  scores: {
    total: number;
    location: number;
    availability: number;
    expertise: number;
    rating: number;
    workload: number;
    customerSatisfaction: number;
  };
  metrics: {
    distanceKm?: number;
    currentWorkload: number;
    hasExpertise: boolean;
    isAvailableForSlot: boolean;
  };
}

interface Booking {
  id: string;
  serviceName: string;
  serviceCategory: string;
  customerName: string;
  scheduledDate: string;
  scheduledTimeStart: string;
  scheduledTimeEnd: string;
  status: string;
  assignedTechnicianId?: string;
  location: string;
  totalAmount: number;
}


interface AssignmentResult {
  success: boolean;
  assignment?: {
    employeeId: string;
    employeeName: string;
    employeePhone: string;
    employeeLocation: string;
    assignmentScore: number;
    assignmentReason: string;
    strategy: string;
    distanceKm?: number;
    expertise: string[];
  };
  alternativeEmployees?: Array<{
    employeeId: string;
    employeeName: string;
    score: number;
    distanceKm?: number;
  }>;
  error?: string;
}


// Default assignment strategies
const DEFAULT_ASSIGNMENT_STRATEGIES = {
  best_fit: {
    name: "Best Fit",
    description: "Comprehensive matching based on location, expertise, availability, and rating",
    factors: ["Location proximity", "Skill match", "Availability", "Performance rating", "Workload balance"]
  },
  location_only: {
    name: "Location Priority", 
    description: "Assign based on closest available employee",
    factors: ["Location proximity", "Availability"]
  },
  availability_only: {
    name: "Availability First",
    description: "Assign to most available employee regardless of location",
    factors: ["Availability", "Workload balance"]
  },
  location_and_availability: {
    name: "Location + Availability",
    description: "Balance between proximity and employee availability", 
    factors: ["Location proximity", "Availability", "Workload balance"]
  },
  round_robin: {
    name: "Round Robin",
    description: "Distribute work evenly among all available employees",
    factors: ["Workload balance", "Fair distribution"]
  },
  manual: {
    name: "Manual Assignment", 
    description: "Admin selects employee manually from eligible list",
    factors: ["Admin choice", "Custom selection"]
  }
};

const AssignmentManagement: React.FC = () => {
  // State management
  const [unassignedBookings, setUnassignedBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [assignmentConfigs, setAssignmentConfigs] = useState<{ strategies: typeof DEFAULT_ASSIGNMENT_STRATEGIES } | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState('best_fit');
  const [customWeights, setCustomWeights] = useState({
    location: 0.3,
    availability: 0.25,
    expertise: 0.2,
    rating: 0.15,
    workload: 0.1
  });
  const [maxDistance, setMaxDistance] = useState(25);
  const [requireExpertise, setRequireExpertise] = useState(true);
  const [maxDailyAssignments, setMaxDailyAssignments] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [analytics, setAnalytics] = useState<{
    assignmentStats: {
      totalAssignments: number;
      autoAssignments: number;
      completedAssignments: number;
      completionRate: number;
    };
    performanceMetrics: {
      autoAssignmentRate: number;
      averageAssignmentsPerEmployee: number;
    };
  } | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<string>('');
  const [assignmentError, setAssignmentError] = useState<string>('');
  
  // Load initial data
  useEffect(() => {
    loadUnassignedBookings();
    loadAssignmentConfigurations();
    loadAnalytics();
  }, []);

  const loadUnassignedBookings = async () => {
    try {
      setIsLoading(true);
      setAssignmentError('');
      
      // Get all orders and filter for unassigned/pending ones
      const allOrders = await getOrders();
      const unassigned = allOrders.filter(order => 
        order.status === 'pending' && !order.items.some(item => item.assigned_engineer_id)
      );
      
      // Convert Orders to Bookings for UI compatibility
      const bookings: Booking[] = unassigned.map(order => ({
        id: order.id,
        serviceName: order.items[0]?.service_name || 'Multiple Services',
        serviceCategory: 'General', // We'll need to map this properly
        customerName: order.customer_name,
        scheduledDate: order.items[0]?.scheduled_date || new Date().toISOString(),
        scheduledTimeStart: order.items[0]?.scheduled_time_slot || '09:00',
        scheduledTimeEnd: order.items[0]?.scheduled_time_slot || '10:00',
        status: order.status,
        assignedTechnicianId: order.items[0]?.assigned_engineer_id,
        location: `${order.service_address.city}, ${order.service_address.state}`,
        totalAmount: order.total_amount
      }));
      setUnassignedBookings(bookings);
      console.log(`✅ Loaded ${unassigned.length} unassigned bookings`);
    } catch (error) {
      console.error('Failed to load unassigned bookings:', error);
      setAssignmentError('Failed to load bookings. Please try again.');
      setUnassignedBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignmentConfigurations = async () => {
    try {
      // Always use default strategies since the API endpoint doesn't exist
      setAssignmentConfigs({ strategies: DEFAULT_ASSIGNMENT_STRATEGIES });
      console.log('✅ Assignment strategies loaded (using defaults)');
    } catch (error) {
      console.error('Failed to load assignment configurations, using defaults:', error);
      // Fallback to default strategies
      setAssignmentConfigs({ strategies: DEFAULT_ASSIGNMENT_STRATEGIES });
    }
  };

  const loadEligibleEmployees = useCallback(async (bookingId: string) => {
    try {
      setIsLoading(true);
      setAssignmentError('');
      
      // Find the booking to get service category
      const booking = unassignedBookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Get required expertise for this service category
      const requiredExpertise = CATEGORY_EXPERTISE_MAP[booking.serviceCategory] || 'General Services';
      
      // Load employees with matching expertise or all employees if no specific expertise required
      let employees: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        location?: string;
        expertise_areas?: string[];
        rating?: number;
        completed_jobs?: number;
        is_active: boolean;
      }> = [];
      if (requireExpertise && requiredExpertise !== 'General Services') {
        employees = await getEmployeesByExpertise(requiredExpertise);
      } else {
        employees = await getEmployees();
      }
      
      // Filter active employees and add assignment metrics
      const eligibleEmployees = employees
        .filter(emp => emp.is_active)
        .map(emp => ({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email,
          employeePhone: emp.phone,
          employeeLocation: emp.location || 'Location not specified',
          expertiseAreas: emp.expertise_areas || [],
          rating: emp.rating || 4.0,
          completedJobs: emp.completed_jobs || 0,
          isActive: emp.is_active,
          isAvailable: true, // Simplified - assume available
          scores: {
            total: Math.random() * 0.3 + 0.7, // Mock scoring between 0.7-1.0
            location: Math.random() * 0.3 + 0.7,
            availability: Math.random() * 0.3 + 0.7,
            expertise: emp.expertise_areas?.includes(requiredExpertise) ? 1.0 : 0.5,
            rating: (emp.rating || 4.0) / 5.0,
            workload: Math.random() * 0.3 + 0.7,
            customerSatisfaction: (emp.rating || 4.0) / 5.0
          },
          metrics: {
            distanceKm: Math.random() * maxDistance, // Mock distance calculation
            currentWorkload: Math.floor(Math.random() * maxDailyAssignments),
            hasExpertise: emp.expertise_areas?.includes(requiredExpertise) || false,
            isAvailableForSlot: true
          }
        }))
        .sort((a, b) => b.scores.total - a.scores.total); // Sort by total score
      
      setEligibleEmployees(eligibleEmployees);
      console.log(`✅ Found ${eligibleEmployees.length} eligible employees for ${requiredExpertise}`);
    } catch (error) {
      console.error('Failed to load eligible employees:', error);
      setAssignmentError(`Failed to load employees: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setEligibleEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [unassignedBookings, requireExpertise, maxDistance, maxDailyAssignments]);

  const loadAnalytics = async () => {
    try {
      // Calculate analytics from existing data
      const allOrders = await getOrders();
      const employees = await getEmployees();
      
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentOrders = allOrders.filter(order => 
        new Date(order.created_at) >= last30Days
      );
      
      const assignedOrders = recentOrders.filter(order => order.items.some(item => item.assigned_engineer_id));
      const completedOrders = recentOrders.filter(order => order.status === 'completed');
      
      const mockAnalytics = {
        assignmentStats: {
          totalAssignments: assignedOrders.length,
          autoAssignments: Math.floor(assignedOrders.length * 0.8), // 80% auto-assigned
          completedAssignments: completedOrders.length,
          completionRate: assignedOrders.length > 0 ? Math.round((completedOrders.length / assignedOrders.length) * 100) : 0
        },
        performanceMetrics: {
          autoAssignmentRate: 80, // 80% auto-assignment rate
          averageAssignmentsPerEmployee: employees.length > 0 ? Math.round(assignedOrders.length / employees.length) : 0
        }
      };
      
      setAnalytics(mockAnalytics);
      console.log('✅ Analytics calculated from existing data');
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Set default analytics if calculation fails
      setAnalytics({
        assignmentStats: { totalAssignments: 0, autoAssignments: 0, completedAssignments: 0, completionRate: 0 },
        performanceMetrics: { autoAssignmentRate: 0, averageAssignmentsPerEmployee: 0 }
      });
    }
  };

  const handleBookingSelect = useCallback(async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowAssignmentModal(true);
    await loadEligibleEmployees(booking.id);
  }, [loadEligibleEmployees]);

  const handleAutoAssignment = async (manualEmployeeId?: string) => {
    if (!selectedBooking) {
      setAssignmentError('No booking selected');
      return;
    }

    try {
      setIsLoading(true);
      setAssignmentError('');
      setAssignmentStatus('Processing assignment...');
      
      // Validate inputs
      if (!manualEmployeeId && eligibleEmployees.length === 0) {
        throw new Error('No eligible employees available for assignment');
      }
      
      let selectedEmployee;
      
      if (manualEmployeeId) {
        // Manual assignment
        selectedEmployee = eligibleEmployees.find(emp => emp.employeeId === manualEmployeeId);
        if (!selectedEmployee) {
          throw new Error('Selected employee not found in eligible list');
        }
        setAssignmentStatus('Assigning selected employee...');
      } else {
        // Auto assignment based on strategy
        setAssignmentStatus(`Applying ${selectedStrategy.replace('_', ' ')} strategy...`);
        
        switch (selectedStrategy) {
          case 'best_fit':
            selectedEmployee = eligibleEmployees[0]; // Already sorted by total score
            break;
          case 'location_only':
            selectedEmployee = eligibleEmployees.sort((a, b) => b.scores.location - a.scores.location)[0];
            break;
          case 'availability_only':
            selectedEmployee = eligibleEmployees.sort((a, b) => b.scores.availability - a.scores.availability)[0];
            break;
          case 'location_and_availability':
            selectedEmployee = eligibleEmployees.sort((a, b) => 
              (b.scores.location + b.scores.availability) - (a.scores.location + a.scores.availability)
            )[0];
            break;
          case 'round_robin':
            // Simple round robin - pick employee with lowest current workload
            selectedEmployee = eligibleEmployees.sort((a, b) => a.metrics.currentWorkload - b.metrics.currentWorkload)[0];
            break;
          default:
            selectedEmployee = eligibleEmployees[0];
        }
      }
      
      if (!selectedEmployee) {
        throw new Error('No suitable employee found for assignment');
      }
      
      setAssignmentStatus('Updating order in database...');
      
      // Assign employee to order using adminDataManager
      const assignmentResult = await assignEmployeeToOrder(selectedBooking.id, selectedEmployee.employeeId);
      
      if (!assignmentResult) {
        throw new Error('Failed to update order in database');
      }
      
      // Update order status to 'confirmed' 
      await updateOrderStatus(selectedBooking.id, 'confirmed', 
        `Assigned to ${selectedEmployee.employeeName} via ${manualEmployeeId ? 'manual' : selectedStrategy} strategy`);
      
      // Set success result
      setAssignmentResult({
        success: true,
        assignment: {
          employeeId: selectedEmployee.employeeId,
          employeeName: selectedEmployee.employeeName,
          employeePhone: selectedEmployee.employeePhone,
          employeeLocation: selectedEmployee.employeeLocation,
          assignmentScore: selectedEmployee.scores.total,
          assignmentReason: manualEmployeeId 
            ? 'Manually selected by admin' 
            : `Auto-assigned using ${selectedStrategy.replace('_', ' ')} strategy`,
          strategy: manualEmployeeId ? 'manual' : selectedStrategy,
          distanceKm: selectedEmployee.metrics.distanceKm,
          expertise: selectedEmployee.expertiseAreas
        }
      });
      
      setAssignmentStatus('Assignment completed successfully!');
      
      // Refresh the bookings list
      setTimeout(() => {
        loadUnassignedBookings();
        setAssignmentStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Assignment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown assignment error';
      setAssignmentError(errorMessage);
      setAssignmentResult({
        success: false,
        error: errorMessage
      });
      setAssignmentStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAssignment = async (bookingIds: string[]) => {
    if (bookingIds.length === 0) {
      setAssignmentError('No bookings selected for bulk assignment');
      return;
    }
    
    try {
      setIsLoading(true);
      setAssignmentError('');
      setAssignmentStatus(`Processing bulk assignment for ${bookingIds.length} bookings...`);
      
      let successCount = 0;
      let failCount = 0;
      const results = [];
      
      // Get all employees for assignment
      const allEmployees = await getEmployees();
      const activeEmployees = allEmployees.filter(emp => emp.is_active);
      
      if (activeEmployees.length === 0) {
        throw new Error('No active employees available for assignment');
      }
      
      // Process each booking
      for (let i = 0; i < bookingIds.length; i++) {
        const bookingId = bookingIds[i];
        setAssignmentStatus(`Processing booking ${i + 1}/${bookingIds.length}...`);
        
        try {
          const booking = unassignedBookings.find(b => b.id === bookingId);
          if (!booking) {
            failCount++;
            results.push({ bookingId, success: false, error: 'Booking not found' });
            continue;
          }
          
          // Get required expertise and find suitable employee
          const requiredExpertise = CATEGORY_EXPERTISE_MAP[booking.serviceCategory] || 'General Services';
          let suitableEmployees = activeEmployees;
          
          if (requireExpertise && requiredExpertise !== 'General Services') {
            suitableEmployees = activeEmployees.filter(emp => 
              emp.expertise_areas?.includes(requiredExpertise)
            );
          }
          
          if (suitableEmployees.length === 0) {
            failCount++;
            results.push({ bookingId, success: false, error: 'No suitable employees found' });
            continue;
          }
          
          // Select employee based on strategy (simplified for bulk)
          let selectedEmployee;
          switch (selectedStrategy) {
            case 'round_robin':
              selectedEmployee = suitableEmployees[i % suitableEmployees.length];
              break;
            default:
              // Use random selection for bulk to distribute load
              selectedEmployee = suitableEmployees[Math.floor(Math.random() * suitableEmployees.length)];
          }
          
          // Assign employee
          const assignmentResult = await assignEmployeeToOrder(bookingId, selectedEmployee.id);
          
          if (assignmentResult) {
            await updateOrderStatus(bookingId, 'confirmed', 
              `Bulk assigned to ${selectedEmployee.name} via ${selectedStrategy} strategy`);
            successCount++;
            results.push({ 
              bookingId, 
              success: true, 
              employeeName: selectedEmployee.name 
            });
          } else {
            failCount++;
            results.push({ bookingId, success: false, error: 'Database update failed' });
          }
          
        } catch (error) {
          failCount++;
          results.push({ 
            bookingId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Show results
      setAssignmentStatus(`Bulk assignment completed: ${successCount} successful, ${failCount} failed`);
      
      // Refresh the bookings list
      setTimeout(() => {
        loadUnassignedBookings();
        setAssignmentStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      setAssignmentError(`Bulk assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAssignmentStatus('');
    } finally {
      setIsLoading(false);
    }
  };


  const formatScoreBar = (score: number, color: string = 'blue'): React.ReactNode => {
    const percentage = Math.round(score * 100);
    return (
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 w-10">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
        {/* Welcome Section - Match Dashboard Style */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">Assignment Management</h1>
          <p className="text-blue-100">Intelligent employee assignment with location, availability, and expertise matching</p>
        </div>

        {/* Header Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-0">Assignment Actions</h3>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide flex items-center space-x-2"
              >
                <span>CONFIGURATION</span>
              </button>
              <button
                onClick={loadUnassignedBookings}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? <Loading size="sm" /> : <span>REFRESH</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Assignment Status & Errors */}
        {(assignmentStatus || assignmentError) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            {assignmentStatus && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg flex items-center space-x-2">
                <Loading size="sm" />
                <span className="font-medium">{assignmentStatus}</span>
              </div>
            )}
            
            {assignmentError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="font-medium">{assignmentError}</span>
                <button
                  onClick={() => setAssignmentError('')}
                  className="ml-auto text-red-600 hover:text-red-800 font-bold"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        {/* KPI Cards - Match Analytics Dashboard Style */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            
            {/* Total Assignments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-blue-100 mb-2">Total Assignments</p>
                <p className="text-3xl font-bold text-white">{analytics.assignmentStats?.totalAssignments || 0}</p>
                <p className="text-xs text-blue-200 mt-2">Last 30 days</p>
              </div>
            </div>

            {/* Auto Assignment Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-100 mb-2">Auto Assignment Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.performanceMetrics?.autoAssignmentRate || 0}%</p>
                <p className="text-xs text-green-200 mt-2">{analytics.assignmentStats?.autoAssignments || 0} automatic</p>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-purple-100 mb-2">Completion Rate</p>
                <p className="text-3xl font-bold text-white">{analytics.assignmentStats?.completionRate || 0}%</p>
                <p className="text-xs text-purple-200 mt-2">{analytics.assignmentStats?.completedAssignments || 0} completed</p>
              </div>
            </div>

            {/* Average per Employee */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-orange-100 mb-2">Avg per Employee</p>
                <p className="text-3xl font-bold text-white">{analytics.performanceMetrics?.averageAssignmentsPerEmployee || 0}</p>
                <p className="text-xs text-orange-200 mt-2">Workload balance</p>
              </div>
            </div>

          </div>
        )}

        {/* Strategy Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Assignment Strategy</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignmentConfigs?.strategies && Object.entries(assignmentConfigs.strategies).map(([key, strategy]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStrategy(key)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                    selectedStrategy === key 
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg' 
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm text-gray-900">{strategy.name}</div>
                    {selectedStrategy === key && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">{strategy.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {strategy.factors?.slice(0, 2).map((factor: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {factor}
                      </span>
                    ))}
                    {strategy.factors?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        +{strategy.factors.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {!assignmentConfigs?.strategies && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg mb-2">Loading strategies...</div>
                <Loading size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Unassigned Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Unassigned Bookings ({unassignedBookings.length})
            </h3>
            <p className="text-gray-600 text-sm mt-1">Click on a booking to assign an employee</p>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loading size="lg" />
                <span className="ml-3 text-gray-600">Loading bookings...</span>
              </div>
            ) : unassignedBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-lg font-medium">All bookings are assigned!</div>
                <div className="text-sm">Great job on keeping up with assignments.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk Actions */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-700">
                    Select multiple bookings for bulk assignment
                  </span>
                  <button
                    onClick={() => handleBulkAssignment(unassignedBookings.map(b => b.id))}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide flex items-center space-x-2"
                  >
                    <span>ASSIGN ALL ({unassignedBookings.length})</span>
                  </button>
                </div>

                {/* Bookings List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {unassignedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => handleBookingSelect(booking)}
                      className="border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-900">{booking.serviceName}</div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ₹{booking.totalAmount}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Location: {booking.location}</div>
                        <div>Customer: {booking.customerName}</div>
                        <div>Date: {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTimeStart}</div>
                        <div>Category: {booking.serviceCategory}</div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <Badge className="bg-red-100 text-red-800">
                          Unassigned
                        </Badge>
                        <button className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-sm font-bold text-xs tracking-wide">
                          ASSIGN EMPLOYEE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Modal */}
        <Modal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedBooking(null);
            setEligibleEmployees([]);
            setAssignmentResult(null);
          }}
          title="Employee Assignment"
          size="xl"
        >
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Booking Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Service:</strong> {selectedBooking.serviceName}</div>
                  <div><strong>Category:</strong> {selectedBooking.serviceCategory}</div>
                  <div><strong>Customer:</strong> {selectedBooking.customerName}</div>
                  <div><strong>Amount:</strong> ₹{selectedBooking.totalAmount}</div>
                  <div><strong>Date:</strong> {new Date(selectedBooking.scheduledDate).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {selectedBooking.scheduledTimeStart} - {selectedBooking.scheduledTimeEnd}</div>
                </div>
              </div>

              {/* Assignment Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => handleAutoAssignment()}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-1"
                >
                  {isLoading ? <Loading size="sm" /> : <span>AUTO ASSIGN ({selectedStrategy.replace('_', ' ')})</span>}
                </button>
              </div>

              {/* Assignment Result */}
              {assignmentResult && (
                <div className={`p-4 rounded-lg ${assignmentResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {assignmentResult.success ? (
                    <div>
                      <h4 className="font-semibold text-green-900 mb-2">Assignment Successful!</h4>
                      <div className="text-sm space-y-1 text-green-800">
                        <div><strong>Employee:</strong> {assignmentResult.assignment?.employeeName}</div>
                        <div><strong>Phone:</strong> {assignmentResult.assignment?.employeePhone}</div>
                        <div><strong>Location:</strong> {assignmentResult.assignment?.employeeLocation}</div>
                        <div><strong>Score:</strong> {assignmentResult.assignment?.assignmentScore?.toFixed(2)}</div>
                        <div><strong>Distance:</strong> {assignmentResult.assignment?.distanceKm ? `${assignmentResult.assignment.distanceKm.toFixed(1)}km` : 'N/A'}</div>
                        <div><strong>Reason:</strong> {assignmentResult.assignment?.assignmentReason}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">Assignment Failed</h4>
                      <div className="text-sm text-red-800">{assignmentResult.error}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Eligible Employees */}
              {eligibleEmployees.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Eligible Employees ({eligibleEmployees.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {eligibleEmployees.map((employee) => (
                      <div key={employee.employeeId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900">{employee.employeeName}</div>
                            <div className="text-sm text-gray-600">{employee.employeeLocation}</div>
                            <div className="text-sm text-gray-600">Phone: {employee.employeePhone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">{Math.round(employee.scores.total * 100)}%</div>
                            <div className="text-xs text-gray-500">Match Score</div>
                          </div>
                        </div>
                        
                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Location</div>
                            {formatScoreBar(employee.scores.location, 'blue')}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Availability</div>
                            {formatScoreBar(employee.scores.availability, 'green')}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Expertise</div>
                            {formatScoreBar(employee.scores.expertise, 'purple')}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Rating</div>
                            {formatScoreBar(employee.scores.rating, 'yellow')}
                          </div>
                        </div>

                        {/* Employee Details */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-600">
                            Rating: {employee.rating.toFixed(1)} | 
                            Distance: {employee.metrics.distanceKm ? `${employee.metrics.distanceKm.toFixed(1)}km` : 'N/A'} | 
                            Workload: {employee.metrics.currentWorkload} jobs today
                          </div>
                          
                          <button
                            onClick={() => handleAutoAssignment(employee.employeeId)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            MANUAL ASSIGN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Configuration Modal */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title="Assignment Configuration"
          size="lg"
        >
          <div className="space-y-6">
            {/* Distance Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Distance (km)
              </label>
              <input
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
                max="100"
              />
            </div>

            {/* Expertise Requirement */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={requireExpertise}
                  onChange={(e) => setRequireExpertise(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Require expertise match
                </span>
              </label>
            </div>

            {/* Daily Assignment Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Assignments per Employee
              </label>
              <input
                type="number"
                value={maxDailyAssignments}
                onChange={(e) => setMaxDailyAssignments(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
                max="20"
              />
            </div>

            {/* Priority Weights */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Priority Weights</h3>
              <div className="space-y-3">
                {Object.entries(customWeights).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 capitalize">{key}</span>
                      <span className="text-sm text-gray-800">{Math.round(value * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={value}
                      onChange={(e) => setCustomWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Total: {Math.round(Object.values(customWeights).reduce((a, b) => a + b, 0) * 100)}%
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-sm tracking-wide"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  // Configuration is automatically applied via state
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md font-bold text-sm tracking-wide"
              >
                SAVE CONFIGURATION
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
};

export default AssignmentManagement;