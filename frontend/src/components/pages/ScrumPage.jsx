import React from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import '../../styles/ScrumPage.css';

function ScrumPage() {
  return (
    <div className="scrum-container">
      <TopMenu />
      <div className="scrum-body">
        <Sidebar />
        <main className="scrum-main">
          {/* 우측 목표 및 날짜 */}
          <aside className="scrum-goal-aside">
            <div className="scrum-date">2025. 1. 1.</div>
            <ul className="scrum-goal-list">
              <li><span className="scrum-goal-dot"></span>목표1</li>
              <li><span className="scrum-goal-dot"></span>목표2</li>
              <li><span className="scrum-goal-dot"></span>목표3</li>
              <li><span className="scrum-goal-dot"></span>목표4</li>
            </ul>
            <div className="scrum-goal-input-group">
              <input className="scrum-goal-input" placeholder="목표 내용, 시작날짜 종료날짜" />
              <button className="scrum-goal-btn">등록</button>
            </div>
          </aside>

          {/* 공지/메모/스크럼 생성 */}
          <section className="scrum-memo-section">
            <div className="scrum-memo-title">공지 (메모장) - 스크럼 전용</div>
            <div className="scrum-memo-content">필요한거 알아낸거 궁금한거</div>
            <div className="scrum-memo-btn-group">
              <button className="scrum-memo-btn">스크럼 생성</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ScrumPage; 