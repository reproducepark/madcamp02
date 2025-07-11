
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import TodoListPage from './components/pages/TodoListPage';
import ScrumPage from './components/pages/ScrumPage';
import StretchingPage from './components/pages/StretchingPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/todo" element={<TodoListPage />} />
        <Route path="/scrum" element={<ScrumPage />} />
        <Route path="/stretching" element={<StretchingPage />} />
        <Route path="*" element={<Navigate to="/todo" />} />
      </Routes>
    </Router>
  );
}

export default App;

