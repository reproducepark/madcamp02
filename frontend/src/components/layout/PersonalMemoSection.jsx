import React from 'react'
import '../../styles/GoalSection.css'  // 혹은 별도 스타일 만들어도 되고, GoalSection 스타일 재활용

function PersonalMemoSection({ onActivate, memos = [], onDeleteMemo, isTeammateView = false }) {
  return (
    <div className="goal-section">
      <div className="goal-header">
        <span className="goal-title">개인 메모</span>
        {!isTeammateView && (
          <button className="add-button" onClick={() => onActivate('memo')}>+</button>
        )}
      </div>
      <ul className="todo-list">
        {memos.map((memo, index) => (
          <li key={memo.id || index} className="todo-item">
            <span className="todo-text">{memo.content}</span>
            {!isTeammateView && (
              <button
                className="delete-button"
                onClick={() => onDeleteMemo && onDeleteMemo(memo.id)}
                title="삭제"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PersonalMemoSection
