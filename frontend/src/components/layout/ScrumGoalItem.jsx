import React, { useState } from 'react';

function ScrumGoalItem({ goal, onToggle, onDelete, isTeammateView = false }) {
  return (
    <li className="todo-item">
      <input
        type="checkbox"
        className="todo-checkbox"
        checked={goal.completed}
        onChange={() => onToggle(goal.id)}
        disabled={goal.disabled || isTeammateView}
      />
      <span className="todo-text">
        {goal.text}
        <span className="scrum-goal-dates"> ({goal.startDate} ~ {goal.endDate})</span>
      </span>
      {!isTeammateView && (
        <button 
          className="delete-button"
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
