import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../layout/Sidebar';
import TopMenu from '../layout/TopMenu';
import TimerComponent from '../TimerComponent';
import { usePoseInference } from '../../contexts/PoseInferenceContext';
import '../../styles/StretchingPage.css';
import '../../styles/WebcamComponent.css';

function StretchingPage({ onLogout }) {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // localStorage에서 스트레칭 상태 불러오기
  const [isStretchingEnabled, setIsStretchingEnabled] = useState(() => {
    const saved = localStorage.getItem('stretchingEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // 전역 추론 상태 사용
  const {
    isInferenceEnabled,
    inferenceInterval,
    setInferenceInterval, // setInferenceInterval 추가
    neckAngleCheck,
    facePositionCheck,
    isRecognized,
    keypoints,
    currentAnalysis,
    shouldNotify,
    dispatch
  } = usePoseInference();

  // 웹캠 시작
  useEffect(() => {
    if (isStretchingEnabled) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isStretchingEnabled]);

  const startWebcam = async () => {
    try {
      console.log('📹 자세감지 페이지 웹캠 시작');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        console.log('✅ 자세감지 페이지 웹캠 시작 성공');
      }
    } catch (err) {
      console.error('❌ 자세감지 페이지 웹캠 접근 오류:', err);
      setIsStreaming(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      console.log('🛑 자세감지 페이지 웹캠 중지');
    }
  };

  const handleStretchingToggle = (enabled) => {
    setIsStretchingEnabled(enabled);
    // localStorage에 상태 저장
    localStorage.setItem('stretchingEnabled', JSON.stringify(enabled));
    
    // 전역 추론도 함께 토글
    dispatch({ type: 'SET_INFERENCE_ENABLED', payload: enabled });
  };

  // 자세감지 기능이 활성화되면 전역 추론도 활성화
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
          {/* 자세감지 섹션 (왼쪽 반) */}
          <section className="todo-posture-section">
            
            {/* 기능 on/off 토글 버튼 */}
            <div className="controls-box">
              <div className="toggle-container">
                <span className="toggle-label">자세감지 및 자세 교정</span>
                <button 
                  className={`toggle-button ${isStretchingEnabled ? 'active' : ''}`}
                  onClick={() => handleStretchingToggle(!isStretchingEnabled)}
                >
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {/* {isStretchingEnabled ? 'ON' : 'OFF'} */}
                  </span>
                </button>
              </div>
            </div>

            <div className="todo-posture-content">
              {isStretchingEnabled ? (
                <div className="posture-webcam-wrapper">
                  {/* 웹캠 화면 표시 */}
                  <div className="webcam-video-container">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="webcam-video"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '500px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

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
                        <label>자세 확인 주기</label>
                        <select 
                          className="setting-select"
                          value={inferenceInterval} // ms 단위의 전역 상태와 직접 바인딩
                          onChange={(e) => setInferenceInterval(Number(e.target.value))} // setInferenceInterval 호출
                        >
                          <option value={10000}>10초</option>
                          <option value={60000}>1분</option>
                          <option value={180000}>3분</option>
                          <option value={300000}>5분</option>
                        </select>
                      </div>
                      <div className="setting-item">
                        <label>몸 각도 확인</label>
                        <button 
                          className={`toggle-button ${neckAngleCheck ? 'active' : ''}`}
                          onClick={() => dispatch({ type: 'SET_NECK_ANGLE_CHECK', payload: !neckAngleCheck })}
                        >
                          <span className="toggle-slider"></span>
                          <span className="toggle-text">
                            {/* {neckAngleCheck ? 'ON' : 'OFF'} */}
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
                            {/* {facePositionCheck ? 'ON' : 'OFF'} */}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="posture-disabled">
                  <p>자세감지 및 자세 교정 기능을 활성화해주세요</p>
                </div>
              )}
            </div>
          </section>

          {/* 타이머 섹션 (오른쪽 반) */}
          <section className="todo-timer-section">
            <div className="controls-box">
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