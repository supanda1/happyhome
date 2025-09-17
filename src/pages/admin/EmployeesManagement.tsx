import React, { useState, useEffect } from 'react';
import { employeesAPI, handleAPIError } from '../../services/api';
import { type Employee } from '../../types/api';
import { getSubcategories } from '../../utils/adminDataManager';

interface EmployeeFormData {
  employee_id: string;
  name: string;
  expert: string; // Legacy field
  expertise_areas?: string[]; // New multi-expertise field (optional for backward compatibility)
  manager: string;
  phone: string;
  email: string;
  is_active: boolean;
}

const EmployeesManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: '',
    name: '',
    expert: '',
    expertise_areas: [],
    manager: '',
    phone: '',
    email: '',
    is_active: true
  });

  // Fetch employees from backend API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll();
      
      if (response.success && response.data) {
        setEmployees(response.data);
      } else {
        console.error('Error fetching employees:', response.error);
        alert(`Error fetching employees: ${response.error}`);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert(`Error fetching employees: ${handleAPIError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Load expertise areas from subcategories
  const loadExpertiseAreas = async () => {
    try {
      const subcategories = await getSubcategories();
      const areas = subcategories.map((sub: any) => sub.name).sort();
      setExpertiseAreas(areas);
    } catch (error) {
      console.error('Error loading expertise areas:', error);
      // Fallback to basic areas if backend fails
      setExpertiseAreas(['Plumbing', 'Electrical', 'Cleaning', 'General Services']);
    }
  };

  useEffect(() => {
    fetchEmployees();
    loadExpertiseAreas();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one expertise area is selected
    if (!formData.expertise_areas || formData.expertise_areas.length === 0) {
      alert('Please select at least one expertise area');
      return;
    }
    
    try {
      if (editingEmployee) {
        // Update existing employee
        const response = await employeesAPI.update(editingEmployee.id, formData);
        if (response.success) {
          await fetchEmployees();
          resetForm();
          alert('Employee updated successfully!');
        } else {
          alert(`Error updating employee: ${response.error}`);
        }
      } else {
        // Create new employee
        const response = await employeesAPI.create(formData);
        if (response.success) {
          await fetchEmployees();
          resetForm();
          alert('Employee created successfully!');
        } else {
          alert(`Error creating employee: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Error saving employee: ${handleAPIError(error)}`);
    }
  };

  // Handle employee deletion
  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await employeesAPI.delete(employeeId);
      if (response.success) {
        await fetchEmployees();
        alert('Employee deleted successfully!');
      } else {
        alert(`Error deleting employee: ${response.error}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert(`Error deleting employee: ${handleAPIError(error)}`);
    }
  };

  // Handle enable/disable toggle
  const handleToggleStatus = async (employee: Employee) => {
    try {
      const response = await employeesAPI.update(employee.id, {
        is_active: !employee.is_active
      });
      
      if (response.success) {
        await fetchEmployees();
        alert(`Employee ${!employee.is_active ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert(`Error updating employee status: ${response.error}`);
      }
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert(`Error updating employee status: ${handleAPIError(error)}`);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      name: '',
      expert: '',
      expertise_areas: [],
      manager: '',
      phone: '',
      email: '',
      is_active: true
    });
    setEditingEmployee(null);
    setShowForm(false);
  };

  const startEdit = (employee: Employee) => {
    setFormData({
      employee_id: employee.employee_id,
      name: employee.name,
      expert: employee.expert || '',
      expertise_areas: employee.expertise_areas || (employee.expert ? [employee.expert] : []),
      manager: employee.manager,
      phone: employee.phone,
      email: employee.email,
      is_active: employee.is_active
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  // Handle expertise selection
  const handleExpertiseToggle = (expertise: string) => {
    setFormData(prev => {
      const currentAreas = prev.expertise_areas || [];
      const newExpertiseAreas = currentAreas.includes(expertise)
        ? currentAreas.filter(area => area !== expertise)
        : [...currentAreas, expertise];
      
      return {
        ...prev,
        expertise_areas: newExpertiseAreas,
        expert: newExpertiseAreas[0] || '' // Set first expertise as legacy expert field
      };
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Employee Management Dashboard</h1>
          <p className="text-indigo-100">Manage your workforce, track expertise, and optimize team performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Employees */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Employees</p>
            <p className="text-4xl font-bold text-white">{employees.length}</p>
            <p className="text-xs text-blue-200 mt-2">Team Members</p>
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active Staff</p>
            <p className="text-4xl font-bold text-white">{employees.filter(e => e.is_active).length}</p>
            <p className="text-xs text-green-200 mt-2">Working</p>
          </div>
        </div>

        {/* Expertise Areas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Expertise Areas</p>
            <p className="text-4xl font-bold text-white">{new Set(employees.map(e => e.expert)).size}</p>
            <p className="text-xs text-purple-200 mt-2">Skills Covered</p>
          </div>
        </div>

        {/* Multi-Skilled */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Multi-Skilled</p>
            <p className="text-4xl font-bold text-white">{employees.filter(e => e.expertise_areas && e.expertise_areas.length > 1).length}</p>
            <p className="text-xs text-orange-200 mt-2">Versatile Staff</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Management</h2>
          <p className="text-gray-600 text-sm">Manage employee profiles, expertise areas, and work assignments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <span>👤</span>
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expertise Areas * (Select multiple)
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
                  {expertiseAreas.map((area: string) => (
                    <div key={area} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`expertise-${area}`}
                        checked={formData.expertise_areas?.includes(area) || false}
                        onChange={() => handleExpertiseToggle(area)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`expertise-${area}`} 
                        className="ml-2 block text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                      >
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
                {(!formData.expertise_areas || formData.expertise_areas.length === 0) && (
                  <p className="text-red-500 text-xs mt-1">Please select at least one expertise area</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Selected: {!formData.expertise_areas || formData.expertise_areas.length === 0 ? 'None' : formData.expertise_areas.join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager *
                </label>
                <input
                  type="text"
                  required
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Manager Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., john.doe@happyhomes.com"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (can be assigned to services)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Employees</h3>
              <p className="text-gray-600 mt-1">{employees.length} employees • {employees.filter(e => e.is_active).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {employees.filter(e => e.is_active).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {employees.filter(e => !e.is_active).length} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Expertise
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">
                        {employee.name}
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                        ID: {employee.employee_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Manager: {employee.manager}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {employee.expertise_areas && employee.expertise_areas.length > 0 ? (
                        employee.expertise_areas.map((expertise, index) => (
                          <span 
                            key={index}
                            className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
                          >
                            {expertise}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                          {employee.expert || 'No expertise set'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{employee.phone}</div>
                      <div className="text-gray-500 mt-1">{employee.email}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      employee.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => startEdit(employee)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(employee)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                        employee.is_active
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {employee.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first employee</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add First Employee
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesManagement;