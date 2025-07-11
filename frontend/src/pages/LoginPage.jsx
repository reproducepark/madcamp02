
import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function LoginPage() {
  return (
    <div className="auth-form">
      <h1>로그인</h1>
      <form>
        <div className="input-group">
          <label htmlFor="username">아이디</label>
          <input type="text" id="username" />
        </div>
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" />
        </div>
        <button type="submit">로그인</button>
      </form>
      <p className="switch-auth">
        계정이 없으신가요? <Link to="/register">회원가입</Link>
      </p>
    </div>
  );
}

export default LoginPage;
