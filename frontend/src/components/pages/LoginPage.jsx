
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import '../../styles/Auth.css';

function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { modalState, showAlert, showConfirm, closeModal } = useModal();

  useEffect(() => {
    inputRef.current?.focus(); // ✅ 여기
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!id.trim()) {
      await showAlert('오류', '아이디를 입력해주세요!');
      inputRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      await showAlert('오류', '비밀번호를 입력해주세요!');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await loginUser(id, password);
      
      if (result.success) {
        navigate('/todo'); // Redirect to a protected route
      } else {
        await showAlert('오류', result.message);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Login failed:', error);
      await showAlert('오류', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">아이디</label>
          <input
            ref={inputRef}
            type="text"
            id="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder="아이디를 입력하세요"
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="switch-auth">
        계정이 없으신가요? <Link to="/register">회원가입</Link>
      </p>

      {/* 모달 */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
}

export default LoginPage;
