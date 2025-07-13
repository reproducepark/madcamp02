import React, { useRef, useEffect, useState } from 'react';

function WebcamComponent() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [postureCheckInterval, setPostureCheckInterval] = useState(3);
  const [neckAngleCheck, setNeckAngleCheck] = useState(false);
  const [facePositionCheck, setFacePositionCheck] = useState(false);

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



  return (
    <div className="webcam-container">
      
      <div className="webcam-video-container">
        {error ? (
          <div className="webcam-error">
            <p>{error}</p>
            <button onClick={startWebcam}>다시 시도</button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
          />
        )}
      </div>
      
      {isStreaming && (
        <div className="webcam-status">
          <span className="status-indicator active"></span>
          <span>스트리밍 중...</span>
        </div>
      )}

      {/* 자세 확인 설정 영역 */}
      <div className="webcam-settings">
        <h4>자세 확인 설정</h4>
        <div className="settings-content">
          <div className="setting-item">
            <label>자세 확인 주기</label>
            <select 
              className="setting-select"
              value={postureCheckInterval}
              onChange={(e) => setPostureCheckInterval(Number(e.target.value))}
            >
              <option value={1}>1분</option>
              <option value={3}>3분</option>
              <option value={5}>5분</option>
            </select>
          </div>
          <div className="setting-item">
            <label>목 각도 확인</label>
            <button 
              className={`toggle-button ${neckAngleCheck ? 'active' : ''}`}
              onClick={() => setNeckAngleCheck(!neckAngleCheck)}
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
              onClick={() => setFacePositionCheck(!facePositionCheck)}
            >
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {facePositionCheck ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebcamComponent; 