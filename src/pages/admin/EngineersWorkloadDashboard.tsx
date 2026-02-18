import React, { useState, useEffect } from 'react';
import { ordersAPI, handleAPIError, engineersAPI } from '../../services/api';

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

interface EngineerWorkload {
  id: string;
  employee_id: string;
  name: string;
  expert: string;
  expertise_areas: string[] | null;
  phone: string;
  email: string;
  is_active: boolean;
  active_tasks: number;
  pending_tasks: number;
  scheduled_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  active_assignments: Array<{
    order_id: string;
    order_number: string;
    service_name: string;
    item_status: string;
    scheduled_date: string | null;
    customer_name: string;
    customer_phone: string;
    priority: string;
  }>;
}

interface WorkloadSummary {
  total_engineers: number;
  active_engineers: number;
  idle_engineers: number;
  total_active_tasks: number;
  average_tasks_per_active_engineer: number;
  busiest_engineer: string | null;
  max_tasks: number;
}

interface WorkloadReportSummary extends WorkloadSummary {
  report_period: {
    start_date: string;
    end_date: string;
    report_type: string;
  };
  total_completed_tasks: number;
}

interface EngineerReport extends EngineerWorkload {
  report_date?: string;
  report_period_start?: string;
  report_period_end?: string;
  report_type: string;
  postponed_tasks: number;
  cancelled_tasks: number;
  order_details: Array<{
    order_id: string;
    order_number: string;
    service_name: string;
    item_status: string;
    scheduled_date: string | null;
    completion_date: string | null;
    created_date: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    priority: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    item_notes: string | null;
    item_rating: number | null;
    item_review: string | null;
  }>;
}

interface EngineerSummary {
  id: string;
  employee_id: string;
  name: string;
  total_active_tasks: number;
  total_completed_tasks: number;
  total_orders: number;
}

type ReportType = 'daily' | 'weekly' | 'monthly';
type ViewMode = 'current' | 'reports';

