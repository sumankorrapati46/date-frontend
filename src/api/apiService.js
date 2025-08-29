import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 30000, // Increased from 10000 to 30000 (30 seconds)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Login
  login: async (credentials) => {
    // Normalize payload keys to match backend expectations
    const payload = {
      email: credentials.email || credentials.userName || credentials.username,
      password: credentials.password,
    };
    try {
      const response = await api.post('/auth/login', payload);
      // Try to extract token from common locations
      const headerAuth = response.headers?.authorization || response.headers?.Authorization;
      const headerToken = headerAuth?.startsWith('Bearer ')
        ? headerAuth.substring('Bearer '.length)
        : headerAuth;
      const body = response.data || {};
      const bodyToken = body.token || body.jwt || body.accessToken || body.access_token;
      return { ...body, token: bodyToken || headerToken };
    } catch (err) {
      // Fallbacks for common Spring endpoints
      try {
        const response = await api.post('/login', payload);
        const headerAuth = response.headers?.authorization || response.headers?.Authorization;
        const headerToken = headerAuth?.startsWith('Bearer ')
          ? headerAuth.substring('Bearer '.length)
          : headerAuth;
        const body = response.data || {};
        const bodyToken = body.token || body.jwt || body.accessToken || body.access_token;
        return { ...body, token: bodyToken || headerToken };
      } catch (err2) {
        const response = await api.post('/authenticate', payload);
        const headerAuth = response.headers?.authorization || response.headers?.Authorization;
        const headerToken = headerAuth?.startsWith('Bearer ')
          ? headerAuth.substring('Bearer '.length)
          : headerAuth;
        const body = response.data || {};
        const bodyToken = body.token || body.jwt || body.accessToken || body.access_token;
        return { ...body, token: bodyToken || headerToken };
      }
    }
  },

  // Get user profile
  getProfile: async () => {
    // Try common profile endpoints for compatibility
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (e1) {
      try {
        const res = await api.get('/auth/profile');
        return res.data;
      } catch (e2) {
        const res = await api.get('/auth/users/profile');
        return res.data;
      }
    }
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Send OTP
  sendOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-otp', { emailOrPhone: email }, {
        timeout: 45000 // 45 seconds for OTP operations
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP request timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (otpData) => {
    try {
      const response = await api.post('/auth/verify-otp', { 
        emailOrPhone: otpData.email, 
        otp: otpData.otp 
      }, {
        timeout: 30000 // 30 seconds for OTP verification
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP verification timed out. Please try again.');
      }
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (email) => {
    try {
      const response = await api.post('/auth/resend-otp', { emailOrPhone: email }, {
        timeout: 45000 // 45 seconds for OTP operations
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('OTP resend timed out. Please check your internet connection and try again.');
      }
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (emailOrPhone) => {
    const response = await api.post('/auth/forgot-password', { emailOrPhone });
    return response.data;
  },

  // Forgot user ID
  forgotUserId: async (emailOrPhone) => {
    const response = await api.post('/auth/forgot-user-id', { emailOrPhone });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Change user ID
  changeUserId: async (userIdData) => {
    const response = await api.post('/auth/change-user-id', userIdData);
    return response.data;
  },

  // Get countries
  getCountries: async () => {
    const response = await api.get('/auth/countries');
    return response.data;
  },

  // Get states
  getStates: async (countryId) => {
    const response = await api.post('/auth/states', { countryId });
    return response.data;
  },

  // Get address by pincode
  getAddressByPincode: async (pincode) => {
    const response = await api.get(`/auth/pincode/${pincode}`);
    return response.data;
  }
};

// Super Admin API calls
export const superAdminAPI = {
  // Get all users (registrations)
  getAllUsers: async () => {
    const response = await api.get('/super-admin/registration-list');
    return response.data;
  },

  // Get registration list with filters
  getRegistrationList: async (filters = {}) => {
    const response = await api.get('/super-admin/registration-list', { params: filters });
    return response.data;
  },

  // Get registration list by status
  getRegistrationListByStatus: async (status) => {
    const response = await api.get('/super-admin/registration-list/filter', { params: { status } });
    return response.data;
  },

  // Search registrations
  searchRegistrations: async (query) => {
    const response = await api.get('/super-admin/registration-list/search', { params: { query } });
    return response.data;
  },

  // Get pending registrations
  getPendingRegistrations: async () => {
    const response = await api.get('/super-admin/pending-registrations');
    return response.data;
  },

  // Get approved users
  getApprovedUsers: async () => {
    const response = await api.get('/super-admin/approved-users');
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await api.get(`/super-admin/users/by-role/${role}`);
    return response.data;
  },

  // Get pending users by role
  getPendingUsersByRole: async (role) => {
    const response = await api.get(`/super-admin/pending-users/by-role/${role}`);
    return response.data;
  },

  // Approve user
  approveUser: async (userId, role) => {
    const response = await api.put(`/auth/users/${userId}/approve`, { role });
    return response.data;
  },

  // Reject user (update status to REJECTED)
  rejectUser: async (userId, reason) => {
    const response = await api.put(`/auth/users/${userId}/status`, { status: 'REJECTED' });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/super-admin/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/super-admin/users/${userId}`, userData);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/auth/users/${userId}/status`, { status });
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/public/dashboard/stats');
    return response.data;
  },

  // Bulk assign farmers to employee
  bulkAssignFarmers: async (farmerIds, employeeId) => {
    const response = await api.post('/super-admin/bulk-assign-farmers', { farmerIds, employeeId });
    return response.data;
  },

  // Single assign farmer to employee (fallback)
  assignFarmer: async (farmerId, employeeId) => {
    const response = await api.post('/super-admin/assign-farmer', null, { 
      params: { farmerId, employeeId } 
    });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    const response = await api.get(`/super-admin/employees/${employeeId}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId, employeeData) => {
    const response = await api.put(`/super-admin/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/super-admin/users/${userId}`);
    return response.data;
  },

  // Force password change
  forcePasswordChange: async (userId) => {
    const response = await api.put(`/super-admin/users/${userId}/force-password-change`);
    return response.data;
  }
};

// Farmers API calls
export const farmersAPI = {
  // Get all farmers
  getAllFarmers: async (filters = {}) => {
    const response = await api.get('/super-admin/farmers', { params: filters });
    return response.data;
  },

  // Get farmer by ID
  getFarmerById: async (id) => {
    const response = await api.get(`/super-admin/farmers/${id}`);
    return response.data;
  },

  // Create farmer (supports files)
  createFarmer: async (farmerData) => {
    // Use the /api/farmers endpoint which supports multipart/form-data
    const formData = new FormData();
    
    // Extract file fields - check all possible file field names
    const photo = farmerData.photo;
    const passbookPhoto = farmerData.passbookFile || farmerData.passbookPhoto;
    const aadhaar = farmerData.documentFileName; // Map documentFileName to aadhaar
    const soilTestCertificate = farmerData.soilTestCertificate || farmerData.currentSoilTestCertificateFileName;
    
    console.log('🔍 File fields found:');
    console.log('  - photo:', photo);
    console.log('  - passbookPhoto:', passbookPhoto);
    console.log('  - aadhaar:', aadhaar);
    console.log('  - soilTestCertificate:', soilTestCertificate);
    
    // Create farmerDto object without file fields and fix field mappings
    const farmerDto = { ...farmerData };
    
    // Remove file fields and any other non-serializable objects
    delete farmerDto.photo;
    delete farmerDto.passbookPhoto;
    delete farmerDto.passbookFile; // Also remove passbookFile
    delete farmerDto.documentFileName;
    delete farmerDto.soilTestCertificate;
    delete farmerDto.currentSoilTestCertificateFileName;
    
    // Remove any other potential File objects or complex objects
    Object.keys(farmerDto).forEach(key => {
      if (farmerDto[key] instanceof File || farmerDto[key] instanceof Blob) {
        delete farmerDto[key];
      }
    });
    
    // Fix field name mappings
    if (farmerDto.alternativeNumber) {
      farmerDto.alternativeContactNumber = farmerDto.alternativeNumber;
      delete farmerDto.alternativeNumber;
    }
    
    // Ensure required fields have default values if missing
    if (!farmerDto.salutation) farmerDto.salutation = 'Mr';
    if (!farmerDto.lastName) farmerDto.lastName = farmerDto.firstName || 'Unknown';
    if (!farmerDto.dateOfBirth) farmerDto.dateOfBirth = '1990-01-01';
    if (!farmerDto.gender) farmerDto.gender = 'Male';
    if (!farmerDto.nationality) farmerDto.nationality = 'Indian';
    if (!farmerDto.country) farmerDto.country = 'India';
    
    // Log the final farmerDto object for debugging
    console.log('🔍 Final farmerDto object (after cleanup):', farmerDto);
    console.log('🔍 Required fields check:');
    console.log('  - salutation:', farmerDto.salutation);
    console.log('  - firstName:', farmerDto.firstName);
    console.log('  - lastName:', farmerDto.lastName);
    console.log('  - dateOfBirth:', farmerDto.dateOfBirth);
    console.log('  - gender:', farmerDto.gender);
    console.log('  - nationality:', farmerDto.nationality);
    console.log('  - country:', farmerDto.country);
    
    // Ensure contact numbers match pattern (10 digits)
    if (farmerDto.contactNumber && !/^\d{10}$/.test(farmerDto.contactNumber)) {
      console.warn('⚠️ Contact number must be 10 digits:', farmerDto.contactNumber);
    }
    if (farmerDto.alternativeContactNumber && !/^\d{10}$/.test(farmerDto.alternativeContactNumber)) {
      console.warn('⚠️ Alternative contact number must be 10 digits:', farmerDto.alternativeContactNumber);
    }
    
    // Ensure pincode is 6 digits
    if (farmerDto.pincode && !/^\d{6}$/.test(farmerDto.pincode)) {
      console.warn('⚠️ Pincode must be 6 digits:', farmerDto.pincode);
    }
    
    // Add farmerDto as JSON string
    const farmerDtoJson = JSON.stringify(farmerDto);
    console.log('🔍 farmerDto JSON being sent:', farmerDtoJson);
    console.log('🔍 farmerDto object before JSON.stringify:', farmerDto);
    formData.append('farmerDto', farmerDtoJson);
    
    // Add files if they exist
    if (photo instanceof File) {
      formData.append('photo', photo);
    }
    if (passbookPhoto instanceof File) {
      formData.append('passbookPhoto', passbookPhoto);
    }
    if (aadhaar instanceof File) {
      formData.append('aadhaar', aadhaar);
    }
    if (soilTestCertificate instanceof File) {
      formData.append('soilTestCertificate', soilTestCertificate);
    }
    
    console.log('🔍 Sending to /api/farmers with multipart data');
    try {
      const response = await api.post('/farmers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Server error details:', error.response?.data);
      if (error.response?.status === 500) {
        throw new Error(`Server error: ${error.response?.data?.message || 'Internal server error. Please check all required fields.'}`);
      }
      throw error;
    }
  },

  // Update farmer
  updateFarmer: async (id, farmerData) => {
    const response = await api.put(`/super-admin/farmers/${id}`, farmerData);
    return response.data;
  },

  // Delete farmer
  deleteFarmer: async (id) => {
    const response = await api.delete(`/super-admin/farmers/${id}`);
    return response.data;
  },

  // Assign farmer to employee
  assignFarmer: async (farmerId, employeeId) => {
    const response = await api.post(`/super-admin/farmers/${farmerId}/assign`, { employeeId });
    return response.data;
  },

  // Get farmer statistics
  getFarmerStats: async () => {
    const response = await api.get('/super-admin/farmers/stats');
    return response.data;
  }
};

// Admin-specific API calls
export const adminAPI = {
  // Get all farmers for admin
  getAllFarmers: async (filters = {}) => {
    const response = await api.get('/admin/farmers', { params: filters });
    return response.data;
  },

  // Get all employees for admin
  getAllEmployees: async (filters = {}) => {
    const response = await api.get('/admin/employees', { params: filters });
    return response.data;
  },

  // Get farmers with KYC status
  getFarmersWithKyc: async () => {
    const response = await api.get('/admin/farmers-with-kyc');
    return response.data;
  },

  // Get employees with stats
  getEmployeesWithStats: async () => {
    const response = await api.get('/admin/employees-with-stats');
    return response.data;
  },

  // Get farmers by employee
  getFarmersByEmployee: async (employeeId) => {
    const response = await api.get(`/admin/employees/${employeeId}/assigned-farmers`);
    return response.data;
  },

  // Get todo list for admin
  getTodoList: async () => {
    const response = await api.get('/admin/todo-list');
    return response.data;
  },

  // Get enhanced todo list
  getEnhancedTodoList: async () => {
    const response = await api.get('/admin/enhanced-todo-list');
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  // Filter farmers
  filterFarmers: async (filters = {}) => {
    const response = await api.get('/admin/farmers/filter', { params: filters });
    return response.data;
  },

  // Get locations
  getLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },

  // Bulk assign farmers to employee
  bulkAssignFarmers: async (farmerIds, employeeId) => {
    const response = await api.post('/admin/bulk-assign-farmers', { farmerIds, employeeId });
    return response.data;
  },

  // Single assign farmer to employee (fallback)
  assignFarmer: async (farmerId, employeeId) => {
    const response = await api.post('/admin/assign-farmer', null, { 
      params: { farmerId, employeeId } 
    });
    return response.data;
  },

  // Get assignment history
  getAssignmentHistory: async (filters = {}) => {
    const response = await api.get('/admin/assignment-history', { params: filters });
    return response.data;
  },

  // Get farmers by assignment status
  getFarmersByAssignmentStatus: async (assignmentStatus) => {
    const response = await api.get('/admin/farmers/by-assignment-status', { 
      params: { assignmentStatus } 
    });
    return response.data;
  },

  // Get all registrations for admin
  getAllRegistrations: async (filters = {}) => {
    const response = await api.get('/admin/registration-list', { params: filters });
    return response.data;
  },

  // Get registration list by status for admin
  getRegistrationListByStatus: async (status) => {
    const response = await api.get('/admin/registration-list/filter', { params: { status } });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (employeeId) => {
    const response = await api.get(`/admin/employees/${employeeId}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (employeeId, employeeData) => {
    const response = await api.put(`/admin/employees/${employeeId}`, employeeData);
    return response.data;
  },

  // Approve registration for admin
  approveRegistration: async (registrationId, approvalData) => {
    const response = await api.post(`/admin/registrations/${registrationId}/approve`, approvalData);
    return response.data;
  },

  // Reject registration for admin
  rejectRegistration: async (registrationId, rejectionData) => {
    const response = await api.post(`/admin/registrations/${registrationId}/reject`, rejectionData);
    return response.data;
  }
};

// Employees API calls (for Super Admin and Admin)
export const employeesAPI = {
  // Get all employees
  getAllEmployees: async (filters = {}) => {
    const response = await api.get('/super-admin/employees', { params: filters });
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    const response = await api.get(`/super-admin/employees/${id}`);
    return response.data;
  },

  // Create employee
  createEmployee: async (employeeData) => {
    const response = await api.post('/super-admin/employees', employeeData);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/super-admin/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id) => {
    const response = await api.delete(`/super-admin/employees/${id}`);
    return response.data;
  },

  // Get assigned farmers for employee
  getAssignedFarmers: async (employeeId) => {
    const response = await api.get(`/super-admin/employees/${employeeId}/assigned-farmers`);
    return response.data;
  },

  // Get employee statistics
  getEmployeeStats: async () => {
    const response = await api.get('/super-admin/employees/stats');
    return response.data;
  }
};

// Employee-specific API calls (for Employee role)
export const employeeAPI = {
  // Get assigned farmers for current employee
  getAssignedFarmers: async (employeeId) => {
    try {
      console.log('🔄 Fetching assigned farmers from dashboard endpoint');
      const response = await api.get('/employees/dashboard/assigned-farmers');
      console.log('✅ Success with dashboard endpoint');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch assigned farmers:', error);
      throw error;
    }
  },

  // Get employee profile
  getProfile: async () => {
    const response = await api.get('/employees/profile');
    return response.data;
  },

  // Update employee profile
  updateProfile: async (profileData) => {
    const response = await api.put('/employees/profile', profileData);
    return response.data;
  },

  // Get employee statistics
  getStats: async () => {
    const response = await api.get('/employees/stats');
    return response.data;
  }
};

// Registrations API calls
export const registrationsAPI = {
  // Get all registrations
  getAllRegistrations: async (filters = {}) => {
    const response = await api.get('/registrations', { params: filters });
    return response.data;
  },

  // Get registration by ID
  getRegistrationById: async (id) => {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  },

  // Approve registration
  approveRegistration: async (id, approvalData) => {
    const response = await api.post(`/registrations/${id}/approve`, approvalData);
    return response.data;
  },

  // Reject registration
  rejectRegistration: async (id, rejectionData) => {
    const response = await api.post(`/registrations/${id}/reject`, rejectionData);
    return response.data;
  },

  // Get registration statistics
  getRegistrationStats: async () => {
    const response = await api.get('/registrations/stats');
    return response.data;
  }
};

// KYC API calls
export const kycAPI = {
  // Upload KYC documents
  uploadDocuments: async (farmerId, documents) => {
    const formData = new FormData();
    Object.keys(documents).forEach(key => {
      if (documents[key]) {
        formData.append(key, documents[key]);
      }
    });
    
    const response = await api.post(`/employees/kyc/${farmerId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Approve KYC
  approveKYC: async (farmerId, approvalData) => {
    const response = await api.put(`/employees/kyc/approve/${farmerId}`);
    return response.data;
  },

  // Reject KYC
  rejectKYC: async (farmerId, rejectionData) => {
    const response = await api.put(`/employees/kyc/reject/${farmerId}`, {
      reason: rejectionData.reason || 'KYC rejected'
    });
    return response.data;
  },

  // Refer back KYC
  referBackKYC: async (farmerId, referBackData) => {
    const response = await api.put(`/employees/kyc/refer-back/${farmerId}`, {
      reason: referBackData.reason || 'KYC referred back'
    });
    return response.data;
  },

  // Get KYC status
  getKYCStatus: async (farmerId) => {
    const response = await api.get(`/employees/kyc/${farmerId}/status`);
    return response.data;
  },

  // Get KYC documents
  getKYCDocuments: async (farmerId) => {
    const response = await api.get(`/employees/kyc/${farmerId}/documents`);
    return response.data;
  }
};

// Dashboard API calls
export const dashboardAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get admin dashboard data
  getAdminDashboardData: async () => {
    const response = await api.get('/dashboard/admin');
    return response.data;
  },

  // Get super admin dashboard data
  getSuperAdminDashboardData: async () => {
    const response = await api.get('/dashboard/super-admin');
    return response.data;
  },

  // Get employee dashboard data
  getEmployeeDashboardData: async (employeeId) => {
    const response = await api.get(`/dashboard/employee/${employeeId}`);
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async () => {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  }
};

// Main API service object (for backward compatibility)
export const apiService = {
  // Authentication
  login: authAPI.login,
  getProfile: authAPI.getProfile,
  register: authAPI.register,
  sendOTP: authAPI.sendOTP,
  verifyOTP: authAPI.verifyOTP,
  resendOTP: authAPI.resendOTP,
  forgotPassword: authAPI.forgotPassword,
  forgotUserId: authAPI.forgotUserId,
  resetPassword: authAPI.resetPassword,
  changePassword: authAPI.changePassword,
  changeUserId: authAPI.changeUserId,
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // User management
  getAllUsers: superAdminAPI.getAllUsers,
  getUserById: superAdminAPI.getUserById,
  updateUser: superAdminAPI.updateUser,
  deleteUser: superAdminAPI.deleteUser,
  forcePasswordChange: superAdminAPI.forcePasswordChange,

  // Farmer management
  createFarmer: farmersAPI.createFarmer,
  getFarmerById: farmersAPI.getFarmerById,
  getAllFarmers: farmersAPI.getAllFarmers,
  updateFarmer: farmersAPI.updateFarmer,
  deleteFarmer: farmersAPI.deleteFarmer,
  getAddressByPincode: authAPI.getAddressByPincode,
  getFarmerDashboardData: async (email) => {
    const response = await api.get(`/farmers/dashboard/by-email?email=${email}`);
    return response.data;
  },

  // Employee management
  createEmployee: employeesAPI.createEmployee,
  getEmployeeById: employeesAPI.getEmployeeById,
  getAllEmployees: employeesAPI.getAllEmployees,
  updateEmployee: employeesAPI.updateEmployee,
  deleteEmployee: employeesAPI.deleteEmployee,
  assignFarmerToEmployee: adminAPI.assignFarmer,
  getFarmersByEmployee: adminAPI.getFarmersByEmployee,
  approveKyc: kycAPI.approveKYC,
  referBackKyc: kycAPI.referBackKYC,
  rejectKyc: kycAPI.rejectKYC,

  // Dashboard
  getDashboardStats: dashboardAPI.getDashboardStats,
  getRecentActivity: dashboardAPI.getRecentActivity,
  getFarmerStats: farmersAPI.getFarmerStats,
  getEmployeeStats: employeesAPI.getEmployeeStats,
  getKycStats: kycAPI.getKYCStatus,

  // Bulk Operations
  bulkImport: async (type, formData) => {
    const response = await api.post(`/bulk/import/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  bulkExport: async (type, filters) => {
    const response = await api.post(`/bulk/export/${type}`, filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadTemplate: async (type) => {
    const response = await api.get(`/bulk/template/${type}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getImportStatus: async (importId) => {
    const response = await api.get(`/bulk/import/status/${importId}`);
    return response.data;
  },

  getImportHistory: async (userEmail) => {
    const response = await api.get(`/bulk/import/history?userEmail=${userEmail}`);
    return response.data;
  },

  bulkAssignFarmersToEmployee: async (farmerIds, employeeId) => {
    const response = await api.post('/bulk/assign/farmers-to-employee', null, {
      params: {
        farmerIds: farmerIds.join(','),
        employeeId,
      },
    });
    return response.data;
  },

  // New: assign by farmer names and employee email
  bulkAssignFarmersByNames: async (farmerNames, employeeEmail) => {
    const response = await api.post('/bulk/assign/farmers-by-names', {
      farmerNames,
      employeeEmail,
    });
    return response.data;
  },

  bulkAssignFarmersByLocation: async (location, employee) => {
    const params = { location };
    if (typeof employee === 'string') params.employeeEmail = employee;
    else if (employee != null) params.employeeId = employee;
    const response = await api.post('/bulk/assign/farmers-by-location', null, { params });
    return response.data;
  },

  bulkAssignFarmersRoundRobin: async (farmerIds) => {
    const response = await api.post('/bulk/assign/farmers-round-robin', null, {
      params: {
        farmerIds: farmerIds.join(','),
      },
    });
    return response.data;
  },
};

export default api; 