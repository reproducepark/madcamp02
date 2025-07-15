import React, { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import TimerComponent from '../TimerComponent';
import { usePoseInference } from '../../contexts/PoseInferenceContext';
import '../../styles/StretchingPage.css';
import '../../styles/WebcamComponent.css';

function StretchingPage({ onLogout }) {
  // localStorage에서 스트레칭 상태 불러오기
  const [isStretchingEnabled, setIsStretchingEnabled] = useState(() => {
    const saved = localStorage.getItem('stretchingEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // 전역 추론 상태 사용
  const {
    isInferenceEnabled,
    inferenceInterval,
    neckAngleCheck,
    facePositionCheck,
    isRecognized,
    keypoints,
    currentAnalysis,
    shouldNotify,
    dispatch
  } = usePoseInference();

  const handleStretchingToggle = (enabled) => {
    setIsStretchingEnabled(enabled);
    // localStorage에 상태 저장
    localStorage.setItem('stretchingEnabled', JSON.stringify(enabled));
    
    // 전역 추론도 함께 토글
    dispatch({ type: 'SET_INFERENCE_ENABLED', payload: enabled });
  };

  // 스트레칭 기능이 활성화되면 전역 추론도 활성화
  useEffect(() => {
    if (isStretchingEnabled && !isInferenceEnabled) {
      dispatch({ type: 'SET_INFERENCE_ENABLED', payload: true });
    }
  }, [isStretchingEnabled, isInferenceEnabled, dispatch]);

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
                <div className="stretching-status-wrapper">
                  {/* 인식 상태 표시 */}
                  <div className="recognition-status">
                    <div className={`status-indicator ${isRecognized ? 'recognized' : 'not-recognized'}`}></div>
                    <span className="recognition-text">
                      {isRecognized 
                        ? '얼굴과 어깨가 인식되었어요' 
                        : '얼굴과 어깨가 인식되지 않았어요. 웹캠을 조정해 주세요.'
                      }
                    </span>
                  </div>

                  {/* 자세 확인 설정 영역 */}
                  <div className="webcam-settings">
                    <h4>자세 확인 설정</h4>
                    <div className="settings-content">
                      <div className="setting-item">
                        <label>전역 추론 기능</label>
                        <button 
                          className={`toggle-button ${isInferenceEnabled ? 'active' : ''}`}
                          onClick={() => dispatch({ type: 'SET_INFERENCE_ENABLED', payload: !isInferenceEnabled })}
                        >
                          <span className="toggle-slider"></span>
                          <span className="toggle-text">
                            {isInferenceEnabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                      <div className="setting-item">
                        <label>자세 확인 주기</label>
                        <select 
                          className="setting-select"
                          value={inferenceInterval}
                          onChange={(e) => dispatch({ type: 'SET_INFERENCE_INTERVAL', payload: Number(e.target.value) })}
                        >
                          <option value={1/6}>10초</option>
                          <option value={1}>1분</option>
                          <option value={3}>3분</option>
                          <option value={5}>5분</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>목 각도 확인</label>
                        <button 
                          className={`toggle-button ${neckAngleCheck ? 'active' : ''}`}
                          onClick={() => dispatch({ type: 'SET_NECK_ANGLE_CHECK', payload: !neckAngleCheck })}
                        >
                          <span className="toggle-slider"></span>
                          <span className="toggle-text">
                            {neckAngleCheck ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                      <div className="setting-item">
                        <label>얼굴 위치 확인</label>
                        <button 
                          className={`toggle-button ${facePositionCheck ? 'active' : ''}`}
                          onClick={() => dispatch({ type: 'SET_FACE_POSITION_CHECK', payload: !facePositionCheck })}
                        >
                          <span className="toggle-slider"></span>
                          <span className="toggle-text">
                            {facePositionCheck ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                      <div className="setting-item">
                        <label>알림 권한</label>
                        <button 
                          className="notification-permission-button"
                          onClick={() => {
                            if ('Notification' in window) {
                              Notification.requestPermission();
                            }
                          }}
                        >
                          권한 요청
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 현재 자세 상태 표시 */}
                  {currentAnalysis && (
                    <div className="current-posture-status">
                      <h4>현재 자세 상태</h4>
                      <div className="posture-info">
                        <p>목 각도: {currentAnalysis.shoulderNeckAngle ? `${currentAnalysis.shoulderNeckAngle.toFixed(1)}도` : '측정 불가'}</p>
                        <p>얼굴 위치: {currentAnalysis.faceInLowerHalf ? '하단' : '상단'}</p>
                        <p>자세 상태: {currentAnalysis.isValid ? (currentAnalysis.isAngleGreaterThan20 || currentAnalysis.faceInLowerHalf ? '⚠️ 교정 필요' : '✅ 정상') : '측정 불가'}</p>
                      </div>
                    </div>
                  )}
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