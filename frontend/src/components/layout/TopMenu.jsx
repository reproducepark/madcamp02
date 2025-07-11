import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopMenu.css';

function TopMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("로그아웃 되었습니다.");
    navigate('/login');
  };

  return (
    <header className="top-menu">
      <div className="top-menu-left">
        <h1 className="logo">Todo App</h1>
      </div>
      <div className="top-menu-right">
        <div style={{ position: 'relative' }}>
          <button className="icon-button" onClick={() => setShowMenu(!showMenu)}>
            <span className="icon">👤</span>
          </button>
          {showMenu && (
            <div className="dropdown">
              <button onClick={handleLogout}>로그아웃</button>
            </div>
          )}
        </div>
        <button className="icon-button" onClick={() => console.log('Settings clicked')}>
          <span className="icon">⚙️</span>
        </button>
      </div>
    </header>
  );
}

export default TopMenu;
