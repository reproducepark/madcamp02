import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import WebcamComponent from '../WebcamComponent';
import TimerComponent from '../TimerComponent';
import '../../styles/StretchingPage.css';
import '../../styles/WebcamComponent.css';

function StretchingPage({ onLogout }) {
  // localStorage에서 스트레칭 상태 불러오기
  const [isStretchingEnabled, setIsStretchingEnabled] = useState(() => {
    const saved = localStorage.getItem('stretchingEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  const handleStretchingToggle = (enabled) => {
    setIsStretchingEnabled(enabled);
    // localStorage에 상태 저장
    localStorage.setItem('stretchingEnabled', JSON.stringify(enabled));
  };

  return (
    <div className="todo-container">
      <TopMenu onLogout={onLogout} />
      <div className="todo-body">
        <Sidebar />
        <main className="todo-main">
          {/* 스트레칭 섹션 (왼쪽 반) */}
          <section className="todo-stretching-section">
            
            {/* 기능 on/off 토글 버튼 */}
            <div className="stretching-controls">
              <div className="toggle-container">
                <span className="toggle-label">스트레칭 기능</span>
                <button 
                  className={`toggle-button ${isStretchingEnabled ? 'active' : ''}`}
                  onClick={() => handleStretchingToggle(!isStretchingEnabled)}
                >
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {isStretchingEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            <div className="todo-stretching-content">
              {isStretchingEnabled ? (
                <div className="stretching-webcam-wrapper">
                  <WebcamComponent />
                </div>
              ) : (
                <div className="stretching-disabled">
                  <p>스트레칭 기능을 활성화해주세요</p>
                </div>
              )}
            </div>
          </section>

          {/* 타이머 섹션 (오른쪽 반) */}
          <section className="todo-timer-section">
            <div className="stretching-controls">
              <div className="toggle-container">
                <span className="toggle-label">타이머</span>
              </div>
            </div>
            <div className="todo-timer-content">
              <TimerComponent />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StretchingPage; 