import React from 'react';
import SidebarButton from './SidebarButton';
import './Sidebar.css';

function Sidebar() {
  const menuItems = [
    { id: 'teams', label: '팀즈', onClick: () => console.log('팀즈 클릭') },
    { id: 'todo', label: '투두리스트', onClick: () => console.log('투두리스트 클릭') },
    { 
      id: 'stretching', 
      label: '스트레칭\n및\n타이머', 
      onClick: () => console.log('스트레칭 및 타이머 클릭') 
    }
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