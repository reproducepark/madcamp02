import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import './TopMenu.css';

function TopMenu() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isScrumPage = location.pathname.startsWith('/scrum');
  const isTeamViewPage = location.pathname === '/scrum/teammate-todolist';

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="top-menu">
      {/* 왼쪽: 로고 (사이드바와 너비 맞춤) */}
      <div className="top-menu-left">
        <h1 className="logo" onClick={() => navigate('/')}>Todo App</h1>
      </div>

      {/* 중앙: 스크럼 관련 버튼 */}
      <div className="top-menu-center">
        {isScrumPage && (
          <div className="scrum-menu">
            <div className="team-management-container">
              <button className="scrum-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                팀 생성/관리
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {/* TODO: 팀 목록 API 연동 */}
                  <button className="dropdown-item">팀 생성</button>
                </div>
              )}
            </div>
            {isTeamViewPage ? (
              <button className="scrum-menu-button" onClick={() => navigate('/scrum')}>홈</button>
            ) : (
              <button className="scrum-menu-button" onClick={() => navigate('/scrum/teammate-todolist')}>팀원</button>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽: 아이콘 버튼들 */}
      <div className="top-menu-right">
        <div style={{ position: 'relative' }}>
          <button className="icon-button" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="icon">👤</span>
          </button>
          {showProfileMenu && (
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
