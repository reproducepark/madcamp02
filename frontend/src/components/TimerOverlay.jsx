import React, { useEffect, useState } from 'react';
import timerService from '../services/timerService';

const TimerOverlay = () => {
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
    });

    // IPC를 통한 상태 업데이트 구독
    let ipcUnsubscribe = null;
    if (window.electronAPI && window.electronAPI.onTimerStateUpdated) {
      try {
        ipcUnsubscribe = window.electronAPI.onTimerStateUpdated((state) => {
          setTimerState(state);
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
        <button 
          className="timer-overlay-close-btn"
          onClick={handleClose}
        >
          ×
        </button>
        
        <div className="timer-overlay-disk">
          <div className="timer-overlay-time">
            {formatTime(timerState.remaining)}
          </div>
        </div>
        
        <div className="timer-overlay-controls">
          <button
            onClick={handleToggle}
            className={`timer-overlay-start-btn ${timerState.isRunning ? 'running' : ''}`}
          >
            {timerState.isRunning ? '정지' : '시작'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimerOverlay; 