import React from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import '../../styles/StretchingPage.css';

function StretchingPage() {
  return (
    <div className="todo-container">
      <TopMenu />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          {/* 스트레칭 섹션 (왼쪽 반) */}
          <section className="todo-stretching-section">
            <div className="todo-stretching-title">스트레칭</div>
            <div className="todo-stretching-content">
              스트레칭 컴포넌트가 들어갈 공간입니다
            </div>
          </section>

          {/* 타이머 섹션 (오른쪽 반) */}
          <section className="todo-timer-section">
            <div className="todo-timer-title">타이머</div>
            <div className="todo-timer-content">
              타이머 컴포넌트가 들어갈 공간입니다
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StretchingPage; 