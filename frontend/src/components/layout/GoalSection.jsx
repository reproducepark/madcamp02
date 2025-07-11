import React from 'react';
import '../../styles/GoalSection.css';

function GoalSection({ title, todos = [], onAddTodo, onDeleteTodo }) {
  return (
    <div className="goal-section">
      <div className="goal-header">
        <span className="goal-title">{title}</span>
        <button className="add-button" onClick={onAddTodo}>+</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo, index) => (
          <li key={todo.id || index} className="todo-item">
            <input 
              type="checkbox" 
              className="todo-checkbox" 
              checked={todo.completed}
              onChange={() => todo.onToggle && todo.onToggle(todo.id || index)}
              disabled={todo.disabled}
            />
            <span className="todo-text">{todo.text}</span>
            <button 
              className="delete-button"
              onClick={() => onDeleteTodo && onDeleteTodo(todo.id || index)}
              title="삭제"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GoalSection; 