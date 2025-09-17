import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
  assigned_permissions: number;
}

interface Permission {
  id: string;
  permission_key: string;
  permission_name: string;
  permission_description: string;
  category: string;
  can_view?: boolean;
  can_edit?: boolean;
  granted_at?: string;
  granted_by_email?: string;
}

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoadingStates {
  users: boolean;
  permissions: boolean;
  userPermissions: boolean;
  createUser: boolean;
  updateUser: boolean;
  grantPermissions: boolean;
  revokePermissions: boolean;
}

const SuperAdminUserManagement: React.FC = () => {
  // Data State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  
  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Loading States (granular for better UX)
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    users: true,
    permissions: false,
    userPermissions: false,
    createUser: false,
    updateUser: false,
    grantPermissions: false,
    revokePermissions: false
  });
  
  // Error State
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Production-grade API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  // Helper function to update specific loading states
  const updateLoadingState = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Production-grade API call with comprehensive error handling
  const apiCall = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions: RequestInit = {
      credentials: 'include', // Include HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, { 
        ...defaultOptions, 
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData: APIResponse<any> = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          errorDetails = errorData;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        // Log detailed error information for debugging
        console.error(`🚨 API Error [${response.status}] ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorDetails,
          requestOptions: options
        });
        
        throw new Error(errorMessage);
      }
      
      const data: APIResponse<any> = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed');
      }
      
      console.log(`✅ API Success ${endpoint}:`, data.data);
      return data.data;
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        console.error(`❌ API call failed for ${endpoint}:`, error);
        throw error;
      }
      throw new Error(`Unknown error occurred: ${String(error)}`);
    }
  }, [API_BASE_URL]);

  // Input sanitization helper to prevent XSS attacks
  const sanitizeInput = useCallback((input: string): string => {
    if (!input || typeof input !== 'string') return '';
    
    // Remove HTML tags and dangerous characters
    return input
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim();
  }, []);

  // Production-grade form validation with security checks
  const validateForm = useCallback((data: UserFormData): FormErrors => {
    const errors: FormErrors = {};
    
    // Email validation with additional security checks
    const sanitizedEmail = sanitizeInput(data.email);
    if (!sanitizedEmail) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      errors.email = 'Please enter a valid email address';
    } else if (sanitizedEmail.length > 254) {
      errors.email = 'Email address is too long';
    }
    
    // Password validation with security requirements
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (data.password.length > 128) {
      errors.password = 'Password is too long (max 128 characters)';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(data.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    } else if (/(.)\1{2,}/.test(data.password)) {
      errors.password = 'Password cannot contain repeated characters';
    }
    
    // Name validation with sanitization
    const sanitizedFirstName = sanitizeInput(data.firstName);
    if (!sanitizedFirstName) {
      errors.firstName = 'First name is required';
    } else if (sanitizedFirstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (sanitizedFirstName.length > 50) {
      errors.firstName = 'First name is too long (max 50 characters)';
    } else if (!/^[a-zA-Z\s]+$/.test(sanitizedFirstName)) {
      errors.firstName = 'First name can only contain letters and spaces';
    }
    
    const sanitizedLastName = sanitizeInput(data.lastName);
    if (!sanitizedLastName) {
      errors.lastName = 'Last name is required';
    } else if (sanitizedLastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (sanitizedLastName.length > 50) {
      errors.lastName = 'Last name is too long (max 50 characters)';
    } else if (!/^[a-zA-Z\s]+$/.test(sanitizedLastName)) {
      errors.lastName = 'Last name can only contain letters and spaces';
    }
    
    // Phone validation with security (Indian mobile number format)
    const sanitizedPhone = data.phone.replace(/\D/g, '');
    if (!sanitizedPhone) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }
    
    return errors;
  }, [sanitizeInput]);

  // Clear messages after timeout
  const clearError = useCallback(() => {
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  // Production-grade fetch users with proper error handling
  const fetchUsers = useCallback(async () => {
    try {
      updateLoadingState('users', true);
      setError(null);
      
      const users = await apiCall('/super-admin/users');
      setUsers(Array.isArray(users) ? users : []);
      
      console.log('👥 Users loaded successfully:', users?.length || 0);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      console.error('❌ Error fetching users:', error);
      setError(errorMessage);
      clearError();
      setUsers([]);
    } finally {
      updateLoadingState('users', false);
    }
  }, [apiCall, updateLoadingState, clearError]);

  // Fetch all permissions with production-grade handling
  const fetchPermissions = useCallback(async () => {
    try {
      updateLoadingState('permissions', true);
      setError(null);
      
      const permissions = await apiCall('/super-admin/permissions');
      setPermissions(Array.isArray(permissions) ? permissions : []);
      
      console.log('🔐 Permissions loaded successfully:', permissions?.length || 0);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load permissions';
      console.error('❌ Error fetching permissions:', error);
      setError(errorMessage);
      clearError();
      setPermissions([]);
    } finally {
      updateLoadingState('permissions', false);
    }
  }, [apiCall, updateLoadingState, clearError]);

  // Fetch user permissions with production-grade handling
  const fetchUserPermissions = useCallback(async (userId: string) => {
    if (!userId) {
      console.error('❌ fetchUserPermissions: Invalid userId');
      return;
    }
    
    try {
      updateLoadingState('userPermissions', true);
      setError(null);
      
      const userPerms = await apiCall(`/super-admin/users/${userId}/permissions`);
      setUserPermissions(Array.isArray(userPerms) ? userPerms : []);
      
      console.log(`🔐 User permissions loaded for ${userId}:`, userPerms?.length || 0);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user permissions';
      console.error('❌ Error fetching user permissions:', error);
      setError(errorMessage);
      clearError();
      setUserPermissions([]);
    } finally {
      updateLoadingState('userPermissions', false);
    }
  }, [apiCall, updateLoadingState, clearError]);

  // Production-grade create user with validation and proper feedback
  const createUser = useCallback(async () => {
    try {
      // Validate form data
      const errors = validateForm(formData);
      setFormErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        console.log('❌ Form validation failed:', errors);
        return;
      }
      
      updateLoadingState('createUser', true);
      setError(null);
      
      // Check for duplicate email
      const existingUser = users.find(user => 
        user.email.toLowerCase() === formData.email.toLowerCase()
      );
      if (existingUser) {
        setFormErrors({ email: 'A user with this email already exists' });
        return;
      }
      
      // Sanitize input data before sending to backend for additional security
      const sanitizedData = {
        email: sanitizeInput(formData.email.toLowerCase()),
        password: formData.password, // Don't sanitize password as it may contain special chars
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        phone: formData.phone.replace(/\D/g, ''), // Keep only digits
        role: 'admin' as const
      };

      // Create user via API with sanitized data
      const newUser = await apiCall('/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(sanitizedData)
      });
      
      // Refresh data and close modal
      await fetchUsers();
      resetCreateForm();
      setShowCreateModal(false);
      
      console.log('✅ Admin user created successfully:', newUser);
      showSuccess(`Admin user "${formData.firstName} ${formData.lastName}" created successfully!`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      console.error('❌ Error creating user:', error);
      setError(errorMessage);
      clearError();
      
      // Error is already set in setError, no additional alert needed
    } finally {
      updateLoadingState('createUser', false);
    }
  }, [formData, validateForm, users, apiCall, fetchUsers, updateLoadingState, clearError, showSuccess, sanitizeInput]);

  // Reset create form
  const resetCreateForm = useCallback(() => {
    setFormData({ 
      email: '', 
      password: '', 
      firstName: '', 
      lastName: '', 
      phone: '' 
    });
    setFormErrors({});
  }, []);

  // Production-grade toggle user status
  const toggleUserStatus = useCallback(async (userId: string, currentStatus: boolean) => {
    if (!userId) {
      console.error('❌ toggleUserStatus: Invalid userId');
      return;
    }
    
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }
    
    try {
      updateLoadingState('updateUser', true);
      setError(null);
      
      await apiCall(`/super-admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus })
      });
      
      // Update local state optimistically
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_active: newStatus }
            : user
        )
      );
      
      console.log(`✅ User ${action}d successfully:`, userId);
      showSuccess(`User ${action}d successfully!`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} user`;
      console.error(`❌ Error ${action}ing user:`, error);
      setError(errorMessage);
      clearError();
      // Error is already set in setError, no additional alert needed
    } finally {
      updateLoadingState('updateUser', false);
    }
  }, [apiCall, updateLoadingState, clearError, showSuccess]);

  // Production-grade grant permissions
  const grantPermissions = useCallback(async (
    permissionIds: string[], 
    canView: boolean, 
    canEdit: boolean
  ) => {
    if (!selectedUser) {
      console.error('❌ grantPermissions: No user selected');
      return;
    }
    
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      console.error('❌ grantPermissions: Invalid permission IDs');
      return;
    }
    
    const permissionCount = permissionIds.length;
    const accessType = canEdit ? 'edit' : 'view';
    const confirmMessage = permissionCount === 1 
      ? `Grant ${accessType} access to this permission?`
      : `Grant ${accessType} access to ${permissionCount} permissions?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      updateLoadingState('grantPermissions', true);
      setError(null);
      
      await apiCall(`/super-admin/users/${selectedUser.id}/permissions/grant`, {
        method: 'POST',
        body: JSON.stringify({
          permissionIds,
          canView,
          canEdit
        })
      });
      
      // Refresh permissions data
      await Promise.all([
        fetchUserPermissions(selectedUser.id),
        fetchUsers()
      ]);
      
      console.log(`✅ Permissions granted successfully for user ${selectedUser.email}:`, {
        permissionIds,
        canView,
        canEdit
      });
      
      showSuccess(`${accessType.charAt(0).toUpperCase() + accessType.slice(1)} access granted successfully!`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant permissions';
      console.error('❌ Error granting permissions:', error);
      setError(errorMessage);
      clearError();
      // Error is already set in setError, no additional alert needed
    } finally {
      updateLoadingState('grantPermissions', false);
    }
  }, [selectedUser, apiCall, fetchUserPermissions, fetchUsers, updateLoadingState, clearError, showSuccess]);

  // Production-grade revoke permissions
  const revokePermissions = useCallback(async (permissionIds: string[]) => {
    if (!selectedUser) {
      console.error('❌ revokePermissions: No user selected');
      return;
    }
    
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      console.error('❌ revokePermissions: Invalid permission IDs');
      return;
    }
    
    const permissionCount = permissionIds.length;
    const confirmMessage = permissionCount === 1 
      ? 'Revoke access to this permission?'
      : `Revoke access to ${permissionCount} permissions?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      updateLoadingState('revokePermissions', true);
      setError(null);
      
      await apiCall(`/super-admin/users/${selectedUser.id}/permissions/revoke`, {
        method: 'POST',
        body: JSON.stringify({ permissionIds })
      });
      
      // Refresh permissions data
      await Promise.all([
        fetchUserPermissions(selectedUser.id),
        fetchUsers()
      ]);
      
      console.log(`✅ Permissions revoked successfully for user ${selectedUser.email}:`, permissionIds);
      showSuccess('Permissions revoked successfully!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke permissions';
      console.error('❌ Error revoking permissions:', error);
      setError(errorMessage);
      clearError();
      // Error is already set in setError, no additional alert needed
    } finally {
      updateLoadingState('revokePermissions', false);
    }
  }, [selectedUser, apiCall, fetchUserPermissions, fetchUsers, updateLoadingState, clearError, showSuccess]);

  // Production-grade component initialization
  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async () => {
      try {
        console.log('🚀 Initializing SuperAdmin User Management...');
        
        // Load core data in parallel
        await Promise.all([
          fetchUsers(),
          fetchPermissions()
        ]);
        
        if (isMounted) {
          console.log('✅ SuperAdmin component initialized successfully');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Failed to initialize SuperAdmin component:', error);
          const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
          setError(`Failed to initialize: ${errorMessage}`);
          clearError();
        }
      }
    };

    initializeComponent();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [fetchUsers, fetchPermissions, clearError]);

  // Production-grade permissions modal handler
  const handlePermissionsModal = useCallback(async (user: AdminUser) => {
    if (!user || !user.id) {
      console.error('❌ handlePermissionsModal: Invalid user');
      return;
    }
    
    console.log('📋 Opening permissions modal for user:', user.email);
    
    setSelectedUser(user);
    setShowPermissionsModal(true);
    setUserPermissions([]); // Clear previous user permissions
    
    // Load user permissions
    await fetchUserPermissions(user.id);
  }, [fetchUserPermissions]);

  // Memoized computed values for performance
  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.is_active).length,
    inactive: users.filter(user => !user.is_active).length,
    admins: users.filter(user => user.role === 'admin').length,
    superAdmins: users.filter(user => user.role === 'super_admin').length
  }), [users]);

  const isMainLoading = useMemo(() => 
    loadingStates.users && users.length === 0, 
    [loadingStates.users, users.length]
  );

  // Production-grade loading state with error handling
  if (isMainLoading) {
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
        <h1 className="text-2xl font-bold mb-2">🔒 Super Admin</h1>
        <p className="text-purple-100">Create, manage, and control admin user access with advanced permission controls</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Admin Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Admin Users</p>
            <p className="text-4xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-xs text-blue-200 mt-2">Managed</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-100 mb-2">Active Users</p>
            <p className="text-4xl font-bold text-white">{users.filter(u => u.is_active).length}</p>
            <p className="text-xs text-green-200 mt-2">Online & Ready</p>
          </div>
        </div>

        {/* Available Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-100 mb-2">Available Permissions</p>
            <p className="text-4xl font-bold text-white">{permissions.length}</p>
            <p className="text-xs text-purple-200 mt-2">Access Controls</p>
          </div>
        </div>

        {/* Super Admins */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-orange-100 mb-2">Super Admins</p>
            <p className="text-4xl font-bold text-white">{users.filter(u => u.role === 'super_admin').length}</p>
            <p className="text-xs text-orange-200 mt-2">System Level</p>
          </div>
        </div>

      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Operations</h2>
          <p className="text-gray-600 text-sm">Manage admin accounts, permissions, and access levels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <span>➕</span>
          <span>Create Admin User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Admin Users</h3>
              <p className="text-gray-600 mt-1">{users.length} total users • {users.filter(u => u.is_active).length} active</p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                {users.filter(u => u.is_active).length} Active
              </div>
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium">
                {users.filter(u => !u.is_active).length} Inactive
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Permissions</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Last Login</th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div>
                      <div className="text-base font-bold text-gray-900 mb-1">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-700">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      user.role === 'super_admin' 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ring-2 ring-blue-200'
                    }`}>
                      {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                      user.is_active 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white ring-2 ring-green-200' 
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white ring-2 ring-red-200'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {user.role === 'super_admin' ? 'All Permissions' : `${user.assigned_permissions} assigned`}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                    {user.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handlePermissionsModal(user)}
                          disabled={loadingStates.userPermissions}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                        >
                          {loadingStates.userPermissions ? 'Loading...' : 'Permissions'}
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          disabled={loadingStates.updateUser}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md ${
                            loadingStates.updateUser
                              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              : user.is_active 
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                          }`}
                        >
                          {loadingStates.updateUser 
                            ? 'Updating...' 
                            : user.is_active ? 'Deactivate' : 'Activate'
                          }
                        </button>
                      </>
                    )}
                    {user.role === 'super_admin' && (
                      <span className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md text-sm">
                        Protected Account
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Create Admin User
                </h3>
                <p className="text-gray-600 mt-1">
                  Add a new admin user to the platform with controlled access
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                disabled={loadingStates.createUser}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Form validation errors display */}
                {Object.keys(formErrors).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-red-800 text-sm font-medium mb-2">Please fix the following errors:</div>
                    <ul className="text-red-700 text-sm space-y-1">
                      {Object.entries(formErrors).map(([field, error]) => (
                        <li key={field}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.firstName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.lastName 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-600 text-xs mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.phone 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <input
                    type="password"
                    placeholder="Password (min 8 chars, mixed case + number + special char)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {formErrors.password && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Password must contain: uppercase, lowercase, number, and special character (minimum 8 characters)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                disabled={loadingStates.createUser}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200 mr-3"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={loadingStates.createUser || Object.keys(formErrors).length > 0}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg ${
                  loadingStates.createUser || Object.keys(formErrors).length > 0
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                }`}
              >
                {loadingStates.createUser ? 'Creating User...' : 'Create Admin User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Manage Permissions
                </h3>
                <p className="text-gray-600 mt-1">
                  {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                </p>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* Bulk Permission Actions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Quick Actions {loadingStates.grantPermissions || loadingStates.revokePermissions ? '(Processing...)' : ''}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const allPermissionIds = permissions.map(p => p.id);
                      grantPermissions(allPermissionIds, true, false);
                    }}
                    disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    {loadingStates.grantPermissions ? 'Granting...' : 'Grant All View Access'}
                  </button>
                  <button
                    onClick={() => {
                      const allPermissionIds = permissions.map(p => p.id);
                      grantPermissions(allPermissionIds, true, true);
                    }}
                    disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    {loadingStates.grantPermissions ? 'Granting...' : 'Grant All Edit Access'}
                  </button>
                  <button
                    onClick={() => {
                      const allPermissionIds = permissions.map(p => p.id);
                      revokePermissions(allPermissionIds);
                    }}
                    disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                    className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    {loadingStates.revokePermissions ? 'Revoking...' : 'Revoke All Access'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-xs text-gray-500 mb-4">
                  Total Permissions: {permissions.length} | User Has: {userPermissions.length} | User: {selectedUser?.email}
                </div>
                {permissions.map((permission) => {
                  const userPerm = userPermissions.find(up => up.permission_key === permission.permission_key);
                  const hasPermission = !!userPerm;
                  
                  return (
                    <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{permission.permission_name}</h4>
                          <p className="text-sm text-gray-600">{permission.permission_description}</p>
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            {permission.category}
                          </span>
                          {hasPermission && (
                            <div className="text-xs text-green-600 mt-2">
                              Granted: {userPerm.granted_at ? new Date(userPerm.granted_at).toLocaleDateString() : 'N/A'}
                              {userPerm.granted_by_email && ` by ${userPerm.granted_by_email}`}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {/* Current Permission Status */}
                          <div className="text-xs font-medium">
                            {hasPermission ? (
                              <div className="flex items-center space-x-4">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                  GRANTED
                                </span>
                                <span>
                                  View: {userPerm?.can_view ? 'YES' : 'NO'} | Edit: {userPerm?.can_edit ? 'YES' : 'NO'}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                NOT GRANTED
                              </span>
                            )}
                          </div>
                          
                          {/* Permission Actions */}
                          <div className="flex flex-wrap gap-1">
                            {/* Always show Grant View if user doesn't have view permission */}
                            {(!hasPermission || !userPerm?.can_view) && (
                              <button
                                onClick={() => grantPermissions([permission.id], true, false)}
                                disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-xs"
                              >
                                {loadingStates.grantPermissions ? 'Granting...' : 'Grant View'}
                              </button>
                            )}
                            
                            {/* Always show Grant Edit if user doesn't have edit permission */}
                            {(!hasPermission || !userPerm?.can_edit) && (
                              <button
                                onClick={() => grantPermissions([permission.id], true, true)}
                                disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-xs"
                              >
                                {loadingStates.grantPermissions ? 'Granting...' : 'Grant Edit'}
                              </button>
                            )}
                            
                            {/* Show revoke only if user has any permission */}
                            {hasPermission && (
                              <button
                                onClick={() => revokePermissions([permission.id])}
                                disabled={loadingStates.grantPermissions || loadingStates.revokePermissions}
                                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-xs"
                              >
                                {loadingStates.revokePermissions ? 'Revoking...' : 'Revoke All'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUserManagement;