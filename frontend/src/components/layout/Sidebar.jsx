import React from 'react';
import SidebarButton from './SidebarButton';
import '../../styles/Sidebar.css';
import { useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const menuItems = [
    { id: 'todo', label: '투두리스트', onClick: () => navigate('/todo', { state: null }) },
    { id: 'scrum', label: '스크럼', onClick: () => navigate('/scrum') },
    { id: 'stretching', label: '스트레칭\n및\n타이머', onClick: () => navigate('/stretching') }
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <SidebarButton key={item.id} onClick={item.onClick}>
            {item.label}
          </SidebarButton>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar; 