import React from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import '../../styles/ScrumPage.css';

function ScrumPage() {
  return (
    <div className="todo-container">
      <TopMenu />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          {/* 왼쪽 영역 (3:1 비율의 3) */}
          <div className="todo-left-section">
            {/* 시간표 영역 (상단 절반) */}
            <section className="todo-schedule-section">
              <div className="todo-schedule-title">시간표</div>
              <div className="todo-schedule-content">
                시간표 컴포넌트가 들어갈 공간입니다
              </div>
            </section>

            {/* 메모장 영역 (하단 절반) */}
            <section className="todo-memo-section">
              <div className="todo-memo-title">메모장</div>
              <div className="todo-memo-content">필요한거 알아낸거 궁금한거</div>
              <div className="todo-memo-btn-group">
                <button className="todo-memo-btn">스크럼 생성</button>
              </div>
            </section>
          </div>

          {/* 오른쪽 영역 (3:1 비율의 1) - 목표 추가 */}
          <aside className="todo-goal-aside">
            <div className="todo-date">2025. 1. 1.</div>
            <ul className="todo-goal-list">
              <li><span className="todo-goal-dot"></span>목표1</li>
              <li><span className="todo-goal-dot"></span>목표2</li>
              <li><span className="todo-goal-dot"></span>목표3</li>
              <li><span className="todo-goal-dot"></span>목표4</li>
            </ul>
            <div className="todo-goal-input-group">
              <input className="todo-goal-input" placeholder="목표 내용, 시작날짜 종료날짜" />
              <button className="todo-goal-btn">등록</button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default ScrumPage; 