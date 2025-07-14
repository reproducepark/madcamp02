import React, { useEffect, useState, useRef } from 'react';
import ProgressBar from 'progressbar.js';
import timerService from '../services/timerService';

const TimerOverlay = () => {
  const progressBarRef = useRef(null);
  const timerRef = useRef(null);
  const DURATION_IN_SECONDS = 60 * 60; // 60 minutes
  
  const [timerState, setTimerState] = useState({
    isRunning: false,
    remaining: 600,
    duration: 600
  });

  useEffect(() => {
    // 초기 상태 설정
    const initialState = timerService.getState();
    setTimerState(initialState);

    // 타이머 상태 구독
    const unsubscribe = timerService.subscribe((state) => {
      setTimerState(state);
      
      // ProgressBar 업데이트
      if (timerRef.current) {
        const newDeg = (state.remaining / DURATION_IN_SECONDS) * 360;
        const clampedDeg = Math.max(0, Math.min(360, newDeg));
        timerRef.current.set(clampedDeg / 360);
      }
    });

    // IPC를 통한 상태 업데이트 구독
    let ipcUnsubscribe = null;
    if (window.electronAPI && window.electronAPI.onTimerStateUpdated) {
      try {
        ipcUnsubscribe = window.electronAPI.onTimerStateUpdated((state) => {
          setTimerState(state);
          
          // ProgressBar 업데이트
          if (timerRef.current) {
            const newDeg = (state.remaining / DURATION_IN_SECONDS) * 360;
            const clampedDeg = Math.max(0, Math.min(360, newDeg));
            timerRef.current.set(clampedDeg / 360);
          }
        });
      } catch (error) {
        console.error('IPC 구독 실패:', error);
      }
    }

    return () => {
      unsubscribe();
      if (ipcUnsubscribe && typeof ipcUnsubscribe === 'function') {
        try {
          ipcUnsubscribe();
        } catch (error) {
          console.error('IPC 구독 해제 실패:', error);
        }
      }
    };
  }, []);

  // ProgressBar 초기화
  useEffect(() => {
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
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    timerService.toggle();
  };

  const handleClose = async () => {
    try {
      if (window.electronAPI && window.electronAPI.closeCurrentWindow) {
        await window.electronAPI.closeCurrentWindow();
      }
    } catch (error) {
      console.error('창 닫기 실패:', error);
    }
  };

  return (
    <div className="timer-overlay">
      <div className="timer-overlay-container">
        {!timerState.isRunning && (
          <button 
            className="timer-overlay-close-btn"
            onClick={handleClose}
          >
            ×
          </button>
        )}
        
        <div 
          ref={progressBarRef}
          className="timer-overlay-disk"
        >
          <div className="timer-overlay-time">
            {formatTime(timerState.remaining)}
          </div>
        </div>
        
        <div className="timer-overlay-controls">
          <button
            onClick={handleToggle}
            className={`timer-overlay-btn ${timerState.isRunning ? 'stop' : 'start'}`}
          >
            {timerState.isRunning ? '중지' : '시작'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay; 