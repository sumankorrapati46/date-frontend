import React, { useState } from 'react';
import '../styles/ViewFarmerDetails.css';

const AssignmentInline = ({ farmers = [], employees = [], onBack, onAssign }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFarmer = (id) => {
    setSelectedFarmerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedFarmerIds.length === farmers.length) setSelectedFarmerIds([]);
    else setSelectedFarmerIds(farmers.map(f => f.id));
  };

  const handleAssign = async () => {
    console.log('🔍 Assign Farmers button clicked!');
    console.log('🔍 Selected Employee ID:', selectedEmployeeId);
    console.log('🔍 Selected Farmer IDs:', selectedFarmerIds);
    
    if (!selectedEmployeeId || selectedFarmerIds.length === 0) {
      alert('Please select an employee and at least one farmer');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const employee = employees.find(e => String(e.id) === String(selectedEmployeeId));
      console.log('🔍 Found employee:', employee);
      
      if (!employee) {
        throw new Error('Selected employee not found in the list');
      }
      
      const assignments = selectedFarmerIds.map(fid => {
        const farmer = farmers.find(f => f.id === fid) || {};
        return {
          farmerId: fid,
          employeeId: Number(selectedEmployeeId),
          employeeName: employee?.name || '',
          farmerName: farmer?.name || ''
        };
      });
      
      console.log('🔍 Created assignments:', assignments);
      console.log('🔍 Calling onAssign with assignments...');
      
      await onAssign(assignments);
      console.log('🔍 onAssign completed successfully!');
      
      // Clear selections after successful assignment
      setSelectedEmployeeId('');
      setSelectedFarmerIds([]);
      
    } catch (error) {
      console.error('❌ Error in handleAssign:', error);
      alert('Failed to assign farmers: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-farmer-content">
      <div className="view-farmer-header">
        <button 
          className="back-btn" 
          onClick={onBack}
          style={{
            background: '#10b981',
            border: '1px solid #059669',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#059669';
            e.target.style.borderColor = '#047857';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#10b981';
            e.target.style.borderColor = '#059669';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          ← Back to Farmers
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Assign Farmers to Employee</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              console.log('🔍 Assign Farmers button clicked!');
              handleAssign();
            }}
            disabled={isSubmitting}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              position: 'relative',
              zIndex: 9999,
              pointerEvents: 'auto',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.target.style.background = '#059669';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.target.style.background = '#10b981';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Assigning...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Assign Farmers
              </>
            )}
          </button>
        </div>
      </div>

      <div className="view-farmer-body">
        <div className="farmer-details-container" style={{ maxWidth: '100%', width: '100%' }}>
          <div className="detail-section">
            <h3>Select Employee</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Employee</label>
                <select className="edit-input" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name || 'Unknown'}{emp.designation ? ` - ${emp.designation}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Select Farmers</h3>
            <div style={{ marginBottom: 12 }}>
              <button 
                className="select-all-btn"
                onClick={toggleSelectAll} 
                type="button"
              >
                {selectedFarmerIds.length === farmers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {farmers.map(farmer => (
                <div key={farmer.id} className="detail-item" style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={selectedFarmerIds.includes(farmer.id)}
                    onChange={() => toggleFarmer(farmer.id)}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{farmer.name}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>{[farmer.district, farmer.state].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>Summary</h3>
            <div className="detail-grid">
              <div className="detail-item"><label>Selected Farmers:</label><span>{selectedFarmerIds.length}</span></div>
              <div className="detail-item"><label>Selected Employee:</label><span>{employees.find(e => String(e.id) === String(selectedEmployeeId))?.name || 'None'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentInline;


