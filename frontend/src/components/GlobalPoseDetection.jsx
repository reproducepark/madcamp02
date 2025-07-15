// src/components/GlobalPoseDetection.jsx
import React, { useRef, useEffect, useState } from 'react';
import PoseDetectionComponent from './PoseDetectionComponent';
import { usePoseInference } from '../contexts/PoseInferenceContext';

function GlobalPoseDetection() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [inferenceInterval, setInferenceInterval] = useState(1000); // 기본 1초
  
  // 전역 추론 상태 사용
  const {
    isInferenceEnabled,
    isRecognized,
    keypoints,
    dispatch
  } = usePoseInference();

  // 전역 추론이 활성화되어 있을 때만 웹캠 시작
  useEffect(() => {
    if (isInferenceEnabled) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isInferenceEnabled]);

  // 추론 주기 계산
  useEffect(() => {
    if (isInferenceEnabled) {
      // 현재 상태를 직접 확인
      const currentIsStretchingPage = window.location.hash === '#/stretching';
      const currentIsPageActive = !document.hidden;
      
      let newInterval;
      if (currentIsStretchingPage && currentIsPageActive) {
        // 스트레칭 페이지가 활성화되어 있으면 1초마다
        newInterval = 1000;
        console.log('🌐 GlobalPoseDetection: 스트레칭 페이지 모드 (1초)');
      } else {
        // 다른 페이지나 비활성화 상태에서는 10초마다 (기본값)
        newInterval = 10000;
        console.log('🌐 GlobalPoseDetection: 다른 페이지 모드 (10초)');
      }
      
      setInferenceInterval(newInterval);
    }
  }, [isInferenceEnabled]);

  // 페이지 상태 변경 감지
  useEffect(() => {
    const handlePageChange = () => {
      if (isInferenceEnabled) {
        const currentIsStretchingPage = window.location.hash === '#/stretching';
        const currentIsPageActive = !document.hidden;
        
        let newInterval;
        if (currentIsStretchingPage && currentIsPageActive) {
          newInterval = 1000;
          console.log('🌐 GlobalPoseDetection: 페이지 변경 - 스트레칭 페이지 모드 (1초)');
        } else {
          newInterval = 10000;
          console.log('🌐 GlobalPoseDetection: 페이지 변경 - 다른 페이지 모드 (10초)');
        }
        
        setInferenceInterval(newInterval);
      }
    };

    // 초기 실행
    handlePageChange();

    // 이벤트 리스너 등록
    window.addEventListener('hashchange', handlePageChange);
    document.addEventListener('visibilitychange', handlePageChange);
    window.addEventListener('focus', handlePageChange);
    window.addEventListener('blur', handlePageChange);

    return () => {
      window.removeEventListener('hashchange', handlePageChange);
      document.removeEventListener('visibilitychange', handlePageChange);
      window.removeEventListener('focus', handlePageChange);
      window.removeEventListener('blur', handlePageChange);
    };
  }, [isInferenceEnabled]);

  const startWebcam = async () => {
    try {
      console.log('🌐 전역 웹캠 시작');
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
        console.log('✅ 전역 웹캠 시작 성공');
      }
    } catch (err) {
      console.error('❌ 전역 웹캠 접근 오류:', err);
      setError('웹캠에 접근할 수 없습니다.');
      setIsStreaming(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      console.log('🛑 전역 웹캠 중지');
    }
  };

  // 전역 추론이 비활성화되어 있으면 렌더링하지 않음
  if (!isInferenceEnabled) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '-9999px', 
      left: '-9999px', 
      width: '1px', 
      height: '1px', 
      overflow: 'hidden',
      zIndex: -1
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '1px', height: '1px' }}
      />
      {isStreaming && (
        <PoseDetectionComponent 
          videoRef={videoRef}
          customInterval={inferenceInterval} // 커스텀 인터벌 전달
          onRecognitionChange={(recognized) => {
            console.log('🌐 전역 인식 상태 변경:', recognized);
            dispatch({ type: 'SET_IS_RECOGNIZED', payload: recognized });
          }}
          onKeypointsChange={(keypoints) => {
            if (keypoints) {
              console.log('🌐 전역 키포인트 업데이트:', keypoints.length, '개');
            } else {
              console.log('🌐 전역 키포인트 업데이트: 감지되지 않음');
            }
            dispatch({ type: 'SET_KEYPOINTS', payload: keypoints });
          }}
        />
      )}
      {error && (
        <div style={{ display: 'none' }}>
          전역 웹캠 오류: {error}
        </div>
      )}
    </div>
  );
}

export default GlobalPoseDetection; 