const EngineersWorkloadDashboard: React.FC = () => {
  const [engineers, setEngineers] = useState<EngineerWorkload[]>([]);
  const [summary, setSummary] = useState<WorkloadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerWorkload | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // New state for enhanced reporting
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 7); // Default to last 7 days
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [reportEngineers, setReportEngineers] = useState<EngineerReport[]>([]);
  const [reportSummary, setReportSummary] = useState<WorkloadReportSummary | null>(null);
  const [engineerSummary, setEngineerSummary] = useState<EngineerSummary[]>([]);
  const [availableEngineers, setAvailableEngineers] = useState<Array<{id: string, name: string, employee_id: string}>>([]);

  // Fetch workload statistics
  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getEngineerWorkloadStats();
      
      if (response.success && response.data) {
        setEngineers(response.data.engineers);
        setSummary(response.data.summary);
      } else {
        console.error('Error fetching workload data:', response.error);
        alert(`Error fetching workload data: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching workload data:', error);
      alert(`Error fetching workload data: ${handleAPIError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch enhanced workload reports
  const fetchWorkloadReports = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getEngineerWorkloadReports({
        startDate,
        endDate,
        reportType,
        engineerId: selectedEngineerId || undefined
      });
      
      if (response.success && response.data) {
        setReportEngineers(response.data.engineers);
        setReportSummary(response.data.summary);
        setEngineerSummary(response.data.engineer_summary);
      } else {
        console.error('Error fetching workload reports:', response.error);
        alert(`Error fetching workload reports: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching workload reports:', error);
      alert(`Error fetching workload reports: ${handleAPIError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available engineers for the filter dropdown
  const fetchAvailableEngineers = async () => {
    try {
      const response = await engineersAPI.getAll();
      if (response.success && response.data) {
        setAvailableEngineers(response.data.map(eng => ({
          id: eng.id,
          name: eng.name,
          employee_id: eng.engineer_id
        })));
      }
    } catch (error) {
      console.error('Error fetching available engineers:', error);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
    fetchAvailableEngineers();
  }, []);

  useEffect(() => {
    if (viewMode === 'reports') {
      fetchWorkloadReports();
    }
  }, [viewMode, startDate, endDate, reportType, selectedEngineerId]);

  // Get workload level color
  const getWorkloadLevelColor = (activeTasks: number) => {
    if (activeTasks === 0) return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white ring-2 ring-gray-200';
    if (activeTasks <= 2) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200';
    if (activeTasks <= 5) return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white ring-2 ring-yellow-200';
    if (activeTasks <= 8) return 'bg-gradient-to-r from-orange-500 to-red-500 text-white ring-2 ring-orange-200';
    return 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200';
  };

  // Get workload level text
  const getWorkloadLevelText = (activeTasks: number) => {
    if (activeTasks === 0) return 'Idle';
    if (activeTasks <= 2) return 'Light';
    if (activeTasks <= 5) return 'Moderate';
    if (activeTasks <= 8) return 'Heavy';
    return 'Overloaded';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export report data to CSV
  const exportToCSV = () => {
    try {
      const csvData = [];
      
      // Add summary header
      csvData.push(['Engineer Workload Report']);
      csvData.push(['Report Period:', `${reportSummary?.report_period.start_date} to ${reportSummary?.report_period.end_date}`]);
      csvData.push(['Report Type:', reportSummary?.report_period.report_type]);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push([]);
      
      // Add summary statistics
      csvData.push(['Summary Statistics']);
      csvData.push(['Total Engineers:', reportSummary?.total_engineers]);
      csvData.push(['Active Engineers:', reportSummary?.active_engineers]);
      csvData.push(['Total Active Tasks:', reportSummary?.total_active_tasks]);
      csvData.push(['Total Completed Tasks:', reportSummary?.total_completed_tasks]);
      csvData.push(['Busiest Engineer:', reportSummary?.busiest_engineer]);
      csvData.push([]);
      
      // Add detailed engineer data
      csvData.push(['Detailed Engineer Report']);
      csvData.push([
        'Employee ID', 'Engineer Name', 'Phone', 'Email', 
        'Active Tasks', 'Pending', 'Scheduled', 'In Progress', 'Completed', 'Postponed', 'Cancelled',
        'Report Period', 'Total Orders'
      ]);
      
      reportEngineers.forEach(engineer => {
        const reportPeriod = engineer.report_date ? 
          engineer.report_date : 
          `${engineer.report_period_start} to ${engineer.report_period_end}`;
        
        csvData.push([
          engineer.employee_id,
          engineer.name,
          engineer.phone,
          engineer.email,
          engineer.active_tasks,
          engineer.pending_tasks,
          engineer.scheduled_tasks,
          engineer.in_progress_tasks,
          engineer.completed_tasks,
          engineer.postponed_tasks,
          engineer.cancelled_tasks,
          reportPeriod,
          engineer.order_details.length
        ]);
        
        // Add order details for each engineer
        if (engineer.order_details.length > 0) {
          csvData.push(['', '', 'Order Details:']);
          csvData.push(['', '', 'Order Number', 'Service', 'Status', 'Priority', 'Customer', 'Phone', 'Scheduled Date', 'Completion Date', 'Amount']);
          
          engineer.order_details.forEach(order => {
            csvData.push([
              '', '', 
              order.order_number,
              order.service_name,
              order.item_status,
              order.priority,
              order.customer_name,
              order.customer_phone,
              order.scheduled_date || 'Not scheduled',
              order.completion_date || 'Not completed',
              `₹${order.total_price}`
            ]);
          });
          csvData.push([]);
        }
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineer_workload_report_${reportType}_${startDate}_to_${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting report. Please try again.');
    }
  };

  // Quick date range presets
  const setDatePreset = (days: number) => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Engineers Workload Dashboard</h1>
            <p className="text-blue-100">Monitor engineer assignments and task distribution</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'current'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Current Workload
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'reports'
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Historical Reports
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Report Controls - Show only when in reports mode */}
      {viewMode === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Engineer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Engineer (Optional)</label>
              <select
                value={selectedEngineerId}
                onChange={(e) => setSelectedEngineerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Engineers</option>
                {availableEngineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name} ({eng.employee_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <div>
              <button
                onClick={exportToCSV}
                disabled={!reportSummary || reportEngineers.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Date Range Presets */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Ranges</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDatePreset(7)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDatePreset(30)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDatePreset(90)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {viewMode === 'current' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Engineers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-100 mb-2">Total Engineers</p>
              <p className="text-4xl font-bold text-white">{summary.total_engineers}</p>
              <p className="text-xs text-blue-200 mt-2">Active Staff</p>
            </div>
          </div>

          {/* Active Engineers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-100 mb-2">Working</p>
              <p className="text-4xl font-bold text-white">{summary.active_engineers}</p>
              <p className="text-xs text-green-200 mt-2">Currently Assigned</p>
            </div>
          </div>

          {/* Idle Engineers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-gray-100 mb-2">Available</p>
              <p className="text-4xl font-bold text-white">{summary.idle_engineers}</p>
              <p className="text-xs text-gray-200 mt-2">Ready for Tasks</p>
            </div>
          </div>

          {/* Total Active Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-purple-100 mb-2">Active Tasks</p>
              <p className="text-4xl font-bold text-white">{summary.total_active_tasks}</p>
              <p className="text-xs text-purple-200 mt-2">Total Workload</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Summary Statistics */}
      {viewMode === 'reports' && reportSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Report Period */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-indigo-100 mb-2">Report Period</p>
              <p className="text-lg font-bold text-white">{reportSummary.report_period.report_type}</p>
              <p className="text-xs text-indigo-200 mt-2">{reportSummary.report_period.start_date} to {reportSummary.report_period.end_date}</p>
            </div>
          </div>

          {/* Engineers in Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-blue-100 mb-2">Engineers</p>
              <p className="text-4xl font-bold text-white">{reportSummary.total_engineers}</p>
              <p className="text-xs text-blue-200 mt-2">In Report Period</p>
            </div>
          </div>

          {/* Active Engineers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-100 mb-2">Active</p>
              <p className="text-4xl font-bold text-white">{reportSummary.active_engineers}</p>
              <p className="text-xs text-green-200 mt-2">Had Tasks</p>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-purple-100 mb-2">Active Tasks</p>
              <p className="text-4xl font-bold text-white">{reportSummary.total_active_tasks}</p>
              <p className="text-xs text-purple-200 mt-2">In Progress</p>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-emerald-100 mb-2">Completed</p>
              <p className="text-4xl font-bold text-white">{reportSummary.total_completed_tasks}</p>
              <p className="text-xs text-emerald-200 mt-2">Tasks Done</p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats - Current Workload */}
      {viewMode === 'current' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-indigo-100 mb-2">Avg Tasks/Engineer</p>
              <p className="text-3xl font-bold text-white">{summary.average_tasks_per_active_engineer}</p>
              <p className="text-xs text-indigo-200 mt-2">Per Active Engineer</p>
            </div>
          </div>

          {/* Busiest Engineer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-orange-100 mb-2">Busiest Engineer</p>
              <p className="text-lg font-bold text-white">{summary.busiest_engineer || 'N/A'}</p>
              <p className="text-xs text-orange-200 mt-2">{summary.max_tasks} Active Tasks</p>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-center">
            <button
              onClick={fetchWorkloadData}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all transform hover:scale-105"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Additional Report Stats */}
      {viewMode === 'reports' && reportSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Tasks per Engineer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-indigo-100 mb-2">Avg Tasks/Engineer</p>
              <p className="text-3xl font-bold text-white">{reportSummary.average_tasks_per_active_engineer}</p>
              <p className="text-xs text-indigo-200 mt-2">In Report Period</p>
            </div>
          </div>

          {/* Busiest Engineer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-orange-100 mb-2">Top Performer</p>
              <p className="text-lg font-bold text-white">{reportSummary.busiest_engineer || 'N/A'}</p>
              <p className="text-xs text-orange-200 mt-2">{reportSummary.max_tasks} Total Tasks</p>
            </div>
          </div>

          {/* Engineer Summary Count */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-cyan-100 mb-2">Engineers Summary</p>
              <p className="text-3xl font-bold text-white">{engineerSummary.length}</p>
              <p className="text-xs text-cyan-200 mt-2">Individual Reports</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Engineers Workload List */}
      {viewMode === 'current' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-8 border-b border-gray-200 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Current Engineers Workload</h3>
                </div>
                <p className="text-white/90 text-lg">{engineers.length} engineers • {summary ? summary.active_engineers : engineers.filter(e => e.active_tasks > 0).length} actively working</p>
              </div>
              <div className="flex space-x-3">
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{summary ? summary.active_engineers : engineers.filter(e => e.active_tasks > 0).length} Working</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>{summary ? summary.idle_engineers : engineers.filter(e => e.active_tasks === 0).length} Available</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                    <span>{summary ? summary.total_active_tasks : engineers.reduce((sum, eng) => sum + eng.active_tasks, 0)} Tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Engineer Name
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Expertise & Status
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Workload
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Task Breakdown
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {engineers.map((engineer, index) => (
                  <tr key={engineer.id} className="group hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-purple-50/70 transition-all duration-500 hover:shadow-lg hover:-translate-y-1" 
                      style={{ animationDelay: `${index * 100}ms` }}>
                    <td className="px-8 py-8 whitespace-nowrap">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${engineer.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                            {engineer.name}
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="text-sm text-gray-500 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-full font-medium">
                              ID: {engineer.employee_id}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{engineer.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {engineer.expertise_areas && engineer.expertise_areas.length > 0 ? (
                            engineer.expertise_areas.map((expertise, index) => (
                              <span 
                                key={index}
                                className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                              >
                                {expertise}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                              {engineer.expert || 'No expertise set'}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${getWorkloadLevelColor(engineer.active_tasks)}`}>
                            {getWorkloadLevelText(engineer.active_tasks)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-center">
                        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 text-white font-bold text-2xl rounded-2xl shadow-xl transform group-hover:scale-110 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                          <span className="relative z-10">{engineer.active_tasks}</span>
                          {engineer.active_tasks > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center animate-pulse font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-3 font-medium">
                          <span className="text-green-600 font-semibold">{engineer.completed_tasks}</span> completed
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2 w-16 mx-auto overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-full transition-all duration-1000 rounded-full"
                            style={{ 
                              width: engineer.active_tasks > 0 ? `${Math.min((engineer.completed_tasks / (engineer.completed_tasks + engineer.active_tasks)) * 100, 100)}%` : '0%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="group relative">
                          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-between">
                            <span>{engineer.pending_tasks} Pending</span>
                            <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                          </div>
                        </div>
                        <div className="group relative">
                          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-between">
                            <span>{engineer.scheduled_tasks} Scheduled</span>
                            <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                          </div>
                        </div>
                        <div className="group relative">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-between">
                            <span>{engineer.in_progress_tasks} In Progress</span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedEngineer(engineer);
                          setShowDetailsModal(true);
                        }}
                        className="group relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center space-x-2">
                          <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Details</span>
                        </div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {engineers.length === 0 && (
            <div className="text-center py-20 px-6">
              <div className="relative">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl shadow-lg">
                    👷‍♂️
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Engineers Available</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                It looks like there are no active engineers in the system right now. Engineers need to be added to view workload data.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={fetchWorkloadData}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports View with Detailed Order Information */}
      {viewMode === 'reports' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-8 border-b border-gray-200 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Engineers Reports with Order Details</h3>
                </div>
                <p className="text-white/90 text-lg">
                  {reportEngineers.length} report entries • 
                  {reportSummary ? ` ${reportSummary.report_period.start_date} to ${reportSummary.report_period.end_date}` : ''}
                  {reportSummary ? ` • ${reportSummary.report_period.report_type} report` : ''}
                </p>
              </div>
              <div className="flex space-x-3">
                {reportSummary && (
                  <>
                    <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                        <span>{reportSummary.active_engineers} Active</span>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                        <span>{reportSummary.total_active_tasks} Active Tasks</span>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-sm font-semibold border border-white/20 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                        <span>{reportSummary.total_completed_tasks} Completed</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {reportEngineers.length > 0 ? (
            <div className="space-y-8 p-8">
              {reportEngineers.map((engineer, index) => (
                <div key={`${engineer.id}-${index}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" 
                     style={{ animationDelay: `${index * 150}ms` }}>
                  {/* Engineer Header */}
                  <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 border-b border-gray-200 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                              {engineer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                              ✓
                            </div>
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">{engineer.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="bg-white/70 px-3 py-1 rounded-full font-medium shadow-sm">ID: {engineer.employee_id}</span>
                              <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{engineer.phone}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {engineer.expertise_areas && engineer.expertise_areas.length > 0 ? (
                              engineer.expertise_areas.map((expertise, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800"
                                >
                                  {expertise}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                                {engineer.expert || 'No expertise'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Report Period Info */}
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Report Period: </span>
                          {engineer.report_date ? (
                            <span>{engineer.report_date}</span>
                          ) : (
                            <span>{engineer.report_period_start} to {engineer.report_period_end}</span>
                          )}
                          <span className="ml-4 font-medium">Type: </span>
                          <span className="capitalize">{engineer.report_type}</span>
                        </div>
                      </div>
                      
                      {/* Task Summary */}
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/40">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-2 shadow-lg">
                            {engineer.active_tasks}
                          </div>
                          <div className="text-sm font-semibold text-gray-700">Active Tasks</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/40">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-2 shadow-lg">
                            {engineer.completed_tasks}
                          </div>
                          <div className="text-sm font-semibold text-gray-700">Completed</div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/40">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-2 shadow-lg">
                            {engineer.order_details.length}
                          </div>
                          <div className="text-sm font-semibold text-gray-700">Total Orders</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Task Breakdown */}
                  <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
                    <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Detailed Task Breakdown</span>
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-6 text-center">
                      <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.pending_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">Pending</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.scheduled_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">Scheduled</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.in_progress_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">In Progress</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.completed_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">Completed</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.postponed_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">Postponed</div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-3 shadow-md">
                          {engineer.cancelled_tasks}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">Cancelled</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details Table */}
                  {engineer.order_details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Order</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Service</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Scheduled</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {engineer.order_details.map((order, orderIdx) => (
                            <tr key={orderIdx} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{order.order_number}</div>
                                <div className="text-xs text-gray-500">{new Date(order.created_date).toLocaleDateString()}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{order.service_name}</div>
                                <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-xs text-gray-500">{order.customer_phone}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.item_status)}`}>
                                  {order.item_status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {order.scheduled_date ? (
                                  <div>
                                    <div>{new Date(order.scheduled_date).toLocaleDateString()}</div>
                                    {order.completion_date && (
                                      <div className="text-xs text-green-600">
                                        Done: {new Date(order.completion_date).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Not scheduled</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium">₹{order.total_price}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                                  {order.priority}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No report data found</h3>
              <p className="text-gray-600">Try adjusting your date range or report type</p>
            </div>
          )}
        </div>
      )}

      {/* Engineer Details Modal */}
      {showDetailsModal && selectedEngineer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedEngineer.name} - Task Details
              </h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEngineer(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Employee ID:</span> {selectedEngineer.employee_id}</div>
                <div><span className="font-medium">Phone:</span> {selectedEngineer.phone}</div>
                <div><span className="font-medium">Email:</span> {selectedEngineer.email}</div>
                <div>
                  <span className="font-medium">Workload Status:</span>{' '}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkloadLevelColor(selectedEngineer.active_tasks)}`}>
                    {getWorkloadLevelText(selectedEngineer.active_tasks)}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Assignments */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Active Assignments ({selectedEngineer.active_assignments.length})
              </h4>
              
              {selectedEngineer.active_assignments.length > 0 ? (
                <div className="space-y-3">
                  {selectedEngineer.active_assignments.map((assignment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {assignment.order_number} - {assignment.service_name}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Customer: {assignment.customer_name} ({assignment.customer_phone})
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.item_status)}`}>
                            {assignment.item_status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(assignment.priority)}`}>
                            {assignment.priority}
                          </span>
                        </div>
                      </div>
                      {assignment.scheduled_date && (
                        <p className="text-sm text-gray-500">
                          Scheduled: {new Date(assignment.scheduled_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active assignments
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineersWorkloadDashboard;