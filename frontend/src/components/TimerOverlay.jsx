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
  
  const DURATION_IN_SECONDS = 60 * 60; // 60 minutes (1시간)
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
          const newDeg = (state.remaining / DURATION_IN_SECONDS) * 360;
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
      const newDeg = (state.remaining / DURATION_IN_SECONDS) * 360;
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
      
      // 맥에서 추가 투명화 설정
      document.body.style.background = 'rgba(0, 0, 0, 0)';
      document.documentElement.style.background = 'rgba(0, 0, 0, 0)';
      document.body.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      document.documentElement.style.backgroundColor = 'rgba(0, 0, 0, 0)';
      
      // 모든 요소의 배경 투명화
      const allElements = document.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.style) {
          element.style.backgroundColor = 'transparent';
          element.style.background = 'transparent';
          element.style.webkitBackdropFilter = 'none';
          element.style.backdropFilter = 'none';
        }
      });
      
      // 맥에서 추가 강제 투명화
      setTimeout(() => {
        document.body.style.background = 'rgba(0, 0, 0, 0) !important';
        document.documentElement.style.background = 'rgba(0, 0, 0, 0) !important';
        document.body.style.backgroundColor = 'rgba(0, 0, 0, 0) !important';
        document.documentElement.style.backgroundColor = 'rgba(0, 0, 0, 0) !important';
      }, 100);
      
      console.log('TimerOverlay: 맥 전용 투명화 설정 완료');
    }
    
    console.log('TimerOverlay: 배경 투명화 설정 완료');
  }, []);

  useEffect(() => {
    // 타이머 초기화
    if (progressBarRef.current) {
      timerRef.current = new ProgressBar.Circle(progressBarRef.current, {
        color: '#ff4444',
        trailWidth: 40,
        trailColor: '#ffffff',
        strokeWidth: 40,
        duration: 0, // 애니메이션 없이 즉시 표시
        from: { color: '#ff4444' },
        to: { color: '#cc0000' }
      });
      
      // SVG 스케일 조정
      if (timerRef.current.svg) {
        timerRef.current.svg.style.transform = 'scale(-1, 1)';
      }
      
      // 초기 상태 설정
      const initialState = timerService.getState();
      const initialTimerDeg = (initialState.remaining / DURATION_IN_SECONDS) * 360;
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

  // 타이머 시작/일시정지
  const handleStartPause = () => {
    timerService.toggle();
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
      <div className="timer-overlay-container">
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
        
        <div className="timer-overlay-controls">
          <button
            onClick={handleStartPause}
            className={`timer-overlay-start-btn ${isRunning ? 'running' : ''}`}
          >
            {isRunning ? '정지' : '시작'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay; 