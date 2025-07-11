
import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function RegisterPage() {
  return (
    <div className="auth-form">
      <h1>회원가입</h1>
      <form>
        <div className="input-group">
          <label htmlFor="username">아이디</label>
          <input type="text" id="username" />
        </div>
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" />
        </div>
        <div className="input-group">
          <label htmlFor="confirm-password">비밀번호 확인</label>
          <input type="password" id="confirm-password" />
        </div>
        <button type="submit">회원가입</button>
      </form>
      <p className="switch-auth">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
