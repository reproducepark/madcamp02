import React from 'react';
import './TodoListPage.css'; // 새로 생성할 CSS 파일을 import 합니다.

function TodoListPage() {
  return (
    <div className="container">
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-spacer" />
        <nav className="sidebar-nav">
          <span>팀즈</span>
          <span>투두리스트</span>
          <span>
            스트레칭<br />및<br />타이머
          </span>
        </nav>
      </aside>
      {/* 본문 */}
      <main className="main-content">
        <div className="todo-card">
          {/* 날짜 */}
          <div className="todo-date">2025. 1. 1.</div>
          <div className="divider" />
          {/* 목표1 */}
          <div className="goal-section">
            <div className="goal-header">
              <span className="goal-title">목표1</span>
              <button className="add-button">+</button>
            </div>
            <ul className="todo-list">
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
            </ul>
          </div>
          <div className="divider" />
          {/* 목표2 */}
          <div className="goal-section">
            <div className="goal-header">
              <span className="goal-title">목표2</span>
              <button className="add-button">+</button>
            </div>
            <ul className="todo-list">
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
              <li className="todo-item">
                <input type="checkbox" className="todo-checkbox" disabled />
                <span>콘티짜기</span>
              </li>
            </ul>
          </div>
          <div className="divider" />
          <div className="memo">메모</div>
          <div className="button-group">
            <button className="action-button">할일 추가</button>
            <button className="action-button">등록</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TodoListPage;