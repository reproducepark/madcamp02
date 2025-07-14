import React, { useState } from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import WebcamComponent from '../WebcamComponent';
import StretchingTimer from '../layout/StretchingTimer';
import '../../styles/StretchingPage.css';
import '../../styles/WebcamComponent.css';

function StretchingPage() {
  const [isStretchingEnabled, setIsStretchingEnabled] = useState(false);

  const handleStretchingToggle = (enabled) => {
    setIsStretchingEnabled(enabled);
  };

  return (
    <div className="todo-container">
      <TopMenu />
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
                <WebcamComponent />
              ) : (
                <div className="stretching-disabled">
                  <p>스트레칭 기능을 활성화해주세요</p>
                </div>
              )}
            </div>
          </section>

          {/* 타이머 섹션 (오른쪽 반) */}
          <section className="todo-timer-section">
            <div className="todo-timer-title">타이머</div>
            <div className="todo-timer-content">
              <StretchingTimer />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default StretchingPage; 