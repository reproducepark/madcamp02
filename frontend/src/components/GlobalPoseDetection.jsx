// src/components/GlobalPoseDetection.jsx
import React, { useRef, useEffect, useState } from 'react';
import PoseDetectionComponent from './PoseDetectionComponent';
import { usePoseInference } from '../contexts/PoseInferenceContext';

function GlobalPoseDetection() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [effectiveInterval, setEffectiveInterval] = useState(10000); // 실제 적용될 인터벌
  
  // 전역 추론 상태 및 사용자 설정 간격 사용
  const {
    isInferenceEnabled,
    inferenceInterval, // 사용자가 설정한 간격
    dispatch,
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

  // 페이지 상태 변경에 따라 실제 적용될 추론 간격(effectiveInterval) 계산
  useEffect(() => {
    const handlePageChange = () => {
      if (isInferenceEnabled) {
        const isStretchingPage = window.location.hash === '#/stretching';
        const isPageActive = !document.hidden;
        
        let newInterval;
        if (isStretchingPage && isPageActive) {
          // 스트레칭 페이지가 활성화 상태이면 1초
          newInterval = 1000;
        } else {
          // 그 외의 경우, 사용자가 설정한 전역 간격 사용
          newInterval = inferenceInterval;
        }
        
        setEffectiveInterval(newInterval);
        console.log(`🔄 전역 추론 간격 변경: ${newInterval / 1000}초 (스트레칭: ${isStretchingPage}, 활성: ${isPageActive})`);
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
  }, [isInferenceEnabled, inferenceInterval]); // inferenceInterval이 변경될 때도 이 효과를 재실행

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
          customInterval={effectiveInterval} // 실제 적용될 인터벌 전달
          onRecognitionChange={(recognized) => {
            dispatch({ type: 'SET_IS_RECOGNIZED', payload: recognized });
          }}
          onKeypointsChange={(keypoints) => {
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