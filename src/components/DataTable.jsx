import React from 'react';
import ActionDropdown from './ActionDropdown';

const DataTable = ({ data, columns, onEdit, onDelete, onView, showDelete = false, customActions }) => {

  
  // Ensure customActions is always an array
  const safeCustomActions = customActions && Array.isArray(customActions) ? customActions : [];
  
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'refer_back':
        return 'status-refer-back';
      case 'rejected':
        return 'status-rejected';
      case 'assigned':
        return 'status-assigned';
      case 'unassigned':
        return 'status-unassigned';
      case 'active':
        return 'status-approved';
      case 'inactive':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  };

  // Debug function to safely render values
  const safeRender = (value, columnKey) => {
    try {
      // If value is an object, try to extract meaningful data
      if (value && typeof value === 'object') {
        // Prefer explicit name fields
        const name = value.name
          || [value.firstName, value.middleName, value.lastName].filter(Boolean).join(' ')
          || [value.firstName, value.lastName].filter(Boolean).join(' ')
          || value.fullName
          || value.employeeName
          || value.email
          || value.userName;
        if (name && String(name).trim().length) return String(name);

        // Fallbacks
        if (value.id !== undefined) return `#${value.id}`;
        try {
          const preview = JSON.stringify(value);
          return preview.length <= 60 ? preview : 'N/A';
        } catch (_) {
          return 'N/A';
        }
      }
      
      // If value is null or undefined, return 'N/A'
      if (value === null || value === undefined) {
        return 'N/A';
      }
      
      // If value is a string, number, or boolean, return it as string
      return String(value);
    } catch (error) {
      console.error(`DataTable: Error rendering value for column ${columnKey}:`, error);
      return 'Error';
    }
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns && Array.isArray(columns) && columns.map((column, index) => (
              <th key={index}>{column.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data && Array.isArray(data) && data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns && Array.isArray(columns) && columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {(() => {
                    if (!row || typeof row !== 'object') return 'N/A';
                    const value = row[column.key];
                    
                    // Handle status fields with special styling
                    if (column.key === 'kycStatus' || column.key === 'assignmentStatus' || column.key === 'status' || column.key === 'accessStatus') {
                      return (
                        <span className={getStatusClass(value)}>
                          {safeRender(value, column.key)}
                        </span>
                      );
                    }
                    
                    // Handle date fields
                    if (column.key === 'registrationDate' || column.key === 'assignedDate') {
                      return value ? new Date(value).toLocaleDateString() : 'N/A';
                    }
                    
                    // Handle name fields (combine firstName, middleName, and lastName if needed)
                    if (column.key === 'name') {
                      if (row.firstName || row.lastName) {
                        const parts = [row.firstName, row.middleName, row.lastName].filter(Boolean);
                        return parts.length > 0 ? parts.join(' ') : 'N/A';
                      } else if (row.name) {
                        return row.name;
                      } else {
                        return 'N/A';
                      }
                    }
                    
                    // Handle assigned employee specifically if value is object
                    if (column.key === 'assignedEmployee') {
                      return safeRender(value, column.key);
                    }
                    
                    // Handle phone fields
                    if (column.key === 'phone' || column.key === 'phoneNumber') {
                      return row.phoneNumber || row.phone || row.contactNumber || 'N/A';
                    }
                    
                    // Handle email fields
                    if (column.key === 'email' || column.key === 'emailAddress') {
                      return row.email || row.emailAddress || 'N/A';
                    }
                    
                    return safeRender(value, column.key);
                  })()}
                </td>
              ))}
              <td>
                {row && (
                  <ActionDropdown
                    item={row}
                    onEdit={onEdit ? () => onEdit(row) : undefined}
                    onDelete={showDelete && onDelete ? () => onDelete(row) : undefined}
                    onView={onView ? () => onView(row) : undefined}
                    customActions={safeCustomActions.map(action => ({
                      ...action,
                      onClick: () => action.onClick(row)
                    }))}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!data || !Array.isArray(data) || data.length === 0) && (
        <div className="no-data">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
};

export default DataTable; 