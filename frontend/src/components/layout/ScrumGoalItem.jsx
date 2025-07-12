import React from 'react';

function ScrumGoalItem({ goal, onToggle, onDelete }) {
  return (
    <li className="todo-goal-item">
      <span 
        className={`todo-goal-dot ${goal.completed ? 'completed' : ''}`}
        onClick={() => onToggle && onToggle(goal.id)}
      ></span>
      <span className={`todo-goal-text ${goal.completed ? 'completed' : ''}`}>{goal.text}</span>
      {onDelete && (
        <button 
          className="todo-goal-delete-btn"
          onClick={() => onDelete(goal.id)}
          title="삭제"
        >
          ×
        </button>
      )}
    </li>
  );
}

export default ScrumGoalItem; 