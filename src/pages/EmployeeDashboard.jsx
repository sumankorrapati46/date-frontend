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

  const [filters, setFilters] = useState({
    kycStatus: '',
    assignedDate: ''
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
    const totalAssigned = assignedFarmers.length;
    const approved = assignedFarmers.filter(f => f.kycStatus === 'APPROVED').length;
    const pending = assignedFarmers.filter(f => f.kycStatus === 'PENDING').length;
    const referBack = assignedFarmers.filter(f => f.kycStatus === 'REFER_BACK').length;
    const rejected = assignedFarmers.filter(f => f.kycStatus === 'REJECTED').length;

    return {
      totalAssigned,
      approved,
      pending,
      referBack,
      rejected
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

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const handleChangePassword = () => {
    // Navigate to change password page
    window.location.href = '/change-password';
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
          <h2 className="overview-title">Employee Dashboard Overview</h2>
          <p className="overview-description">
            Manage your assigned farmers and KYC verification tasks efficiently.
          </p>
        </div>

        {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Assigned"
            value={stats.totalAssigned}
            change=""
            changeType="neutral"
            icon="👥"
        />
        <StatsCard
          title="Approved"
            value={stats.approved}
            change=""
            changeType="positive"
          icon="✅"
        />
        <StatsCard
          title="Pending"
            value={stats.pending}
            change=""
            changeType="warning"
          icon="⏳"
        />
        <StatsCard
          title="Refer Back"
            value={stats.referBack}
            change=""
            changeType="warning"
            icon="📝"
        />
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
              className="action-btn primary"
              onClick={() => setShowFarmerForm(true)}
            >
              Add Farmer
            </button>
      </div>
    </div>

        {/* Filters */}
      <div className="filters-section">
          <select 
            value={filters.kycStatus} 
            onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value }))}
            className="filter-select"
          >
            <option value="">All KYC Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REFER_BACK">Refer Back</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select 
            value={filters.assignedDate} 
            onChange={(e) => setFilters(prev => ({ ...prev, assignedDate: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Assignment Dates</option>
            <option value="2024-01-15">Jan 15, 2024</option>
            <option value="2024-01-18">Jan 18, 2024</option>
            <option value="2024-01-20">Jan 20, 2024</option>
            <option value="2024-01-25">Jan 25, 2024</option>
          </select>
      </div>

        {/* KYC Status Tabs */}
        <div className="kyc-tabs-section">
          <div className="kyc-tabs">
            <button 
              className={`kyc-tab ${filters.kycStatus === '' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: '' }))}
            >
              <span className="tab-icon">📊</span>
              <span className="tab-label">All</span>
              <span className="tab-count">{filteredFarmers.length}</span>
            </button>
            <button 
              className={`kyc-tab approved ${filters.kycStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'APPROVED' }))}
            >
              <span className="tab-icon">✅</span>
              <span className="tab-label">Approved</span>
              <span className="tab-count">{filteredFarmers.filter(f => f.kycStatus === 'APPROVED').length}</span>
            </button>
              <button 
              className={`kyc-tab pending ${filters.kycStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'PENDING' }))}
            >
              <span className="tab-icon">⏳</span>
              <span className="tab-label">Pending</span>
              <span className="tab-count">{filteredFarmers.filter(f => f.kycStatus === 'PENDING').length}</span>
              </button>
              <button 
              className={`kyc-tab rejected ${filters.kycStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, kycStatus: 'REJECTED' }))}
              >
              <span className="tab-icon">❌</span>
              <span className="tab-label">Rejected</span>
              <span className="tab-count">{filteredFarmers.filter(f => f.kycStatus === 'REJECTED').length}</span>
              </button>
            </div>
          </div>

        {/* Farmers Table or Inline Add Farmer */}
        {!showFarmerForm ? (

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
                  onClick={() => setShowFarmerForm(false)}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Farmers
                </button>
              </div>
            </div>
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

        {/* Progress Overview */}
        <div className="progress-overview">
          <div className="progress-stats">
            <div className="progress-stat">
              <h3>Overall Progress</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill approved" 
                  style={{ width: `${approvedPercentage}%` }}
                ></div>
                <div 
                  className="progress-fill pending" 
                  style={{ width: `${pendingPercentage}%` }}
                ></div>
                <div 
                  className="progress-fill refer-back" 
                  style={{ width: `${referBackPercentage}%` }}
                ></div>
                <div 
                  className="progress-fill rejected" 
                  style={{ width: `${rejectedPercentage}%` }}
            ></div>
              </div>
              <div className="progress-labels">
                <span>Approved: {approvedPercentage}%</span>
                <span>Pending: {pendingPercentage}%</span>
                <span>Refer Back: {referBackPercentage}%</span>
                <span>Rejected: {rejectedPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="detailed-stats">
          <div className="stat-card approved">
            <h4>Approved Cases</h4>
            <div className="stat-content">
              <span className="stat-number">{stats.approved}</span>
              <span className="stat-percentage">{approvedPercentage}%</span>
            </div>
          </div>
          <div className="stat-card pending">
            <h4>Pending Cases</h4>
            <div className="stat-content">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-percentage">{pendingPercentage}%</span>
            </div>
          </div>
          <div className="stat-card refer-back">
            <h4>Refer Back Cases</h4>
            <div className="stat-content">
              <span className="stat-number">{stats.referBack}</span>
              <span className="stat-percentage">{referBackPercentage}%</span>
        </div>
          </div>
          <div className="stat-card rejected">
            <h4>Rejected Cases</h4>
            <div className="stat-content">
              <span className="stat-number">{stats.rejected}</span>
              <span className="stat-percentage">{rejectedPercentage}%</span>
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

        {/* Todo Grid */}
        <div className="todo-grid">
          <div className="todo-card high-priority">
            <div className="priority-badge high">High Priority</div>
            <h4>New KYC Reviews</h4>
            <p>{todoList.newAssignments.length} new farmers need KYC verification</p>
            <button 
              className="action-btn-small primary"
              onClick={() => setActiveTab('farmers')}
            >
              Review Now
            </button>
          </div>
          
          <div className="todo-card medium-priority">
            <div className="priority-badge medium">Medium Priority</div>
            <h4>Pending Reviews</h4>
            <p>{todoList.pendingReviews.length} cases awaiting your review</p>
            <button 
              className="action-btn-small warning"
              onClick={() => setActiveTab('farmers')}
            >
              Process Pending
            </button>
          </div>
          
          <div className="todo-card urgent-priority">
            <div className="priority-badge urgent">Urgent</div>
            <h4>Refer Back Cases</h4>
            <p>{todoList.referBackCases.length} cases need immediate attention</p>
            <button 
              className="action-btn-small danger"
              onClick={() => setActiveTab('farmers')}
            >
              Review Urgent
            </button>
          </div>
        </div>

        {/* Task Summary */}
        <div className="task-summary">
          <h3>Task Summary</h3>
          <div className="task-stats">
            <div className="task-stat">
              <span className="task-number">{todoList.newAssignments.length}</span>
              <span className="task-label">New Assignments</span>
            </div>
            <div className="task-stat">
              <span className="task-number">{todoList.pendingReviews.length}</span>
              <span className="task-label">Pending Reviews</span>
            </div>
            <div className="task-stat">
              <span className="task-number">{todoList.referBackCases.length}</span>
              <span className="task-label">Refer Back</span>
            </div>
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

        {/* KYC Stats Grid */}
        <div className="kyc-stats-grid">
          <div className="kyc-stat-card approved">
            <div className="kyc-stat-icon">✅</div>
            <div className="kyc-stat-content">
              <span className="kyc-stat-number">{stats.approved}</span>
              <span className="kyc-stat-label">Approved</span>
            </div>
          </div>
          
          <div className="kyc-stat-card pending">
            <div className="kyc-stat-icon">⏳</div>
            <div className="kyc-stat-content">
              <span className="kyc-stat-number">{stats.pending}</span>
              <span className="kyc-stat-label">Pending</span>
            </div>
          </div>
          
          <div className="kyc-stat-card refer-back">
            <div className="kyc-stat-icon">📝</div>
            <div className="kyc-stat-content">
              <span className="kyc-stat-number">{stats.referBack}</span>
              <span className="kyc-stat-label">Refer Back</span>
            </div>
          </div>
          
          <div className="kyc-stat-card rejected">
            <div className="kyc-stat-icon">❌</div>
            <div className="kyc-stat-content">
              <span className="kyc-stat-number">{stats.rejected}</span>
              <span className="kyc-stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* KYC Performance Metrics */}
        <div className="kyc-performance">
          <h3>Performance Metrics</h3>
          <div className="performance-metrics">
            <div className="metric-card">
              <h4>Approval Rate</h4>
              <span className="metric-value">
                {stats.totalAssigned > 0 ? Math.round((stats.approved / stats.totalAssigned) * 100) : 0}%
              </span>
            </div>
            <div className="metric-card">
              <h4>Processing Time</h4>
              <span className="metric-value">2.3 days</span>
            </div>
            <div className="metric-card">
              <h4>Success Rate</h4>
              <span className="metric-value">
                {stats.totalAssigned > 0 ? Math.round(((stats.approved + stats.pending) / stats.totalAssigned) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      {/* USER ICON - ALWAYS VISIBLE */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#15803d',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: 'bold',
        border: '2px solid #22c55e',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(21, 128, 61, 0.3)'
      }}
      onClick={toggleUserDropdown}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        <span>{user?.name || 'User'}</span>
        <i className={`fas fa-chevron-down ${showUserDropdown ? 'fa-chevron-up' : ''}`}></i>
      </div>
      
      {/* USER DROPDOWN MENU */}
      {showUserDropdown && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: '#ffffff',
          border: '2px solid #15803d',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: '9999',
          width: '280px',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '12px'
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={handleChangePassword}
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
              onClick={handleLogout}
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
      )}
      
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
          <div className="user-profile-dropdown">
            <div className="user-profile-trigger" onClick={toggleUserDropdown}>
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="user-email">{user?.email || 'user@example.com'}</span>
              <i className={`fas fa-chevron-down dropdown-arrow ${showUserDropdown ? 'rotated' : ''}`}></i>
            </div>
            <div className="user-dropdown-menu" style={{ 
              display: showUserDropdown ? 'block' : 'none',
              position: 'absolute',
              top: '100%',
              right: '0',
              width: '280px',
              background: '#ffffff',
              border: '2px solid #15803d',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              zIndex: '9999',
              marginTop: '8px'
            }}>
              <div className="dropdown-header">
                <div className="user-avatar-large">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{user?.name || 'User'}</div>
                  <div className="user-email">{user?.email || 'user@example.com'}</div>
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
          <h2>DATE Digital Agristack</h2>
          <p>Employee Dashboard</p>
        </div>
        
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Overview</span>
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
        {/* Top Header Bar */}
        <div className="top-header"></div>

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="greeting-section">
              <h2 className="greeting-text">{getGreeting()}, {user?.name || 'Employee'}! 👋</h2>
              <p className="greeting-time">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
            <h1 className="header-title">Employee Dashboard</h1>
            <p className="header-subtitle">Manage assigned farmers and KYC</p>
          </div>
          <div className="header-right">
            <UserProfileDropdown />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === 'overview' && renderOverview()}
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