import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';
import FarmerRegistrationForm from '../components/FarmerRegistrationForm';
import KYCModal from '../components/KYCModal';
import ViewFarmerRegistrationDetails from '../components/ViewFarmerRegistrationDetails';
import ViewEditEmployeeDetails from '../components/ViewEditEmployeeDetails';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';
import UserProfileDropdown from '../components/UserProfileDropdown';
import { kycAPI, employeeAPI, farmersAPI } from '../api/apiService';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignedFarmers, setAssignedFarmers] = useState([]);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showFarmerDetails, setShowFarmerDetails] = useState(false);
  const [selectedFarmerData, setSelectedFarmerData] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [editingFarmer, setEditingFarmer] = useState(null);

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

  const [filters, setFilters] = useState({
    kycStatus: '',
    assignedDate: ''
  });

  
  // Add time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'month', 'year'

  // Load data from API
  useEffect(() => {
    fetchAssignedFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    const fetchAssignedFarmers = async () => {
    try {
      console.log('🔄 Fetching assigned farmers for employee...');
      console.log('👤 Current user:', user);
      
      if (!user) {
        console.error('❌ No user available');
        setAssignedFarmers([]);
        return;
      }
      
      // Fetch from API using the correct endpoint
      const response = await employeeAPI.getAssignedFarmers();
      console.log('✅ API Response:', response);
      
      if (response && Array.isArray(response)) {
        // Transform the API response to match our frontend format
        const transformedData = response.map(farmer => ({
          id: farmer.id,
          name: farmer.name,
          phone: farmer.contactNumber,
          state: farmer.state,
          district: farmer.district,
          location: `${farmer.district}, ${farmer.state}`,
          kycStatus: farmer.kycStatus || 'PENDING',
          assignedDate: farmer.assignedDate || farmer.kycSubmittedDate || new Date().toISOString().split('T')[0],
          lastAction: farmer.kycReviewedDate || farmer.kycSubmittedDate || new Date().toISOString().split('T')[0],
          notes: `KYC Status: ${farmer.kycStatus || 'PENDING'}`,
          assignedEmployee: user.name || 'Employee'
        }));
        
        setAssignedFarmers(transformedData);
        console.log('✅ Assigned farmers loaded from API:', transformedData.length);
      } else {
        console.log('⚠️ No API data available');
        setAssignedFarmers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching assigned farmers:', error);
      setAssignedFarmers([]);
    }
  };



  const getFilteredFarmers = () => {
    return assignedFarmers.filter(farmer => {
      const matchesKycStatus = !filters.kycStatus || farmer.kycStatus === filters.kycStatus;
      const matchesAssignedDate = !filters.assignedDate || (farmer.assignedDate && farmer.assignedDate === filters.assignedDate);
      
      return matchesKycStatus && matchesAssignedDate;
    });
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
    const filteredFarmers = assignedFarmers.filter(farmer => {
      const createdDate = farmer.assignedDate || farmer.createdAt || farmer.created_at || farmer.registrationDate;
      return isWithinPeriod(createdDate, timeFilter);
    });

    const totalAssigned = timeFilter === 'all' ? assignedFarmers.length : filteredFarmers.length;
    const approved = filteredFarmers.filter(f => f.kycStatus === 'APPROVED').length;
    const pending = filteredFarmers.filter(f => f.kycStatus === 'PENDING').length;
    const referBack = filteredFarmers.filter(f => f.kycStatus === 'REFER_BACK').length;
    const rejected = filteredFarmers.filter(f => f.kycStatus === 'REJECTED').length;

    return {
      totalAssigned,
      approved,
      pending,
      referBack,
      rejected,
      timeFilter
    };
  };

  const getTodoList = () => {
    const newAssignments = assignedFarmers.filter(f => {
      // New assignments not yet viewed (assigned within last 3 days)
      if (!f.assignedDate) return false;
      const assignedDate = new Date(f.assignedDate);
      const today = new Date();
      const daysDiff = (today - assignedDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 3 && f.kycStatus === 'PENDING';
    });

    const pendingReviews = assignedFarmers.filter(f => f.kycStatus === 'PENDING');
    const referBackCases = assignedFarmers.filter(f => f.kycStatus === 'REFER_BACK');

        return {
      newAssignments,
      pendingReviews,
      referBackCases
    };
  };

  const handleKYCUpdate = async (farmerId, newStatus, reason = '', documents = null) => {
    try {
      console.log(`🔄 Updating KYC status for farmer ${farmerId} to ${newStatus}`);
      
      // Prepare approval data
      const approvalData = {
        reason: reason,
        updatedBy: user?.name || 'Employee',
        updatedAt: new Date().toISOString(),
        ...(documents && { aadharNumber: documents.aadharNumber, panNumber: documents.panNumber })
      };

      console.log('📋 Approval data:', approvalData);

      // Make API call
      let response;
      switch (newStatus) {
        case 'APPROVED':
          response = await kycAPI.approveKYC(farmerId, approvalData);
          break;
        case 'REJECTED':
          response = await kycAPI.rejectKYC(farmerId, approvalData);
          break;
        case 'REFER_BACK':
          response = await kycAPI.referBackKYC(farmerId, approvalData);
          break;
        default:
          response = await kycAPI.approveKYC(farmerId, approvalData);
      }
      
      console.log('✅ KYC API response:', response);
      
      // Update local state after successful API call
      setAssignedFarmers(prev => prev.map(farmer => 
        farmer.id === farmerId 
          ? { 
          ...farmer,
          kycStatus: newStatus,
          lastAction: new Date().toISOString().split('T')[0],
              notes: reason || `Status updated to ${newStatus} by ${user?.name || 'Employee'}`,
              ...(documents && { aadharNumber: documents.aadharNumber, panNumber: documents.panNumber })
            }
          : farmer
      ));
      
      // Show success message
      alert(`KYC status updated to ${newStatus} successfully!`);
      
      // Trigger a global event to notify other dashboards
      window.dispatchEvent(new CustomEvent('kycStatusUpdated', {
        detail: { farmerId, newStatus, reason, documents }
      }));
      
    } catch (error) {
      console.error('❌ Error updating KYC status:', error);
      alert(`Failed to update KYC status: ${error.response?.data || error.message}`);
    }
  };

  const handleLogout = () => {
    logout();
  };



  const handleViewFarmer = (farmer) => {
    console.log('🔍 EmployeeDashboard - Original farmer data (list item):', farmer);
    // Fetch full details from admin endpoint (same data model)
    fetch(`/api/admin/farmers/${farmer.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }})
      .then(r => r.json())
      .then(full => {
        const merged = { ...full, ...farmer };
        const farmerData = {
          id: merged.id,
          firstName: merged.firstName || '',
          lastName: merged.lastName || '',
          middleName: merged.middleName || '',
          dateOfBirth: merged.dateOfBirth || merged.dob || '',
          gender: merged.gender || '',
          contactNumber: merged.contactNumber || merged.phoneNumber || merged.phone || '',
          email: merged.email || '',
          fatherName: merged.fatherName || merged.relationName || '',
          nationality: merged.nationality || '',
          alternativeContactNumber: merged.alternativeContactNumber || merged.altNumber || '',
          alternativeRelationType: merged.alternativeRelationType || merged.altRelationType || '',
          state: merged.state || '',
          district: merged.district || '',
          block: merged.block || '',
          village: merged.village || '',
          pincode: merged.pincode || '',
          kycStatus: merged.kycStatus || 'PENDING',
          assignedEmployee: merged.assignedEmployee || 'Not Assigned',
          assignedEmployeeId: merged.assignedEmployeeId || null
        };
        console.log('🔍 EmployeeDashboard - Full farmer details fetched:', full);
        console.log('🔍 EmployeeDashboard - Transformed farmer data:', farmerData);
        setSelectedFarmerData(farmerData);
        setShowFarmerDetails(true);
      })
      .catch(err => {
        console.warn('⚠️ Failed to fetch full farmer details, using list item only:', err);
        const farmerData = {
          id: farmer.id,
          firstName: farmer.firstName || '',
          lastName: farmer.lastName || '',
          middleName: farmer.middleName || '',
          dateOfBirth: farmer.dateOfBirth || farmer.dob || '',
          gender: farmer.gender || '',
          contactNumber: farmer.contactNumber || farmer.phoneNumber || farmer.phone || '',
          email: farmer.email || '',
          fatherName: farmer.fatherName || farmer.relationName || '',
          nationality: farmer.nationality || '',
          alternativeContactNumber: farmer.alternativeContactNumber || farmer.altNumber || '',
          alternativeRelationType: farmer.alternativeRelationType || farmer.altRelationType || '',
          state: farmer.state || '',
          district: farmer.district || '',
          block: farmer.block || '',
          village: farmer.village || '',
          pincode: farmer.pincode || '',
          kycStatus: farmer.kycStatus || 'PENDING',
          assignedEmployee: farmer.assignedEmployee || 'Not Assigned',
          assignedEmployeeId: farmer.assignedEmployeeId || null
        };
        setSelectedFarmerData(farmerData);
        setShowFarmerDetails(true);
      });
  };

  const handleCloseFarmerDetails = () => {
    setShowFarmerDetails(false);
    setSelectedFarmerData(null);
  };

  const handleCloseEmployeeDetails = () => {
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleUpdateEmployee = (updatedData) => {
    // Update employee profile
    setShowEmployeeDetails(false);
    setSelectedEmployeeData(null);
  };

  const handleSaveFarmer = async (updatedData) => {
    try {
      // Update farmer data in backend
      const updatedFarmer = await farmersAPI.updateFarmer(selectedFarmerData.id, updatedData);
      
      // Update local state
      setAssignedFarmers(prev => prev.map(farmer => 
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

  const handleEditFarmer = (farmer) => {
    setEditingFarmer(farmer);
    setShowFarmerForm(true);
  };

  const renderOverview = () => {
    const stats = getStats();
    const todoList = getTodoList();

    return (
      <div className="overview-section">
        <div className="overview-header">
          <div>
            <h2 className="overview-title">Employee Dashboard Overview</h2>
            <p className="overview-description">
              Manage your assigned farmers and KYC verification tasks efficiently.
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
            <div className="stats-title">TOTAL ASSIGNED</div>
            <div className="stats-value">{stats.totalAssigned}</div>
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

          <div className="stats-card">
            <div className="stats-icon employees">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stats-title">APPROVED</div>
            <div className="stats-value">{stats.approved}</div>
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
            <div className="stats-icon fpo">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stats-title">PENDING</div>
            <div className="stats-value">{stats.pending}</div>
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
        </div>

        {/* KYC Progress Chart */}
        <div className="kyc-progress-section">
          <h3>KYC Progress Summary</h3>
          <div className="kyc-progress-grid">
            <div className="progress-card approved">
              <div className="progress-circle">
                <span className="progress-number">{stats.approved}</span>
                <span className="progress-label">Approved</span>
              </div>
            </div>
            <div className="progress-card pending">
              <div className="progress-circle">
                <span className="progress-number">{stats.pending}</span>
                <span className="progress-label">Pending</span>
              </div>
            </div>
            <div className="progress-card refer-back">
              <div className="progress-circle">
                <span className="progress-number">{stats.referBack}</span>
                <span className="progress-label">Refer Back</span>
              </div>
            </div>
            <div className="progress-card rejected">
              <div className="progress-circle">
                <span className="progress-number">{stats.rejected}</span>
                <span className="progress-label">Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sections - Recent Activities and Quick Actions */}
        <div className="bottom-sections">
          {/* Recent Activities */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Recent Activities</h3>
              <a href="#" className="section-link">View All</a>
            </div>
            <div className="activities-list">
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-dot success"></div>
                  <div>
                    <div className="activity-text">Farmer profile updated</div>
                    <div className="activity-time">20m ago</div>
                  </div>
                </div>
                <div className="activity-badge success">SUCCESS</div>
              </div>
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-dot success"></div>
                  <div>
                    <div className="activity-text">KYC verification completed</div>
                    <div className="activity-time">1h ago</div>
                  </div>
                </div>
                <div className="activity-badge success">SUCCESS</div>
              </div>
              <div className="activity-item">
                <div className="activity-content">
                  <div className="activity-dot error"></div>
                  <div>
                    <div className="activity-text">New farmer assigned</div>
                    <div className="activity-time">2h ago</div>
                  </div>
                </div>
                <div className="activity-badge pending">PENDING</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">Quick Actions</h3>
            </div>
            <div className="quick-actions-grid">
              <button 
                className="quick-action-btn primary"
                onClick={() => setShowFarmerForm(true)}
              >
                <i className="fas fa-user-plus"></i>
                <span>Add New Farmer</span>
              </button>
              <button 
                className="quick-action-btn secondary"
                onClick={() => setActiveTab('farmers')}
              >
                <i className="fas fa-users"></i>
                <span>View Assigned Farmers</span>
              </button>
              <button 
                className="quick-action-btn info"
                onClick={() => setActiveTab('progress')}
              >
                <i className="fas fa-chart-line"></i>
                <span>KYC Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="todo-section">
        <h3>To-Do List</h3>
          <div className="todo-grid">
            <div className="todo-card">
              <h4>New Assignments</h4>
              <p>{todoList.newAssignments.length} new farmers assigned</p>
              <button 
                className="action-btn-small primary"
                onClick={() => setActiveTab('farmers')}
              >
                Review New
              </button>
            </div>
            <div className="todo-card">
              <h4>Pending Reviews</h4>
              <p>{todoList.pendingReviews.length} cases pending</p>
              <button 
                className="action-btn-small warning"
                onClick={() => setActiveTab('farmers')}
              >
                Process Pending
              </button>
            </div>
            <div className="todo-card">
              <h4>Refer Back Cases</h4>
              <p>{todoList.referBackCases.length} need attention</p>
              <button 
                className="action-btn-small info"
                onClick={() => setActiveTab('farmers')}
              >
                Review Refer Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignedFarmers = () => {
    const filteredFarmers = getFilteredFarmers();

    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">Assigned Farmers</h2>
          <p className="overview-description">
            View and manage your assigned farmers with KYC verification tasks.
          </p>
          <div className="overview-actions">
            <button 
              className="action-btn-modern primary"
              onClick={() => setShowFarmerForm(true)}
            >
              <i className="fas fa-plus"></i>
              Add Farmer
            </button>
          </div>
        </div>

        {/* Modern Filters Section */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#475569' }}>Filters & Search</h3>
            <div className="section-accent" style={{ background: '#64748b' }}></div>
          </div>
          
          <div className="filters-modern">
            <div className="filter-group">
              <label className="filter-label">KYC Status</label>
              <select 
                value={filters.kycStatus} 
                onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
                className="filter-select-modern"
              >
                <option value="">All KYC Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REFER_BACK">Refer Back</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Assignment Date</label>
              <select 
                value={filters.assignedDate} 
                onChange={(e) => setFilters(prev => ({ ...prev, assignedDate: e.target.value }))}
                className="filter-select-modern"
              >
                <option value="">All Assignment Dates</option>
                <option value="2024-01-15">Jan 15, 2024</option>
                <option value="2024-01-18">Jan 18, 2024</option>
                <option value="2024-01-20">Jan 20, 2024</option>
                <option value="2024-01-25">Jan 25, 2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern KYC Status Tabs */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#0369a1' }}>KYC Status Overview</h3>
            <div className="section-accent" style={{ background: '#0ea5e9' }}></div>
          </div>
          
          <div className="kyc-tabs-modern">
            <button 
              className={`kyc-tab-modern ${filters.kycStatus === '' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: '' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-chart-pie" style={{ color: '#64748b' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">All</span>
                <span className="tab-count-modern">{filteredFarmers.length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern approved ${filters.kycStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'APPROVED' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Approved</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'APPROVED').length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern pending ${filters.kycStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'PENDING' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Pending</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'PENDING').length}</span>
              </div>
            </button>
            
            <button 
              className={`kyc-tab-modern rejected ${filters.kycStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'REJECTED' }))}
            >
              <div className="tab-icon-modern">
                <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
              </div>
              <div className="tab-content-modern">
                <span className="tab-label-modern">Rejected</span>
                <span className="tab-count-modern">{filteredFarmers.filter(f => f.kycStatus === 'REJECTED').length}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Farmers Table or Inline Add Farmer */}
        {!showFarmerForm ? (
          <div className="section-card" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '2px solid #22c55e',
            boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
          }}>
            <div className="section-header">
              <h3 className="section-title" style={{ color: '#15803d' }}>Farmer List</h3>
              <div className="section-accent" style={{ background: '#22c55e' }}></div>
            </div>
            
            <div className="table-container-modern">
              <DataTable
                data={filteredFarmers}
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'location', label: 'Location' },
                  { key: 'assignedDate', label: 'Assigned Date' },
                  { key: 'kycStatus', label: 'KYC Status' },
                  { key: 'lastAction', label: 'Last Action' }
                ]}
                customActions={[
                  {
                    label: 'View',
                    icon: '👁️',
                    className: 'info',
                    onClick: (farmer) => farmer && handleViewFarmer(farmer)
                  },
                  {
                    label: 'Edit',
                    icon: '✏️',
                    className: 'primary',
                    onClick: (farmer) => farmer && handleEditFarmer(farmer)
                  },
                  {
                    label: 'KYC',
                    icon: '📋',
                    className: 'warning',
                    onClick: (farmer) => {
                      setSelectedFarmer(farmer);
                      setShowKYCModal(true);
                    }
                  }
                ]}
              />
            </div>
          </div>
        ) : (
          <div className="section-card" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)'
          }}>
            <div className="section-header">
              <h3 className="section-title" style={{ color: '#d97706' }}>Add New Farmer</h3>
              <div className="section-accent" style={{ background: '#f59e0b' }}></div>
            </div>
            
            <div className="section-actions-modern">
              <button 
                className="action-btn-modern secondary"
                onClick={() => setShowFarmerForm(false)}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Farmers
              </button>
            </div>
            
            <div className="form-container-modern">
              <FarmerRegistrationForm
                isInDashboard={true}
                onClose={() => setShowFarmerForm(false)}
                onSubmit={async (farmerData) => {
                  try {
                    const created = await farmersAPI.createFarmer(farmerData);
                    setAssignedFarmers(prev => [...prev, created]);
                    alert('Farmer created successfully!');
                    setShowFarmerForm(false);
                  } catch (error) {
                    console.error('Error creating farmer:', error);
                    alert('Failed to create farmer. Please try again.');
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderKYCProgress = () => {
    const stats = getStats();
    const total = stats.totalAssigned;
    const approvedPercentage = total > 0 ? Math.round((stats.approved / total) * 100) : 0;
    const pendingPercentage = total > 0 ? Math.round((stats.pending / total) * 100) : 0;
    const referBackPercentage = total > 0 ? Math.round((stats.referBack / total) * 100) : 0;
    const rejectedPercentage = total > 0 ? Math.round((stats.rejected / total) * 100) : 0;

    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">KYC Progress Tracking</h2>
          <p className="overview-description">
            Monitor your KYC verification progress and performance metrics.
          </p>
        </div>

        {/* Modern Progress Overview Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#15803d' }}>Overall Progress</h3>
            <div className="section-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="progress-overview-modern">
            <div className="progress-bar-modern">
              <div 
                className="progress-segment approved" 
                style={{ width: `${approvedPercentage}%` }}
                title={`Approved: ${approvedPercentage}%`}
              ></div>
              <div 
                className="progress-segment pending" 
                style={{ width: `${pendingPercentage}%` }}
                title={`Pending: ${pendingPercentage}%`}
              ></div>
              <div 
                className="progress-segment refer-back" 
                style={{ width: `${referBackPercentage}%` }}
                title={`Refer Back: ${referBackPercentage}%`}
              ></div>
              <div 
                className="progress-segment rejected" 
                style={{ width: `${rejectedPercentage}%` }}
                title={`Rejected: ${rejectedPercentage}%`}
              ></div>
            </div>
            
            <div className="progress-legend">
              <div className="legend-item">
                <div className="legend-color approved"></div>
                <span>Approved: {approvedPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span>Pending: {pendingPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color refer-back"></div>
                <span>Refer Back: {referBackPercentage}%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color rejected"></div>
                <span>Rejected: {rejectedPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Detailed Stats Grid */}
        <div className="stats-grid-modern">
          <div className="stat-card-modern approved" style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e'
          }}>
            <div className="stat-icon">
              <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Approved Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.approved}</span>
                <span className="stat-percentage">{approvedPercentage}%</span>
              </div>
            </div>
            <div className="stat-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="stat-card-modern pending" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="stat-icon">
              <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Pending Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.pending}</span>
                <span className="stat-percentage">{pendingPercentage}%</span>
              </div>
            </div>
            <div className="stat-accent" style={{ background: '#f59e0b' }}></div>
          </div>
          
          <div className="stat-card-modern refer-back" style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6'
          }}>
            <div className="stat-icon">
              <i className="fas fa-undo" style={{ color: '#2563eb' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Refer Back Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.referBack}</span>
                <span className="stat-percentage">{referBackPercentage}%</span>
              </div>
            </div>
            <div className="stat-accent" style={{ background: '#3b82f6' }}></div>
          </div>
          
          <div className="stat-card-modern rejected" style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="stat-icon">
              <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
            </div>
            <div className="stat-content">
              <h4 className="stat-title">Rejected Cases</h4>
              <div className="stat-numbers">
                <span className="stat-number">{stats.rejected}</span>
                <span className="stat-percentage">{rejectedPercentage}%</span>
              </div>
            </div>
            <div className="stat-accent" style={{ background: '#ef4444' }}></div>
          </div>
        </div>

        {/* Performance Metrics Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#475569' }}>Performance Metrics</h3>
            <div className="section-accent" style={{ background: '#64748b' }}></div>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-chart-line" style={{ color: '#15803d' }}></i>
              </div>
              <div className="metric-content">
                <h4>Approval Rate</h4>
                <span className="metric-value">
                  {stats.totalAssigned > 0 ? Math.round((stats.approved / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-stopwatch" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="metric-content">
                <h4>Processing Time</h4>
                <span className="metric-value">2.3 days</span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon">
                <i className="fas fa-trophy" style={{ color: '#3b82f6' }}></i>
              </div>
              <div className="metric-content">
                <h4>Success Rate</h4>
                <span className="metric-value">
                  {stats.totalAssigned > 0 ? Math.round(((stats.approved + stats.pending) / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTodoList = () => {
    const todoList = getTodoList();
    
    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">To-Do List</h2>
          <p className="overview-description">
            Manage your daily tasks and priorities for KYC verification.
          </p>
        </div>

        {/* Modern Todo Grid */}
        <div className="todo-grid-modern">
          <div className="todo-card-modern high-priority" style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern high">
                <i className="fas fa-exclamation-triangle"></i>
                <span>High Priority</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-clipboard-check" style={{ color: '#dc2626' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">New KYC Reviews</h4>
              <p className="todo-description">{todoList.newAssignments.length} new farmers need KYC verification</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern primary"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-eye"></i>
                  Review Now
                </button>
              </div>
            </div>
            <div className="todo-accent" style={{ background: '#ef4444' }}></div>
          </div>
          
          <div className="todo-card-modern medium-priority" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern medium">
                <i className="fas fa-clock"></i>
                <span>Medium Priority</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-hourglass-half" style={{ color: '#d97706' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">Pending Reviews</h4>
              <p className="todo-description">{todoList.pendingReviews.length} cases awaiting your review</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern warning"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-cogs"></i>
                  Process Pending
                </button>
              </div>
            </div>
            <div className="todo-accent" style={{ background: '#f59e0b' }}></div>
          </div>
          
          <div className="todo-card-modern urgent-priority" style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
            border: '2px solid #dc2626'
          }}>
            <div className="todo-header">
              <div className="priority-badge-modern urgent">
                <i className="fas fa-fire"></i>
                <span>Urgent</span>
              </div>
              <div className="todo-icon">
                <i className="fas fa-exclamation-circle" style={{ color: '#b91c1c' }}></i>
              </div>
            </div>
            <div className="todo-content">
              <h4 className="todo-title">Refer Back Cases</h4>
              <p className="todo-description">{todoList.referBackCases.length} cases need immediate attention</p>
              <div className="todo-actions">
                <button 
                  className="action-btn-modern danger"
                  onClick={() => setActiveTab('farmers')}
                >
                  <i className="fas fa-bolt"></i>
                  Review Urgent
                </button>
              </div>
            </div>
            <div className="todo-accent" style={{ background: '#dc2626' }}></div>
          </div>
        </div>

        {/* Modern Task Summary Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#0369a1' }}>Task Summary</h3>
            <div className="section-accent" style={{ background: '#0ea5e9' }}></div>
          </div>
          
          <div className="task-stats-modern">
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-plus-circle" style={{ color: '#0ea5e9' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.newAssignments.length}</span>
                <span className="task-stat-label">New Assignments</span>
              </div>
            </div>
            
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.pendingReviews.length}</span>
                <span className="task-stat-label">Pending Reviews</span>
              </div>
            </div>
            
            <div className="task-stat-modern">
              <div className="task-stat-icon">
                <i className="fas fa-undo" style={{ color: '#ef4444' }}></i>
              </div>
              <div className="task-stat-content">
                <span className="task-stat-number">{todoList.referBackCases.length}</span>
                <span className="task-stat-label">Refer Back</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#15803d' }}>Quick Actions</h3>
            <div className="section-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="quick-actions-modern">
            <button 
              className="quick-action-btn-modern primary"
              onClick={() => setActiveTab('farmers')}
            >
              <i className="fas fa-users"></i>
              <span>View All Farmers</span>
            </button>
            
            <button 
              className="quick-action-btn-modern secondary"
              onClick={() => setActiveTab('kyc')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>KYC Progress</span>
            </button>
            
            <button 
              className="quick-action-btn-modern info"
              onClick={() => setActiveTab('summary')}
            >
              <i className="fas fa-chart-bar"></i>
              <span>View Summary</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderKYCSummary = () => {
    const stats = getStats();
    
    return (
      <div className="overview-section">
        <div className="overview-header">
          <h2 className="overview-title">KYC Summary</h2>
          <p className="overview-description">
            Comprehensive overview of your KYC verification activities and performance.
          </p>
        </div>

        {/* Modern KYC Stats Grid */}
        <div className="kyc-stats-grid-modern">
          <div className="kyc-stat-card-modern approved" style={{
            background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
            border: '2px solid #22c55e'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-check-circle" style={{ color: '#15803d' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.approved}</span>
              <span className="kyc-stat-label-modern">Approved</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern pending" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-clock" style={{ color: '#d97706' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.pending}</span>
              <span className="kyc-stat-label-modern">Pending</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#f59e0b' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern refer-back" style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '2px solid #3b82f6'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-undo" style={{ color: '#2563eb' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.referBack}</span>
              <span className="kyc-stat-label-modern">Refer Back</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#3b82f6' }}></div>
          </div>
          
          <div className="kyc-stat-card-modern rejected" style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #ef4444'
          }}>
            <div className="kyc-stat-icon-modern">
              <i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i>
            </div>
            <div className="kyc-stat-content-modern">
              <span className="kyc-stat-number-modern">{stats.rejected}</span>
              <span className="kyc-stat-label-modern">Rejected</span>
            </div>
            <div className="kyc-stat-accent" style={{ background: '#ef4444' }}></div>
          </div>
        </div>

        {/* Modern KYC Performance Metrics */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '2px solid #64748b',
          boxShadow: '0 10px 25px rgba(100, 116, 139, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#475569' }}>Performance Metrics</h3>
            <div className="section-accent" style={{ background: '#64748b' }}></div>
          </div>
          
          <div className="performance-metrics-modern">
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-chart-line" style={{ color: '#15803d' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Approval Rate</h4>
                <span className="metric-value-modern">
                  {stats.totalAssigned > 0 ? Math.round((stats.approved / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-stopwatch" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Processing Time</h4>
                <span className="metric-value-modern">2.3 days</span>
              </div>
            </div>
            
            <div className="performance-metric-modern">
              <div className="metric-icon-modern">
                <i className="fas fa-trophy" style={{ color: '#3b82f6' }}></i>
              </div>
              <div className="metric-content-modern">
                <h4 className="metric-title">Success Rate</h4>
                <span className="metric-value-modern">
                  {stats.totalAssigned > 0 ? Math.round(((stats.approved + stats.pending) / stats.totalAssigned) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Activity Overview */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#0369a1' }}>Activity Overview</h3>
            <div className="section-accent" style={{ background: '#0ea5e9' }}></div>
          </div>
          
          <div className="activity-overview-modern">
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-check" style={{ color: '#0ea5e9' }}></i>
              </div>
              <div className="activity-content">
                <h4>Total Cases Handled</h4>
                <span className="activity-value">{stats.totalAssigned}</span>
              </div>
            </div>
            
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-day" style={{ color: '#22c55e' }}></i>
              </div>
              <div className="activity-content">
                <h4>Cases This Month</h4>
                <span className="activity-value">{Math.floor(stats.totalAssigned * 0.3)}</span>
              </div>
            </div>
            
            <div className="activity-item-modern">
              <div className="activity-icon">
                <i className="fas fa-calendar-week" style={{ color: '#f59e0b' }}></i>
              </div>
              <div className="activity-content">
                <h4>Cases This Week</h4>
                <span className="activity-value">{Math.floor(stats.totalAssigned * 0.1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for KYC Summary */}
        <div className="section-card" style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '2px solid #22c55e',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div className="section-header">
            <h3 className="section-title" style={{ color: '#15803d' }}>Quick Actions</h3>
            <div className="section-accent" style={{ background: '#22c55e' }}></div>
          </div>
          
          <div className="quick-actions-modern">
            <button 
              className="quick-action-btn-modern primary"
              onClick={() => setActiveTab('farmers')}
            >
              <i className="fas fa-users"></i>
              <span>View All Farmers</span>
            </button>
            
            <button 
              className="quick-action-btn-modern secondary"
              onClick={() => setActiveTab('kyc')}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>KYC Progress</span>
            </button>
            
            <button 
              className="quick-action-btn-modern info"
              onClick={() => setActiveTab('todo')}
            >
              <i className="fas fa-tasks"></i>
              <span>To-Do List</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* Top Bar */}
      <div className="top-bar"></div>
      
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <h1 className="logo-title">DATE</h1>
            <p className="logo-subtitle">Digital Agristack</p>
          </div>
        </div>
        <div className="header-right">
          {/* Simple working user profile dropdown */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              style={{
                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: '600',
                fontSize: '14px'
              }}
              onClick={() => {
                const dropdown = document.getElementById('simple-dropdown');
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span>{user?.name || 'User'}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            
            <div 
              id="simple-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                width: '280px',
                background: 'white',
                border: '2px solid #15803d',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                zIndex: '9999',
                marginTop: '8px',
                display: 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => {
                    window.location.href = '/change-password-dashboard';
                  }}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                >
                  <i className="fas fa-key" style={{ color: '#15803d' }}></i>
                  Change Password
                </button>
                <button 
                  onClick={() => {
                    logout();
                    window.location.href = '/login';
                  }}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#dc2626'
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          {/* Original UserProfileDropdown - commented out for now */}
          {/* <UserProfileDropdown /> */}
        </div>
      </div>

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-welcome">Welcome!!!</h2>
          <p className="sidebar-role">EMPLOYEE</p>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard Overview</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => setActiveTab('farmers')}
          >
            <i className="fas fa-users"></i>
            <span>Assigned Farmers</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <i className="fas fa-chart-line"></i>
            <span>KYC Progress</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'todo' ? 'active' : ''}`}
            onClick={() => setActiveTab('todo')}
          >
            <i className="fas fa-tasks"></i>
            <span>To-Do List</span>
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'kyc-summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc-summary')}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>KYC Summary</span>
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
          {activeTab === 'farmers' && renderAssignedFarmers()}
          {activeTab === 'progress' && renderKYCProgress()}
          {activeTab === 'todo' && renderTodoList()}
          {activeTab === 'kyc-summary' && renderKYCSummary()}
        </div>
      </div>

      {/* Removed FarmerForm modal; using inline FarmerRegistrationForm above */}

      {showKYCModal && selectedFarmer && (
        <KYCModal
          farmer={selectedFarmer}
          onClose={() => {
            setShowKYCModal(false);
            setSelectedFarmer(null);
          }}
          onApprove={(farmerId, documents) => handleKYCUpdate(farmerId, 'APPROVED', '', documents)}
          onReject={(farmerId, reason) => handleKYCUpdate(farmerId, 'REJECTED', reason)}
          onReferBack={(farmerId, reason) => handleKYCUpdate(farmerId, 'REFER_BACK', reason)}
        />
      )}

      {showFarmerDetails && selectedFarmerData && (
        <ViewFarmerRegistrationDetails
          farmerData={selectedFarmerData}
          onClose={handleCloseFarmerDetails}
          onSave={handleSaveFarmer}
        />
      )}

      {showEmployeeDetails && selectedEmployeeData && (
        <ViewEditEmployeeDetails
          employee={selectedEmployeeData}
          onClose={handleCloseEmployeeDetails}
          onUpdate={handleUpdateEmployee}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard; 