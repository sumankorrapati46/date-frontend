import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { farmersAPI, employeesAPI, adminAPI, superAdminAPI } from '../api/apiService';
import '../styles/Dashboard.css';
import FarmerForm from '../components/FarmerForm';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import EmployeeRegistrationForm from '../components/EmployeeRegistrationForm';
import AssignmentModal from '../components/AssignmentModal';
import AssignmentInline from '../components/AssignmentInline';
import KYCDocumentUpload from '../components/KYCDocumentUpload';
import ViewFarmerRegistrationDetails from '../components/ViewFarmerRegistrationDetails';
import ViewFarmer from '../components/ViewFarmer';
import ViewEditEmployeeDetails from '../components/ViewEditEmployeeDetails';
import ViewEmployeeDetails from '../components/ViewEmployeeDetails';
import ViewEmployee from '../components/ViewEmployee';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import UserProfileDropdown from '../components/UserProfileDropdown';
import RegistrationApprovalModal from '../components/RegistrationApprovalModal';
import RegistrationDetailModal from '../components/RegistrationDetailModal';
import RegistrationDetailsInline from '../components/RegistrationDetailsInline';
import BulkOperations from '../components/BulkOperations';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [farmers, setFarmers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignmentInline, setShowAssignmentInline] = useState(false);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showFarmerDetails, setShowFarmerDetails] = useState(false);
  const [selectedFarmerData, setSelectedFarmerData] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [showEmployeeView, setShowEmployeeView] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [showKYCDocumentUpload, setShowKYCDocumentUpload] = useState(false);
  const [selectedFarmerForKYC, setSelectedFarmerForKYC] = useState(null);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showRegistrationDetailModal, setShowRegistrationDetailModal] = useState(false);
  const [selectedRegistrationForDetail, setSelectedRegistrationForDetail] = useState(null);
  const [viewingRegistration, setViewingRegistration] = useState(null);
  const [showEmployeeRegistration, setShowEmployeeRegistration] = useState(false);
  const [showFarmerRegistration, setShowFarmerRegistration] = useState(false);
  const [registrationFilters, setRegistrationFilters] = useState({
    role: '',
    status: ''
  });
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    region: '',
    kycStatus: '',
    assignmentStatus: '',
    employeeFilter: ''
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'

  // Greeting function based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };
  
  // Random greeting content
  const greetingVariants = [
    { title: '🌞 Good Morning!', subtitle: 'Wishing you a bright and productive day ahead filled with positivity.' },
    { title: '🌸 Hello & Warm Greetings!', subtitle: 'May your day be filled with joy, success, and wonderful moments.' },
    { title: '🙌 Hi There!', subtitle: 'Hope you are doing well and everything is going smoothly on your end.' },
    { title: '🌟 Season Greetings!', subtitle: 'Sending best wishes for peace, happiness, and good health.' },
    { title: '🤝 Greetings of the Day!', subtitle: 'May this day bring you opportunities, growth, and good fortune.' }
  ];

  const [randomGreeting, setRandomGreeting] = useState(greetingVariants[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * greetingVariants.length);
    setRandomGreeting(greetingVariants[idx]);
  }, []);

  // Load data from API
  useEffect(() => {
    fetchData();
    
    // Listen for KYC status updates from Employee Dashboard
    const handleKYCUpdate = (event) => {
      console.log('🔄 Admin Dashboard: KYC status updated, refreshing data...');
      console.log('📊 KYC Update details:', event.detail);
      // Wait 2 seconds for backend to update, then refresh
      setTimeout(() => {
        console.log('🔄 Refreshing Admin data after KYC update...');
        fetchData();
      }, 2000);
    };
    
    window.addEventListener('kycStatusUpdated', handleKYCUpdate);
    
    return () => {
      window.removeEventListener('kycStatusUpdated', handleKYCUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Admin: Starting to fetch real data from API...');
      
      // Fetch farmers, employees, and registrations from API using admin endpoints
      const [farmersData, employeesData, registrationsData] = await Promise.all([
        adminAPI.getFarmersWithKyc(),
        adminAPI.getEmployeesWithStats(),
        superAdminAPI.getRegistrationList()
      ]);
      
      console.log('✅ Admin API Response:', { 
        farmersCount: farmersData?.length || 0,
        employeesCount: employeesData?.length || 0,
        registrationsCount: registrationsData?.length || 0
      });
      
      // Normalize employees from backend to match UI expectations
      const normalizedEmployees = (employeesData || []).map(e => ({
        id: e.id,
        name: e.name || `${[e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ')}`.trim(),
        phone: e.contactNumber,
        email: e.email,
        designation: e.designation || 'KYC Officer',
        state: e.state,
        district: e.district,
        region: e.region || 'Southern',
        status: e.status || e.accessStatus || 'ACTIVE',
        assignedFarmersCount: e.totalAssigned || 0,
        kycStats: {
          approved: e.approvedKyc || 0,
          pending: e.pendingKyc || 0,
          referBack: e.referBackKyc || 0,
          rejected: e.rejectedKyc || 0
        }
      }));

      // Use real data from APIs
      setFarmers(farmersData || []);
      setEmployees(normalizedEmployees);
      setRegistrations(registrationsData || []);
      
      console.log('✅ Admin: Using real data from APIs');
      console.log('- Farmers:', farmersData?.length || 0, 'records');
      console.log('- Employees:', employeesData?.length || 0, 'records');
      console.log('- Registrations:', registrationsData?.length || 0, 'records');
      
    } catch (error) {
      console.error('❌ Admin error fetching data:', error);
      console.log('❌ Using fallback endpoints due to API error');
      
      // Try basic admin endpoints as fallback
      try {
        const [fallbackFarmers, fallbackEmployees, fallbackRegistrations] = await Promise.all([
          adminAPI.getAllFarmers(),
          adminAPI.getAllEmployees(),
          superAdminAPI.getRegistrationList()
        ]);
        
        console.log('✅ Fallback API Response:', {
          farmersCount: fallbackFarmers?.length || 0,
          employeesCount: fallbackEmployees?.length || 0,
          registrationsCount: fallbackRegistrations?.length || 0
        });
        
        // Normalize fallback employees data too
        const normalizedFallbackEmployees = (fallbackEmployees || []).map(e => ({
          id: e.id,
          name: e.name || `${[e.firstName, e.middleName, e.lastName].filter(Boolean).join(' ')}`.trim(),
          phone: e.contactNumber,
          email: e.email,
          designation: e.designation || 'KYC Officer',
          state: e.state,
          district: e.district,
          region: e.region || 'Southern',
          status: e.status || e.accessStatus || 'ACTIVE',
          assignedFarmersCount: e.totalAssigned || 0,
          kycStats: {
            approved: e.approvedKyc || 0,
            pending: e.pendingKyc || 0,
            referBack: e.referBackKyc || 0,
            rejected: e.rejectedKyc || 0
          }
        }));

        setFarmers(fallbackFarmers || []);
        setEmployees(normalizedFallbackEmployees);
        setRegistrations(fallbackRegistrations || []);
        
      } catch (fallbackError) {
        console.error('❌ Fallback API also failed:', fallbackError);
        // Set empty arrays if all APIs fail
        setFarmers([]);
        setEmployees([]);
        setRegistrations([]);
      }
    }
  };

  const loadMockData = () => {
    const mockFarmers = [
      {
        id: 1,
        name: 'Ramu Yadav',
        phone: '9876543210',
        state: 'Telangana',
        district: 'Karimnagar',
        region: 'Southern',
        kycStatus: 'PENDING',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-15'
      },
      {
        id: 2,
        name: 'Krishna Kumar',
        phone: '9983733210',
        state: 'Andhrapradesh',
        district: 'rangareddy',
        region: 'Southern',
        kycStatus: 'PENDING',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-18'
      },
      {
        id: 3,
        name: 'suman kurrapati',
        phone: '9783733210',
        state: 'Andhrapradesh',
        district: 'kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-10'
      },
      {
        id: 4,
        name: 'vamsi krishna',
        phone: '9783733210',
        state: 'Andhrapradesh',
        district: 'kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-20'
      },
      {
        id: 5,
        name: 'hari kumar chowdary',
        phone: '6271979190',
        state: 'Andhrapradesh',
        district: 'Kadapa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-25'
      },
      {
        id: 6,
        name: 'kumar sreenu chowdary',
        phone: '6302949363',
        state: 'Andhrapradesh',
        district: 'kadpaa',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'karthik kumar',
        assignedDate: '2024-01-12'
      },
      {
        id: 7,
        name: 'Ainash kumar',
        phone: '9798433210',
        state: 'Andhrapradesh',
        district: 'Kuppam',
        region: 'Southern',
        kycStatus: 'NOT_STARTED',
        assignmentStatus: 'ASSIGNED',
        assignedEmployee: 'harish reddy',
        assignedDate: '2024-01-12'
      }
    ];

    const mockEmployees = [
      {
        id: 1,
        name: 'John Doe',
        phone: '9876543201',
        email: 'john.doe@company.com',
        designation: 'KYC Officer',
        state: 'Maharashtra',
        district: 'Pune',
        region: 'Western',
        status: 'ACTIVE',
        assignedFarmersCount: 15,
        kycStats: {
          approved: 8,
          pending: 5,
          referBack: 2,
          rejected: 0
        }
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '9876543202',
        email: 'jane.smith@company.com',
        designation: 'KYC Officer',
        state: 'Gujarat',
        district: 'Ahmedabad',
        region: 'Western',
        status: 'ACTIVE',
        assignedFarmersCount: 12,
        kycStats: {
          approved: 6,
          pending: 4,
          referBack: 1,
          rejected: 1
        }
      },
      {
        id: 3,
        name: 'Mike Johnson',
        phone: '9876543203',
        email: 'mike.johnson@company.com',
        designation: 'KYC Officer',
        state: 'Punjab',
        district: 'Amritsar',
        region: 'Northern',
        status: 'ACTIVE',
        assignedFarmersCount: 8,
        kycStats: {
          approved: 5,
          pending: 2,
          referBack: 1,
          rejected: 0
        }
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        phone: '9876543204',
        email: 'sarah.wilson@company.com',
        designation: 'KYC Officer',
        state: 'Karnataka',
        district: 'Bangalore',
        region: 'Southern',
        status: 'ACTIVE',
        assignedFarmersCount: 0,
        kycStats: {
          approved: 0,
          pending: 0,
          referBack: 0,
          rejected: 0
        }
      }
    ];

    setFarmers(mockFarmers);
    setEmployees(mockEmployees);
  };

  const loadMockRegistrationData = () => {
    const mockRegistrations = [
      {
        id: 1,
        name: 'Ramu Yadav',
        email: 'ramu.yadav@example.com',
        phoneNumber: '9876543210',
        role: 'FARMER',
        status: 'PENDING',
        createdAt: '2024-01-15',
        documents: ['Aadhar Card', 'PAN Card'],
        kycStatus: 'PENDING'
      },
      {
        id: 2,
        name: 'Krishna Kumar',
        email: 'krishna.kumar@example.com',
        phoneNumber: '9983733210',
        role: 'FARMER',
        status: 'PENDING',
        createdAt: '2024-01-14',
        documents: ['Aadhar Card', 'PAN Card'],
        kycStatus: 'PENDING'
      },
      {
        id: 3,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phoneNumber: '9876543211',
        role: 'EMPLOYEE',
        status: 'APPROVED',
        createdAt: '2024-01-14',
        documents: ['Aadhar Card', 'PAN Card', 'Educational Certificate'],
        kycStatus: 'APPROVED'
      },
      {
        id: 4,
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        phoneNumber: '9876543212',
        role: 'FARMER',
        status: 'REJECTED',
        createdAt: '2024-01-13',
        documents: ['Aadhar Card'],
        kycStatus: 'REJECTED',
        rejectionReason: 'Incomplete documentation'
      }
    ];
    setRegistrations(mockRegistrations);
  };

  const getFilteredFarmers = () => {
    return (farmers || []).filter(farmer => {
      const matchesState = !filters.state || farmer.state === filters.state;
      const matchesDistrict = !filters.district || farmer.district === filters.district;
      const matchesKycStatus = !filters.kycStatus || farmer.kycStatus === filters.kycStatus;
      const matchesEmployee = !filters.employeeFilter || farmer.assignedEmployee === filters.employeeFilter;
      
      return matchesState && matchesDistrict && matchesKycStatus && matchesEmployee;
    });
  };

  const getFilteredEmployees = () => {
    return (employees || []).filter(employee => {
      const matchesDistrict = !filters.district || employee.district === filters.district;
      return matchesDistrict;
    });
  };

  const getFilteredRegistrations = () => {
    console.log('All registrations:', registrations);
    // Apply filters
    const filtered = (registrations || []).filter(registration => {
      const roleMatch = !registrationFilters.role || registration.role === registrationFilters.role;
      const statusMatch = !registrationFilters.status || registration.status === registrationFilters.status;
      return roleMatch && statusMatch;
    });
    console.log('Filtered registrations:', filtered);
    return filtered;
  };

  const handleViewRegistration = (registration) => {
    setViewingRegistration(registration);
  };

  const handleCloseRegistrationDetailModal = () => {
    setShowRegistrationDetailModal(false);
    setSelectedRegistrationForDetail(null);
  };

  const handleRegistrationUpdate = () => {
    // Refresh the registration data
    fetchData();
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      await superAdminAPI.approveUser(registrationId, 'FARMER'); // Default role, can be updated
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'APPROVED' } : reg
      ));
      alert('Registration approved successfully!');
    } catch (error) {
      console.error('Error approving registration:', error);
      alert('Failed to approve registration. Please try again.');
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    try {
      await superAdminAPI.rejectUser(registrationId, 'Rejected by Admin');
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: 'REJECTED' } : reg
      ));
      alert('Registration rejected successfully!');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert('Failed to reject registration. Please try again.');
    }
  };

  const getStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Helper function to check if a date is within the specified period
    const isWithinPeriod = (dateString, period) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      
      switch (period) {
        case 'today':
          return date >= today;
        case 'month':
          return date >= startOfMonth;
        case 'year':
          return date >= startOfYear;
        default:
          return true; // 'all' period
      }
    };

    // Filter data based on time period
    const filteredFarmers = (farmers || []).filter(farmer => {
      const createdDate = farmer.createdAt || farmer.created_at || farmer.registrationDate || farmer.assignedDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const filteredEmployees = (employees || []).filter(employee => {
      const createdDate = employee.createdAt || employee.created_at || employee.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const totalFarmers = timeFilter === 'all' ? (farmers?.length || 0) : filteredFarmers.length;
    const totalEmployees = timeFilter === 'all' ? (employees?.length || 0) : filteredEmployees.length;
    const unassignedFarmers = filteredFarmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned').length;
    
    // Handle different KYC status formats
    const pendingKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
      f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
    ).length;
    
    const approvedKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
    ).length;
    
    const referBackKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
    ).length;
    
    const rejectedKYC = filteredFarmers.filter(f => 
      f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
    ).length;

    console.log('Admin Stats calculated from real data:');
    console.log('- Total Farmers:', totalFarmers);
    console.log('- Total Employees:', totalEmployees);
    console.log('- Unassigned Farmers:', unassignedFarmers);
    console.log('- Pending KYC:', pendingKYC);
    console.log('- Approved KYC:', approvedKYC);
    console.log('- Refer Back KYC:', referBackKYC);
    console.log('- Rejected KYC:', rejectedKYC);

    return {
      totalFarmers,
      totalEmployees,
      unassignedFarmers,
      pendingKYC,
      approvedKYC,
      referBackKYC,
      rejectedKYC,
      timeFilter
    };
  };

  const getTodoList = () => {
    const unassignedFarmers = (farmers || []).filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned');
    const overdueKYC = (farmers || []).filter(f => {
      if ((f.kycStatus === 'PENDING' || f.kycStatus === 'NOT_STARTED') && f.assignedEmployee && f.assignedEmployee !== 'Not Assigned') {
        // For now, consider all pending KYC as overdue if assigned
        return true;
      }
      return false;
    });
    const employeesWithLargeQueues = (employees || []).filter(emp => {
      const pendingCount = emp.pendingKyc || 0;
      return pendingCount > 5; // Large queue if more than 5 pending
    });

    console.log('Admin Todo list calculated from real data:');
    console.log('- Unassigned Farmers:', unassignedFarmers.length);
    console.log('- Overdue KYC:', overdueKYC.length);
    console.log('- Employees with Large Queues:', employeesWithLargeQueues.length);

    return {
      unassignedFarmers,
      overdueKYC,
      employeesWithLargeQueues
    };
  };

  const handleLogout = () => {
    logout();
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleChangePassword = () => {
    // Navigate to change password page
    window.location.href = '/change-password';
  };

  const handleViewFarmer = async (farmer) => {
    try {
      const full = await fetch(`/api/admin/farmers/${farmer.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json());
      setViewingEmployee(null); // ensure employee view not active
      setSelectedFarmerData({ ...farmer, ...full });
      setShowFarmerDetails(false);
      // Show inline component instead of modal
      setViewingFarmer({ ...farmer, ...full });
    } catch (e) {
      setViewingFarmer(farmer);
    }
  };

  const handleCloseFarmerDetails = () => {
    setShowFarmerDetails(false);
    setSelectedFarmerData(null);
  };

  const handleViewEmployee = async (employee) => {
    try {
      // Fetch complete employee details from backend
      const completeEmployeeData = await adminAPI.getEmployeeById(employee.id);
      setViewingEmployee(completeEmployeeData);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      // Fallback to basic employee data if API call fails
      setViewingEmployee(employee);
    }
  };

  const handleCloseEmployeeDetails = () => {
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleUpdateEmployee = (updatedData) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === updatedData.id ? updatedData : emp
    ));
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleSaveEmployee = async (updatedData) => {
    try {
      // Update employee data in backend
      const updatedEmployee = await adminAPI.updateEmployee(selectedEmployeeData.id, updatedData);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployeeData.id ? updatedEmployee : emp
      ));
      
      // Update selected employee data
      setSelectedEmployeeData(updatedEmployee);
      
      alert('Employee updated successfully!');
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  };

  const handleSaveFarmer = async (updatedData) => {
    try {
      // Update farmer data in backend
      const updatedFarmer = await farmersAPI.updateFarmer(selectedFarmerData.id, updatedData);
      
      // Update local state
      setFarmers(prev => prev.map(farmer => 
        farmer.id === selectedFarmerData.id ? updatedFarmer : farmer
      ));
      
      // Update selected farmer data
      setSelectedFarmerData(updatedFarmer);
      
      alert('Farmer updated successfully!');
    } catch (error) {
      console.error('Error updating farmer:', error);
      alert('Failed to update farmer. Please try again.');
    }
  };

  const handleKYCDocumentUpload = (farmer) => {
    setSelectedFarmerForKYC(farmer);
    setShowKYCDocumentUpload(true);
  };

  const handleCloseKYCDocumentUpload = () => {
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCApprove = (farmerId, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'APPROVED' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCReject = (farmerId, reason, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'REJECTED' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleKYCReferBack = (farmerId, reason, documents) => {
    setFarmers(prev => prev.map(farmer => 
      farmer.id === farmerId 
        ? { ...farmer, kycStatus: 'REFER_BACK' }
        : farmer
    ));
    setShowKYCDocumentUpload(false);
    setSelectedFarmerForKYC(null);
  };

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setShowFarmerForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleAssignFarmers = async (assignments) => {
    try {
      // Extract farmer IDs and employee ID from assignments
      const farmerIds = assignments.map(a => a.farmerId);
      const employeeId = assignments[0]?.employeeId;
      
      if (!employeeId || farmerIds.length === 0) {
        alert('Please select an employee and at least one farmer');
        return;
      }
      
      // Try bulk assign first, then fallback to individual assignments
      try {
        // Call admin API to bulk assign farmers
        await adminAPI.bulkAssignFarmers(farmerIds, employeeId);
      } catch (bulkError) {
        console.log('Bulk assign failed, trying individual assignments...');
        // Fallback to individual assignments
        for (const farmerId of farmerIds) {
          try {
            await adminAPI.assignFarmer(farmerId, employeeId);
          } catch (individualError) {
            console.error(`Failed to assign farmer ${farmerId}:`, individualError);
          }
        }
      }
      
      // Update local state for each assignment
      setFarmers(prev => prev.map(farmer => {
        const assignment = assignments.find(a => a.farmerId === farmer.id);
        if (assignment) {
          return {
            ...farmer,
            assignmentStatus: 'ASSIGNED',
            assignedEmployee: assignment.employeeName,
            assignedDate: new Date().toISOString().split('T')[0]
          };
        }
        return farmer;
      }));
      
      setShowAssignmentModal(false);
      alert('Farmers assigned successfully!');
    } catch (error) {
      console.error('Error assigning farmers:', error);
      alert('Failed to assign farmers');
    }
  };

    const renderOverview = () => {
    const stats = getStats();

    return (
      <div className="overview-section">
        <div className="overview-header">
          <div>
            <h2 className="overview-title">Admin Dashboard Overview</h2>
            <p className="overview-description">
              Manage farmers, employees, and assignments efficiently.
            </p>
          </div>
          <div className="overview-actions">
            <button 
              className={`action-btn refresh ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                console.log('🔄 Refresh clicked - showing all data');
                setTimeFilter('all');
              }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh
            </button>
            <button 
              className={`action-btn today ${timeFilter === 'today' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 Today filter clicked');
                setTimeFilter('today');
              }}
            >
              Today
            </button>
            <button 
              className={`action-btn month ${timeFilter === 'month' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 This Month filter clicked');
                setTimeFilter('month');
              }}
            >
              This Month
            </button>
            <button 
              className={`action-btn year ${timeFilter === 'year' ? 'active' : ''}`}
              onClick={() => {
                console.log('📅 This Year filter clicked');
                setTimeFilter('year');
              }}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon farmers">
              <i className="fas fa-users"></i>
            </div>
            <div className="stats-title">FARMERS</div>
            <div className="stats-value">{stats.totalFarmers}</div>
            <div className="stats-change positive">
              <i className="fas fa-arrow-up"></i>
              +12.4%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>

          <div className="stats-card">
            <div className="stats-icon employees">
              <i className="fas fa-user-tie"></i>
            </div>
            <div className="stats-title">EMPLOYEES</div>
            <div className="stats-value">{stats.totalEmployees}</div>
            <div className="stats-change negative">
              <i className="fas fa-arrow-down"></i>
              -3.0%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>

          <div className="stats-card">
            <div className="stats-icon fpo">
              <i className="fas fa-building"></i>
            </div>
            <div className="stats-title">FPO</div>
            <div className="stats-value">0</div>
            <div className="stats-change neutral">
              <i className="fas fa-minus"></i>
              +0.0%
            </div>
            {timeFilter !== 'all' && (
              <div className="stats-period-indicator">
                {timeFilter === 'today' && '📅 Today'}
                {timeFilter === 'month' && '📅 This Month'}
                {timeFilter === 'year' && '📅 This Year'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="bottom-sections">
          <div className="section-card">
            <div className="section-header">
              <h3>Recent Activities</h3>
              <button className="section-link" onClick={() => console.log('View All clicked')}>View All</button>
            </div>
            <div className="activities-list">
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-text">
                    <span className="activity-dot success"></span>
                    Farmer profile updated
                  </div>
                  <div className="activity-time">20m ago</div>
                  <button className="activity-badge success">SUCCESS</button>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-text">
                    <span className="activity-dot error"></span>
                    Employee profile updated
                  </div>
                  <div className="activity-time">10m ago</div>
                  <button className="activity-badge success">SUCCESS</button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="section-card">
            <div className="section-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn primary"
                onClick={() => {
                  setActiveTab('farmers');
                  setEditingFarmer(null); // Clear any existing farmer being edited
                  setShowFarmerForm(true); // Show the farmer registration form
                }}
              >
                <i className="fas fa-user-plus"></i>
                Add New Farmer
              </button>
              <button 
                className="quick-action-btn secondary"
                onClick={() => {
                  setActiveTab('employees');
                  setShowEmployeeRegistration(true); // Show the employee registration form
                }}
              >
                <i className="fas fa-user-tie"></i>
                Add Employee
              </button>
              <button 
                className="quick-action-btn info"
                onClick={() => alert('Generate Report functionality coming soon!')}
              >
                <i className="fas fa-chart-bar"></i>
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

    const renderFarmers = () => {
    const filteredFarmers = getFilteredFarmers();

    return (
      <div className="overview-section">
        {!showFarmerRegistration ? (
          <>
            <div className="overview-header">
              <h2 className="overview-title">Farmer Management</h2>
              <p className="overview-description">
                View and manage all farmer profiles with KYC status and assignments.
              </p>
              <div className="overview-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => setShowFarmerRegistration(true)}
                >
                    Add Farmer
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setShowAssignmentInline(true)}
                >
                    Assign Farmers
                </button>
            </div>
        </div>

            {/* Enhanced Filters */}
            <div className="filters-section">
              <div className="filter-group">
                <label className="filter-label">State</label>
                <select 
                  value={filters.state} 
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All States</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Andhrapradesh">Andhrapradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">District</label>
                <select 
                  value={filters.district} 
                  onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Districts</option>
                  <option value="Karimnagar">Karimnagar</option>
                  <option value="rangareddy">Rangareddy</option>
                  <option value="kadapa">Kadapa</option>
                  <option value="Kadapa">Kadapa</option>
                  <option value="kadpaa">Kadpaa</option>
                  <option value="Kuppam">Kuppam</option>
                  <option value="Pune">Pune</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Amritsar">Amritsar</option>
                  <option value="Lucknow">Lucknow</option>
                  <option value="Chennai">Chennai</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">KYC Status</label>
                <select 
                  value={filters.kycStatus} 
                  onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All KYC Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="REFER_BACK">Refer Back</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Assignment Status</label>
                <select 
                  value={filters.assignmentStatus} 
                  onChange={(e) => setFilters(prev => ({ ...prev, assignmentStatus: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Assignment Status</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="UNASSIGNED">Unassigned</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Assigned Employee</label>
                <select 
                  value={filters.employeeFilter} 
                  onChange={(e) => setFilters(prev => ({ ...prev, employeeFilter: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-actions">
                <button 
                  className="filter-btn-clear"
                  onClick={() => setFilters({
                    state: '',
                    district: '',
                    region: '',
                    kycStatus: '',
                    assignmentStatus: '',
                    employeeFilter: ''
                  })}
                >
                  <i className="fas fa-times"></i>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Farmers Table or Inline Assign/View */}
      {!showAssignmentInline && !viewingFarmer ? (
      <DataTable
              data={filteredFarmers}
        columns={[
          { key: 'name', label: 'Name' },
                { key: 'contactNumber', label: 'Phone' },
          { key: 'state', label: 'State' },
          { key: 'district', label: 'District' },
          { 
            key: 'kycStatus', 
            label: 'KYC Status',
            render: (value) => {
              if (!value) return 'NOT_STARTED';
              if (value === 'PENDING' || value === 'pending') return 'PENDING';
              if (value === 'APPROVED' || value === 'approved') return 'APPROVED';
              if (value === 'REFER_BACK' || value === 'refer_back') return 'REFER_BACK';
              if (value === 'REJECTED' || value === 'rejected') return 'REJECTED';
              if (value === 'NOT_STARTED' || value === 'not_started') return 'NOT_STARTED';
              return value.toUpperCase();
            }
          },
          { key: 'assignedEmployee', label: 'Assigned Employee' }
        ]}
        customActions={[
          {
                  label: 'View',
                  className: 'action-btn-small info',
                  onClick: handleViewFarmer
                },
                {
                  label: 'Edit',
                  className: 'action-btn-small primary',
                  onClick: handleEditFarmer
                },
                {
                  label: 'KYC',
                  className: 'action-btn-small warning',
            onClick: handleKYCDocumentUpload
          }
        ]}
      />
      ) : showAssignmentInline ? (
        <AssignmentInline 
          farmers={farmers.filter(f => !f.assignedEmployee || f.assignedEmployee === 'Not Assigned' || f.assignedEmployee === null || f.assignedEmployee === undefined || f.assignedEmployee === '')}
          employees={employees}
          onBack={() => setShowAssignmentInline(false)}
          onAssign={handleAssignFarmers}
        />
      ) : (
        <ViewFarmer 
          farmerData={viewingFarmer}
          onBack={() => setViewingFarmer(null)}
          onSave={async (updatedData) => {
            try {
              const updated = await farmersAPI.updateFarmer(viewingFarmer.id, updatedData);
              setFarmers(prev => prev.map(f => f.id === viewingFarmer.id ? updated : f));
              setViewingFarmer(updated);
              alert('Farmer updated successfully!');
            } catch (e) {
              console.error('Error updating farmer:', e);
              alert('Failed to update farmer');
            }
          }}
        />
      )}
          </>
        ) : (
          <div className="farmer-registration-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Add New Farmer</h2>
                <p className="section-description">
                  Fill in the farmer details to create a new farmer account.
                </p>
              </div>
              <div className="section-actions">
                <button 
                  className="action-btn-small secondary"
                  onClick={() => setShowFarmerRegistration(false)}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Farmers
                </button>
              </div>
            </div>

            <FarmerRegistrationForm 
              isInDashboard={true}
              onClose={() => setShowFarmerRegistration(false)}
              onSubmit={async (farmerData) => {
                try {
                  const newFarmer = await farmersAPI.createFarmer(farmerData);
                  setFarmers(prev => [...prev, newFarmer]);
                  alert('Farmer created successfully!');
                  setShowFarmerRegistration(false);
                } catch (error) {
                  console.error('Error creating farmer:', error);
                  alert('Failed to create farmer. Please try again.');
                }
              }}
            />
          </div>
        )}
    </div>
  );
  };

  const renderRegistration = () => {
    const filteredRegistrations = getFilteredRegistrations();

    return (
      <div className="registration-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Registration Management</h2>
            <p className="section-description">
              Review and manage user registration requests.
            </p>
          </div>
          <div className="section-actions">
            <button 
              className="action-btn-small primary"
              onClick={() => {
                console.log('🔄 Manually refreshing data...');
                fetchData();
              }}
            >
              <i className="fas fa-sync-alt"></i>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Filters */}
      <div className="filters-section">
          <div className="filter-group">
          <select 
              className="filter-select"
              value={registrationFilters.role}
              onChange={(e) => setRegistrationFilters(prev => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All Roles</option>
              <option value="FARMER">Farmer</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="filter-group">
            <select 
              className="filter-select"
              value={registrationFilters.status}
              onChange={(e) => setRegistrationFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

        {/* Registration Table or Inline View */}
      {!viewingRegistration ? (
      <DataTable
          data={filteredRegistrations}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
            { key: 'phoneNumber', label: 'Phone' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' }
          ]}
          customActions={[
            {
              label: 'View',
              className: 'action-btn-small info',
              onClick: handleViewRegistration
            },
            {
              label: 'Approve',
              className: 'action-btn-small success',
              onClick: (registration) => handleApproveRegistration(registration.id),
              show: (registration) => registration.status === 'PENDING'
            },
            {
              label: 'Reject',
              className: 'action-btn-small danger',
              onClick: (registration) => handleRejectRegistration(registration.id),
              show: (registration) => registration.status === 'PENDING'
            }
          ]}
      />
      ) : (
        <RegistrationDetailsInline 
          registration={viewingRegistration}
          onBack={() => setViewingRegistration(null)}
          onUpdate={handleRegistrationUpdate}
        />
      )}
    </div>
  );
  };

  const renderEmployees = () => {
    const filteredEmployees = getFilteredEmployees();

  return (
      <div className="overview-section">
        {!showEmployeeRegistration ? (
          <>
            <div className="overview-header">
              <h2 className="overview-title">Employee Management</h2>
              <p className="overview-description">
                View and manage employee profiles with KYC assignment statistics.
              </p>
              <div className="overview-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => setShowEmployeeRegistration(true)}
                >
                  Add Employee
          </button>
        </div>
      </div>

            {/* Employee Stats */}
            <div className="employee-stats">
              <h3>Employee KYC Progress</h3>
              <div className="employee-stats-grid">
                {employees.map(employee => {
                  // Calculate real stats from farmers data
                  const assignedFarmers = (farmers || []).filter(f => 
                    f.assignedEmployee === employee.name || 
                    f.assignedEmployee === employee.contactNumber ||
                    f.assignedEmployeeId === employee.id
                  );
                  
                  const approvedCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
                  ).length;
                  
                  const pendingCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                    f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
                  ).length;
                  
                  const referBackCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
                  ).length;
                  
                  const rejectedCount = assignedFarmers.filter(f => 
                    f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
                  ).length;
                  
                  return (
                    <div key={employee.id} className="employee-stat-card">
                      <div className="employee-info">
                        <h4>{employee.name}</h4>
                        <p>{employee.designation} - {employee.district}</p>
                      </div>
                      <div className="employee-kyc-stats">
                        <div className="kyc-stat">
                          <span className="stat-number">{assignedFarmers.length}</span>
                          <span className="stat-label">Total Assigned</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number approved">{approvedCount}</span>
                          <span className="stat-label">Approved</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number pending">{pendingCount}</span>
                          <span className="stat-label">Pending</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number refer-back">{referBackCount}</span>
                          <span className="stat-label">Refer Back</span>
                        </div>
                        <div className="kyc-stat">
                          <span className="stat-number rejected">{rejectedCount}</span>
                          <span className="stat-label">Rejected</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

            {/* Employees Table */}
          {!viewingEmployee ? (
          <DataTable
            data={filteredEmployees.map(employee => {
              // Calculate real stats from farmers data
              const assignedFarmers = (farmers || []).filter(f => 
                f.assignedEmployee === employee.name || 
                f.assignedEmployee === employee.contactNumber ||
                f.assignedEmployeeId === employee.id
              );
              
              const approvedCount = assignedFarmers.filter(f => 
                f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
              ).length;
              
              const pendingCount = assignedFarmers.filter(f => 
                f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
              ).length;
              
              return {
                ...employee,
                totalAssigned: assignedFarmers.length,
                approvedKyc: approvedCount,
                pendingKyc: pendingCount
              };
            })}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'contactNumber', label: 'Contact' },
              { key: 'email', label: 'Email' },
              { key: 'state', label: 'State' },
              { key: 'district', label: 'District' },
              { key: 'totalAssigned', label: 'Assigned Farmers' },
              { key: 'approvedKyc', label: 'Approved KYC' },
              { key: 'pendingKyc', label: 'Pending KYC' }
            ]}
            customActions={[
              {
                label: 'View',
                className: 'action-btn-small info',
                onClick: handleViewEmployee
              },
              {
                label: 'Edit',
                className: 'action-btn-small primary',
                onClick: handleEditEmployee
              }
            ]}
          />
          ) : (
            <ViewEmployee 
              employeeData={viewingEmployee}
              onBack={() => setViewingEmployee(null)}
              onSave={handleSaveEmployee}
            />
          )}
          </>
        ) : (
          <div className="employee-registration-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Add New Employee</h2>
                <p className="section-description">
                  Fill in the employee details to create a new employee account.
                </p>
              </div>
              <div className="section-actions">
        <button 
                  className="action-btn-small secondary"
                  onClick={() => setShowEmployeeRegistration(false)}
        >
                  <i className="fas fa-arrow-left"></i>
                  Back to Employees
        </button>
              </div>
            </div>

            <EmployeeRegistrationForm 
              isInDashboard={true}
              onClose={() => setShowEmployeeRegistration(false)}
              onSubmit={async (employeeData) => {
                try {
                  const newEmployee = await employeesAPI.createEmployee(employeeData);
                  setEmployees(prev => [...prev, newEmployee]);
                  alert('Employee created successfully!');
                  setShowEmployeeRegistration(false);
                } catch (error) {
                  console.error('Error creating employee:', error);
                  alert('Failed to create employee. Please try again.');
                }
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderKYCOverview = () => {
    const stats = getStats();
    
    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">KYC Overview</h2>
          <p className="overview-description">
            Comprehensive view of KYC status across all farmers and employees.
          </p>
        </div>

        {/* KYC Status Breakdown */}
        <div className="kyc-breakdown">
          <h3>KYC Status Breakdown</h3>
          <div className="kyc-stats-grid">
            <div className="kyc-stat-card approved">
              <span className="kyc-stat-number">{stats.approvedKYC}</span>
              <span className="kyc-stat-label">Approved</span>
            </div>
            <div className="kyc-stat-card pending">
              <span className="kyc-stat-number">{stats.pendingKYC}</span>
              <span className="kyc-stat-label">Pending</span>
            </div>
            <div className="kyc-stat-card refer-back">
              <span className="kyc-stat-number">{stats.referBackKYC}</span>
              <span className="kyc-stat-label">Refer Back</span>
            </div>
            <div className="kyc-stat-card rejected">
              <span className="kyc-stat-number">{stats.rejectedKYC}</span>
              <span className="kyc-stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* Employee KYC Progress */}
        <div className="employee-stats">
          <h3>Employee KYC Progress</h3>
          <div className="employee-stats-grid">
            {employees.length > 0 ? (
              employees.map(employee => {
                // Calculate real stats from farmers data
                const assignedFarmers = (farmers || []).filter(f => 
                  f.assignedEmployee === employee.name || 
                  f.assignedEmployee === employee.contactNumber ||
                  f.assignedEmployeeId === employee.id
                );
                
                const approvedCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'APPROVED' || f.kycStatus === 'approved'
                ).length;
                
                const pendingCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'PENDING' || f.kycStatus === 'pending' || 
                  f.kycStatus === 'NOT_STARTED' || f.kycStatus === 'not_started'
                ).length;
                
                const referBackCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'REFER_BACK' || f.kycStatus === 'refer_back'
                ).length;
                
                const rejectedCount = assignedFarmers.filter(f => 
                  f.kycStatus === 'REJECTED' || f.kycStatus === 'rejected'
                ).length;
                
                return (
                  <div key={employee.id} className="employee-stat-card">
                    <div className="employee-info">
                      <h4>{employee.name}</h4>
                      <p>{employee.designation} - {employee.district}</p>
                    </div>
                    <div className="employee-kyc-stats">
                      <div className="kyc-stat">
                        <span className="stat-number">{assignedFarmers.length}</span>
                        <span className="stat-label">Total Assigned</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number approved">{approvedCount}</span>
                        <span className="stat-label">Approved</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number pending">{pendingCount}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number refer-back">{referBackCount}</span>
                        <span className="stat-label">Refer Back</span>
                      </div>
                      <div className="kyc-stat">
                        <span className="stat-number rejected">{rejectedCount}</span>
                        <span className="stat-label">Rejected</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback cards when no employees data
              <>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer</h4>
                    <p>KYC Officer - Hyderabad</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer 2</h4>
                    <p>KYC Officer - Bangalore</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
                <div className="employee-stat-card">
                  <div className="employee-info">
                    <h4>Sample KYC Officer 3</h4>
                    <p>KYC Officer - Mumbai</p>
                  </div>
                  <div className="employee-kyc-stats">
                    <div className="kyc-stat">
                      <span className="stat-number">0</span>
                      <span className="stat-label">Total Assigned</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number approved">0</span>
                      <span className="stat-label">Approved</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number pending">0</span>
                      <span className="stat-label">Pending</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number refer-back">0</span>
                      <span className="stat-label">Refer Back</span>
                    </div>
                    <div className="kyc-stat">
                      <span className="stat-number rejected">0</span>
                      <span className="stat-label">Rejected</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* KYC Progress Overview */}
        <div className="kyc-progress-section">
          <h3>KYC Progress Overview</h3>
          <div className="kyc-progress-grid">
            <div className="progress-card approved">
              <div className="progress-circle">
                <div className="progress-number">{stats.approvedKYC}</div>
              </div>
              <div className="progress-label">Approved KYC</div>
            </div>
            <div className="progress-card pending">
              <div className="progress-circle">
                <div className="progress-number">{stats.pendingKYC}</div>
              </div>
              <div className="progress-label">Pending KYC</div>
            </div>
            <div className="progress-card refer-back">
              <div className="progress-circle">
                <div className="progress-number">{stats.referBackKYC}</div>
              </div>
              <div className="progress-label">Refer Back</div>
            </div>
            <div className="progress-card rejected">
              <div className="progress-circle">
                <div className="progress-number">{stats.rejectedKYC}</div>
              </div>
              <div className="progress-label">Rejected KYC</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo-title">DATE</h1>
            <p className="logo-subtitle">Digital Agristack</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-profile-dropdown">
            <div className="user-profile-trigger" onClick={toggleUserDropdown}>
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="user-email">{user?.email || 'admin@example.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className={`user-dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <div className="user-avatar-large">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'Admin'}</div>
                  <div className="user-email">{user?.email || 'admin@example.com'}</div>
                </div>
              </div>
              <div className="dropdown-actions">
                <button className="dropdown-action-btn" onClick={handleChangePassword}>
                  <i className="fas fa-key"></i>
                  Change Password
                </button>
                <button className="dropdown-action-btn logout" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <div className="sidebar-role">Admin</div>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard Overview</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            <i className="fas fa-user-plus"></i>
            <span>Registration</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => setActiveTab('farmers')}
          >
            <i className="fas fa-users"></i>
            <span>Farmers</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <i className="fas fa-user-tie"></i>
            <span>Employees</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'kyc-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc-overview')}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>KYC Overview</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'bulk-operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk-operations')}
          >
            <i className="fas fa-upload"></i>
            <span>Bulk Operations</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              {/* Greeting Banner - Only for Dashboard Overview */}
              <div className="greeting-banner">
                <div className="greeting-left">
                  <div className="greeting-title">{randomGreeting.title}</div>
                  <div className="greeting-subtitle">{randomGreeting.subtitle}</div>
                </div>
                <div className="greeting-right">
                  <span className="greeting-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              
              {/* Welcome Section - Only for Dashboard Overview */}
              <div className="welcome-section">
                <h1 className="welcome-title">Welcome to DATE Digital Agristack!</h1>
                <p className="welcome-subtitle">
                  Empowering your agricultural journey with data-driven insights and seamless management. 
                  Explore your dashboard below.
                </p>
              </div>
              
              {renderOverview()}
            </>
          )}
          {activeTab === 'kyc-overview' && renderKYCOverview()}
          {activeTab === 'farmers' && renderFarmers()}
          {activeTab === 'employees' && renderEmployees()}
          {activeTab === 'registration' && renderRegistration()}
          {activeTab === 'bulk-operations' && <BulkOperations userRole="ADMIN" />}
        </div>
      </div>

      {/* Modals */}
      {showFarmerForm && (
        <FarmerForm 
          editData={editingFarmer}
          onClose={() => {
            setShowFarmerForm(false);
            setEditingFarmer(null);
          }}
          onSubmit={async (farmerData) => {
            try {
              if (editingFarmer) {
                const updatedFarmer = await farmersAPI.updateFarmer(editingFarmer.id, farmerData);
                setFarmers(prev => prev.map(farmer => 
                  farmer.id === editingFarmer.id ? updatedFarmer : farmer
                ));
                alert('Farmer updated successfully!');
              } else {
                const newFarmer = await farmersAPI.createFarmer(farmerData);
                setFarmers(prev => [...prev, newFarmer]);
                alert('Farmer created successfully!');
              }
              setShowFarmerForm(false);
              setEditingFarmer(null);
            } catch (error) {
              console.error('Error saving farmer:', error);
              alert('Failed to save farmer. Please try again.');
            }
          }}
        />
      )}

      {showEmployeeForm && (
        <EmployeeRegistrationForm 
          isInDashboard={true}
          editData={editingEmployee}
          onClose={() => {
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
          onSubmit={async (employeeData) => {
            try {
              if (editingEmployee) {
                const updatedEmployee = await employeesAPI.updateEmployee(editingEmployee.id, employeeData);
                setEmployees(prev => prev.map(employee => 
                  employee.id === editingEmployee.id ? updatedEmployee : employee
                ));
                alert('Employee updated successfully!');
              } else {
                const newEmployee = await employeesAPI.createEmployee(employeeData);
                setEmployees(prev => [...prev, newEmployee]);
                alert('Employee created successfully!');
              }
              setShowEmployeeForm(false);
              setEditingEmployee(null);
            } catch (error) {
              console.error('Error saving employee:', error);
              alert('Failed to save employee. Please try again.');
            }
          }}
        />
      )}

      {/* Keep modal fallback if needed elsewhere, but use inline by default */}

      {/* Removed Farmer modal view; inline ViewFarmer is used in content */}

      {/* Removed modal ViewEmployeeDetails in favor of inline ViewEmployee */}

      {showEmployeeDetails && selectedEmployeeData && (
        <ViewEditEmployeeDetails
          employee={selectedEmployeeData}
          onClose={handleCloseEmployeeDetails}
          onUpdate={handleUpdateEmployee}
        />
      )}

      {showKYCDocumentUpload && selectedFarmerForKYC && (
                   <KYCDocumentUpload
                     farmer={selectedFarmerForKYC}
                     onClose={handleCloseKYCDocumentUpload}
                     onApprove={handleKYCApprove}
                     onReject={handleKYCReject}
                     onReferBack={handleKYCReferBack}
                   />
                 )}

      {showRegistrationDetailModal && selectedRegistrationForDetail && (
        <RegistrationDetailModal
          registration={selectedRegistrationForDetail}
          onClose={handleCloseRegistrationDetailModal}
          onUpdate={handleRegistrationUpdate}
          onApprove={handleApproveRegistration}
          onReject={handleRejectRegistration}
                   />
                 )}
               </div>
             );
};

export default AdminDashboard; 