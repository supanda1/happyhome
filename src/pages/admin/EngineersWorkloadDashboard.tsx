import React, { useState, useEffect } from 'react';
import { ordersAPI, handleAPIError } from '../../services/api';

/* 
// Custom CSS for enhanced animations - UNUSED
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
*/

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

const EngineersWorkloadDashboard: React.FC = () => {
  const [engineers, setEngineers] = useState<EngineerWorkload[]>([]);
  const [summary, setSummary] = useState<WorkloadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerWorkload | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  useEffect(() => {
    fetchWorkloadData();
  }, []);

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
        <h1 className="text-2xl font-bold mb-2">Engineers Workload Dashboard</h1>
        <p className="text-blue-100">Monitor engineer assignments and task distribution</p>
      </div>

      {/* Summary Statistics */}
      {summary && (
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

      {/* Additional Stats */}
      {summary && (
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

      {/* Engineers List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Engineers Workload</h3>
              <p className="text-gray-600 mt-1">{engineers.length} engineers • {summary ? summary.active_engineers : engineers.filter(e => e.active_tasks > 0).length} working</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {summary ? summary.active_engineers : engineers.filter(e => e.active_tasks > 0).length} Working
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {summary ? summary.idle_engineers : engineers.filter(e => e.active_tasks === 0).length} Available
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium">
                {summary ? summary.total_active_tasks : engineers.reduce((sum, eng) => sum + eng.active_tasks, 0)} Tasks
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
              {engineers.map((engineer) => (
                <tr key={engineer.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {engineer.name}
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        ID: {engineer.employee_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Phone: {engineer.phone}
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
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-bold text-2xl rounded-full ring-2 ring-indigo-200">
                        {engineer.active_tasks}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {engineer.completed_tasks} completed
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium border border-yellow-200">
                        {engineer.pending_tasks} Pending
                      </div>
                      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200">
                        {engineer.scheduled_tasks} Scheduled
                      </div>
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium border border-purple-200">
                        {engineer.in_progress_tasks} In Progress
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEngineer(engineer);
                        setShowDetailsModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {engineers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👷‍♂️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No engineers found</h3>
            <p className="text-gray-600">No active engineers are currently available</p>
          </div>
        )}
      </div>

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