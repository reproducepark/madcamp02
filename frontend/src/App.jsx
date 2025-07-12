
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import TodoListPage from './components/pages/TodoListPage';
import ScrumPage from './components/pages/ScrumPage';
import StretchingPage from './components/pages/StretchingPage';
import TeammateTodoListPage from './components/pages/TeammateTodoListPage'; // 새로 추가
import LLMExample from './components/LLMExample';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/todo" element={<TodoListPage />} />
        <Route path="/scrum" element={<ScrumPage />} />
        <Route path="/scrum/teammate-todolist" element={<TeammateTodoListPage />} /> {/* 새로 추가 */}
        <Route path="/stretching" element={<StretchingPage />} />
        <Route path="/llm-test" element={<LLMExample />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

