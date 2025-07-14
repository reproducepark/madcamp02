import React, { useEffect, useRef, useState } from 'react';
import ProgressBar from 'progressbar.js';
import timerService from '../services/timerService';
import '../styles/TimerOverlay.css';

const TimerOverlay = () => {
  const progressBarRef = useRef(null);
  const [currentTime, setCurrentTime] = useState('10:00');
  const [isRunning, setIsRunning] = useState(false);
  const [remaining, setRemaining] = useState(600);
  const [duration, setDuration] = useState(600);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const timerRef = useRef(null);

  // TimerService 구독 및 IPC 상태 동기화
  useEffect(() => {
    console.log('TimerOverlay: 구독 시작');
    
    // 초기 상태 설정 (IPC를 통해 메인 창에서 가져오기)
    const initializeState = async () => {
      if (window.electronAPI) {
        try {
          const initialState = await window.electronAPI.getTimerState();
          console.log('TimerOverlay: IPC 초기 상태', initialState);
          if (initialState) {
            setDuration(initialState.duration);
            setRemaining(initialState.remaining);
            setIsRunning(initialState.isRunning);
            setCurrentTime(formatTime(initialState.remaining));
          }
        } catch (error) {
          console.error('TimerOverlay: IPC 초기 상태 가져오기 실패', error);
          // 폴백: 로컬 타이머 서비스 사용
          const localState = timerService.getState();
          setDuration(localState.duration);
          setRemaining(localState.remaining);
          setIsRunning(localState.isRunning);
          setCurrentTime(formatTime(localState.remaining));
        }
      } else {
        // Electron API가 없는 경우 로컬 타이머 서비스 사용
        const localState = timerService.getState();
        setDuration(localState.duration);
        setRemaining(localState.remaining);
        setIsRunning(localState.isRunning);
        setCurrentTime(formatTime(localState.remaining));
      }
    };
    
    initializeState();
    
    // IPC를 통한 상태 업데이트 구독
    let ipcUnsubscribe = null;
    if (window.electronAPI) {
      try {
        ipcUnsubscribe = window.electronAPI.onTimerStateUpdated((state) => {
          console.log('TimerOverlay: IPC 상태 업데이트', state);
          setDuration(state.duration);
          setIsRunning(state.isRunning);
          setRemaining(state.remaining);
          setCurrentTime(formatTime(state.remaining));
          
          // 프로그레스 바 업데이트
          const newDeg = (state.remaining / state.duration) * 360;
          if (timerRef.current) {
            timerRef.current.set(newDeg / 360);
          }
        });
      } catch (error) {
        console.error('TimerOverlay: IPC 구독 실패', error);
      }
    }
    
    // 로컬 타이머 서비스 구독 (폴백)
    const localUnsubscribe = timerService.subscribe((state) => {
      console.log('TimerOverlay: 로컬 상태 업데이트', state);
      setDuration(state.duration);
      setIsRunning(state.isRunning);
      setRemaining(state.remaining);
      setCurrentTime(formatTime(state.remaining));
      
      // 프로그레스 바 업데이트
      const newDeg = (state.remaining / state.duration) * 360;
      if (timerRef.current) {
        timerRef.current.set(newDeg / 360);
      }
    });

    return () => {
      if (ipcUnsubscribe && typeof ipcUnsubscribe === 'function') {
        try {
          ipcUnsubscribe();
        } catch (error) {
          console.error('TimerOverlay: IPC 구독 해제 실패', error);
        }
      }
      localUnsubscribe();
    };
  }, []);

  // 전역 마우스 이벤트 처리
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging && window.electronAPI) {
        e.preventDefault();
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // 창 배경 투명화
  useEffect(() => {
    // body와 html 배경을 완전히 투명하게 설정
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // 추가적인 투명화 설정
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    
    // 맥 전용 추가 설정
    if (navigator.platform.includes('Mac')) {
      document.body.style.webkitBackdropFilter = 'none';
      document.body.style.backdropFilter = 'none';
      document.documentElement.style.webkitBackdropFilter = 'none';
      document.documentElement.style.backdropFilter = 'none';
      console.log('TimerOverlay: 맥 전용 투명화 설정 완료');
    }
    
    console.log('TimerOverlay: 배경 투명화 설정 완료');
  }, []);

  useEffect(() => {
    // 타이머 초기화
    if (progressBarRef.current) {
      timerRef.current = new ProgressBar.Circle(progressBarRef.current, {
        color: '#ff4444',
        trailWidth: 20,
        trailColor: 'rgba(255, 255, 255, 0.2)',
        strokeWidth: 18,
        duration: 0, // 애니메이션 없이 즉시 표시
        from: { color: '#ff4444' },
        to: { color: '#ff0000' }
      });
      
      // SVG 스케일 조정
      if (timerRef.current.svg) {
        timerRef.current.svg.style.transform = 'scale(-1, 1)';
      }
      
      // 초기 상태 설정
      const initialState = timerService.getState();
      const initialTimerDeg = (initialState.remaining / initialState.duration) * 360;
      const clampedDeg = Math.max(0, Math.min(360, initialTimerDeg));
      
      timerRef.current.set(clampedDeg / 360);
    }

    return () => {
      if (timerRef.current) {
        timerRef.current.destroy();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e) => {
    if (window.electronAPI) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && window.electronAPI) {
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 오버레이 창 닫기
  const handleClose = () => {
    console.log('TimerOverlay: 닫기 버튼 클릭됨');
    if (window.electronAPI) {
      console.log('TimerOverlay: 현재 창 닫기 API 호출');
      window.electronAPI.closeCurrentWindow().then((result) => {
        console.log('TimerOverlay: 창 닫기 완료, 결과:', result);
      }).catch((error) => {
        console.error('TimerOverlay: 창 닫기 실패:', error);
        // 폴백: 기존 API 시도
        console.log('TimerOverlay: 폴백 API 시도');
        window.electronAPI.closeOverlayWindow().then(() => {
          console.log('TimerOverlay: 폴백 API로 창 닫기 완료');
        }).catch((fallbackError) => {
          console.error('TimerOverlay: 폴백 API도 실패:', fallbackError);
        });
      });
    } else {
      console.warn('TimerOverlay: Electron API not available');
    }
  };

  return (
    <div className="timer-overlay">
      <div 
        className="timer-overlay-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <button 
          className="timer-overlay-close-btn"
          onClick={handleClose}
          title="닫기"
        >
          ×
        </button>
        <div 
          ref={progressBarRef}
          className="timer-overlay-disk"
        >
        </div>
        <div className="timer-overlay-time">
          {currentTime}
        </div>
        <div className={`timer-overlay-status ${isRunning ? 'running' : 'paused'}`}>
          {isRunning ? '실행 중' : '일시정지'}
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay; 