
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import Modal from '../Modal/Modal';
import { useModal } from '../../hooks/useModal';
import '../../styles/Auth.css';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [class_section, setClassSection] = useState('');
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
    if (password !== confirmPassword) {
      await showAlert('오류', '비밀번호가 일치하지 않습니다!');
      inputRef.current?.focus();
      return;
    }

    if (!username.trim()) {
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
      const classSectionInt = class_section ? parseInt(class_section, 10) : null;
      if (class_section && isNaN(classSectionInt)) {
        await showAlert('오류', '분반은 숫자로만 입력해야 합니다.');
        return;
      }

      const result = await registerUser(username, password, name, classSectionInt);
      
      if (result.success) {
        await showAlert('성공', result.message);
        // 회원가입 성공 후 로그인 페이지로 이동 시 페이지 리로드
        window.location.href = '/#/login';
      } else {
        await showAlert('오류', result.message);
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      await showAlert('오류', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h1>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="username">아이디</label>
          <input
            ref={inputRef}
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        <div className="input-group">
          <label htmlFor="confirm-password">비밀번호 확인</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>
        <div className="input-group">
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="input-group">
          <label htmlFor="class_section">분반</label>
          <input
            type="text"
            id="class_section"
            value={class_section}
            onChange={(e) => setClassSection(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyPress={handleKeyPress}
            placeholder="분반을 입력하세요"
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>
      <p className="switch-auth">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
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

export default RegisterPage;
