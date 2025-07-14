import React from 'react';

function ScrumGoalItem({ goal, onToggle, onDelete }) {
  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={goal.real_end_date !== null}
        onChange={() => onToggle(goal.id, goal.real_end_date !== null, goal.content)}
      />
      <span className="todo-text">
        {goal.content}
        <span className="scrum-goal-dates">
          ({goal.start_date?.split('T')[0]} ~ {goal.planned_end_date?.split('T')[0]})
        </span>
      </span>
      <button className="delete-button" onClick={() => onDelete(goal.id)}>×</button>
    </li>
  );
}

export default ScrumGoalItem;


