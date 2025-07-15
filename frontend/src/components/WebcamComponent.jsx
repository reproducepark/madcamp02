// src/components/WebcamComponent.jsx
import React, { useRef, useEffect, useState } from 'react';
import PoseDetectionComponent from './PoseDetectionComponent';
import { usePoseInference } from '../contexts/PoseInferenceContext';

function WebcamComponent() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  
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

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
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
        setError(null);
      }
    } catch (err) {
      console.error('웹캠 접근 오류:', err);
      setError('웹캠에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.');
      setIsStreaming(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };




  // 1초마다 상태 출력 (디버깅용)
  useEffect(() => {
    const debugInterval = setInterval(() => {
      console.log('🔄 1초마다 상태 체크:', {
        추론활성화: isInferenceEnabled,
        인식상태: isRecognized,
        키포인트수: keypoints ? keypoints.length : 0,
        현재분석: !!currentAnalysis,
        알림상태: shouldNotify,
        목각도: currentAnalysis?.shoulderNeckAngle || 'N/A',
        얼굴하단: currentAnalysis?.faceInLowerHalf || false,
        각도경고: currentAnalysis?.isAngleGreaterThan20 || false
      });
    }, 1000); // 1초마다 실행

    return () => clearInterval(debugInterval);
  }, [isInferenceEnabled, isRecognized, keypoints, currentAnalysis, shouldNotify]);



  return (
    <div>
      
      <div className="webcam-video-container">
        {error ? (
          <div className="webcam-error">
            <p>{error}</p>
            <button onClick={startWebcam}>다시 시도</button>
          </div>
        ) : (
          <div className="video-pose-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="webcam-video"
            />
            <PoseDetectionComponent 
              videoRef={videoRef}
              onRecognitionChange={(recognized) => {
                console.log('👁️ 인식 상태 변경:', recognized);
                dispatch({ type: 'SET_IS_RECOGNIZED', payload: recognized });
              }}
              onKeypointsChange={(keypoints) => {
                if (keypoints) {
                  console.log('🎯 키포인트 업데이트:', keypoints.length, '개');
                } else {
                  console.log('🎯 키포인트 업데이트: 감지되지 않음 (null)');
                }
                dispatch({ type: 'SET_KEYPOINTS', payload: keypoints });
              }}
            />
          </div>
        )}
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
    </div>
  );
}

export default WebcamComponent; 