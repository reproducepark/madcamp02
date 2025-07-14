
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import TodoListPage from './components/pages/TodoListPage';
import ScrumPage from './components/pages/ScrumPage';
import StretchingPage from './components/pages/StretchingPage';
import TeammateTodoListPage from './components/pages/TeammateTodoListPage';
import LLMExample from './components/LLMExample';
import { isAuthenticated, tryAutoLogin, logoutUser } from './services/authService';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('App: 인증 초기화 시작');
      try {
        // 이미 로그인되어 있는지 확인
        console.log('App: isAuthenticated() 호출');
        if (isAuthenticated()) {
          console.log('App: 이미 인증됨 - 로그인 상태로 설정');
          setIsLoggedIn(true);
        } else {
          console.log('App: 인증되지 않음 - 자동 로그인 시도');
          // 자동 로그인 시도
          const autoLoginResult = await tryAutoLogin();
          console.log('App: 자동 로그인 결과:', autoLoginResult);
          if (autoLoginResult.success) {
            console.log('App: 자동 로그인 성공 - 로그인 상태로 설정');
            setIsLoggedIn(true);
          } else {
            console.log('App: 자동 로그인 실패:', autoLoginResult.message);
          }
        }
      } catch (error) {
        console.error('App: 인증 초기화 실패:', error);
      } finally {
        console.log('App: 인증 초기화 완료, isLoading = false');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
  };

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/todo" /> : <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />} 
        />
        <Route 
          path="/register" 
          element={isLoggedIn ? <Navigate to="/todo" /> : <RegisterPage />} 
        />
        <Route 
          path="/todo" 
          element={isLoggedIn ? <TodoListPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/scrum" 
          element={isLoggedIn ? <ScrumPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/scrum/teammate-todolist" 
          element={isLoggedIn ? <TeammateTodoListPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/stretching" 
          element={isLoggedIn ? <StretchingPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/llm-test" 
          element={isLoggedIn ? <LLMExample onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="*" 
          element={isLoggedIn ? <Navigate to="/todo" /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;

