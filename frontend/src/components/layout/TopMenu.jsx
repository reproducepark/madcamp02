import React from 'react';

function TopMenu() {
  return (
    <header className="top-menu">
      <div className="top-menu-left">
        <h1 className="logo">Todo App</h1>
      </div>
      <div className="top-menu-right">
        <button className="icon-button" onClick={() => console.log('User clicked')}>
          <span className="icon">👤</span>
        </button>
        <button className="icon-button" onClick={() => console.log('Settings clicked')}>
          <span className="icon">⚙️</span>
        </button>
      </div>
    </header>
  );
}

export default TopMenu; 