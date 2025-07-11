
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import TodoListPage from './components/pages/TodoListPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/todo" element={<TodoListPage />} />
        <Route path="*" element={<Navigate to="/todo" />} />
      </Routes>
    </Router>
  );
}

export default App;

