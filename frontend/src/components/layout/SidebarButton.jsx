import React from 'react';

function SidebarButton({ children, onClick }) {
  return (
    <button 
      className="sidebar-button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default SidebarButton; 