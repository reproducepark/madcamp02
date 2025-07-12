import React from 'react';
import '../../styles/GoalSection.css';

function GoalSection({ title, todos = [], onAddTodo, onDeleteTodo, isTeammateView = false }) {
  return (
    <div className="goal-section">
      <div className="goal-header">
        <span className="goal-title">{title}</span>
        {!isTeammateView && <button className="add-button" onClick={onAddTodo}>+</button>}
      </div>
      <ul className="todo-list">
        {todos.map((todo, index) => (
          <li key={todo.id || index} className="todo-item">
            <input 
              type="checkbox" 
              className="todo-checkbox" 
              checked={todo.completed}
              onChange={() => todo.onToggle && todo.onToggle(todo.id || index)}
              disabled={todo.disabled || isTeammateView} /* 팀원 보기 모드에서는 체크박스도 비활성화 */
            />
            <span className="todo-text">{todo.text}</span>
            {!isTeammateView && (
              <button 
                className="delete-button"
                onClick={() => onDeleteTodo && onDeleteTodo(todo.id || index)}
                title="삭제"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GoalSection; 