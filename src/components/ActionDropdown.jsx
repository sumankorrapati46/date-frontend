import React, { useState, useRef, useEffect } from 'react';

const ActionDropdown = ({ actions, customActions, item, onEdit, onDelete, onView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action) => {
    if (action.onClick && item) {
      action.onClick(item);
    }
    setIsOpen(false);
  };

  // Build actions array from all available sources
  const allActions = [];
  
  // Add custom actions if provided
  if (customActions && Array.isArray(customActions)) {
    allActions.push(...customActions);
  }
  
  // Add actions if provided
  if (actions && Array.isArray(actions)) {
    allActions.push(...actions);
  }
  
  // Add built-in actions if provided
  if (onView) {
    allActions.push({
      label: 'View',
      icon: '👁️',
      className: 'info',
      onClick: () => onView(item)
    });
  }
  
  if (onEdit) {
    allActions.push({
      label: 'Edit',
      icon: '✏️',
      className: 'primary',
      onClick: () => onEdit(item)
    });
  }
  
  if (onDelete) {
    allActions.push({
      label: 'Delete',
      icon: '🗑️',
      className: 'danger',
      onClick: () => onDelete(item)
    });
  }

  return (
    <div className="action-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Actions"
      >
        ⋯
      </button>
      
      {isOpen && allActions.length > 0 && (
        <div className="dropdown-menu">
          {allActions.map((action, index) => {
            // Check if action should be shown based on condition
            if (action.showCondition && item && !action.showCondition(item)) {
              return null;
            }
            
            return (
              <button
                key={index}
                className={`dropdown-item ${action.className || ''}`}
                onClick={() => handleActionClick(action)}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionDropdown; 