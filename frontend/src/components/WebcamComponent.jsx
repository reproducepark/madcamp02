import React, { useRef, useEffect, useState } from 'react';

function WebcamComponent() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

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
      <div className="webcam-header">
        <h3>실시간 웹캠</h3>
      </div>
      
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

      {/* 설정 영역 */}
      <div className="webcam-settings">
        <h4>설정</h4>
        <div className="settings-content">
          <div className="setting-item">
            <label>해상도</label>
            <select className="setting-select">
              <option value="640x480">640x480</option>
              <option value="1280x720">1280x720</option>
              <option value="1920x1080">1920x1080</option>
            </select>
          </div>
          <div className="setting-item">
            <label>프레임 레이트</label>
            <select className="setting-select">
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          <div className="setting-item">
            <label>카메라</label>
            <select className="setting-select">
              <option value="default">기본 카메라</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebcamComponent; 