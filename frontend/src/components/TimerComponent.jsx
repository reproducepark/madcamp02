import React, { useEffect, useRef, useState } from 'react';
import ProgressBar from 'progressbar.js';
import '../styles/TimerComponent.css';

const TimerComponent = () => {
  const progressBarRef = useRef(null);
  const timerType = 'countdown'; // 고정값으로 설정
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState('10:00');
  const [isDragging, setIsDragging] = useState(false);
  const [lastDegree, setLastDegree] = useState(0);
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  
  const DURATION_IN_SECONDS = 60 * 60; // 60 minutes
  const timerRef = useRef(null);

  useEffect(() => {
    // 타이머 초기화
    if (progressBarRef.current) {
      timerRef.current = new ProgressBar.Circle(progressBarRef.current, {
        color: '#ffffff',
        trailWidth: 40,
        trailColor: '#333333',
        strokeWidth: 37,
        duration: 1 * 1000,
        from: { color: '#ffffff' },
        to: { color: '#ffffff' },
        step: function(state, timer) {
          updateTimerTime(timer, state);
        }
      });
      
      // SVG 스케일 조정
      if (timerRef.current.svg) {
        timerRef.current.svg.style.transform = 'scale(-1, 1)';
      }
      
      // 초기 타이머 설정 (10분)
      const initialTimerSeconds = 10 * 60;
      const initialTimerDeg = (initialTimerSeconds / DURATION_IN_SECONDS) * 360;
      const clampedDeg = Math.max(0, Math.min(360, initialTimerDeg));
      
      timerRef.current.animate(clampedDeg / 360, () => {
        setTimer(clampedDeg);
        setLastDegree(clampedDeg);
        updateKnobPosition(clampedDeg);
        // 자동 시작하지 않음
      });
    }



    return () => {
      if (timerRef.current) {
        timerRef.current.destroy();
      }
    };
  }, []);

  const updateTimerTime = (timer, state) => {
    const valueSeconds = Math.round(timer.value() * DURATION_IN_SECONDS);
    const timeString = formatTime(valueSeconds);
    setCurrentTime(timeString);
  };

  const updateKnobPosition = (degree) => {
    const containerRadius = 100; // timer-container의 반지름
    const rotation = degree * (Math.PI / 180.0);
    const position = {
      x: -Math.sin(rotation) * containerRadius + containerRadius,
      y: -Math.cos(rotation) * containerRadius + containerRadius
    };
    setKnobPosition(position);
  };

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

  const startTimer = () => {
    if (!timerRef.current) return;
    
    const finishValue = timerType === 'countdown' ? 0.0 : 1.0;
    const valueDiff = Math.abs(finishValue - timerRef.current.value());
    const duration = DURATION_IN_SECONDS * 1000 * valueDiff;
    
    if (duration > 0) {
      setIsRunning(true);
      timerRef.current.animate(finishValue, { duration });
      
      if (timerRef.current.timeout) {
        clearTimeout(timerRef.current.timeout);
      }
      
      timerRef.current.timeout = setTimeout(() => {
        setIsRunning(false);
      }, duration);
    }
  };

  const stopTimer = () => {
    if (timerRef.current && timerRef.current.timeout) {
      clearTimeout(timerRef.current.timeout);
    }
    if (timerRef.current) {
      timerRef.current.stop();
    }
    setIsRunning(false);
  };

  const setTimer = (deg) => {
    if (!timerRef.current) return;
    
    const startValue = timerType === 'countdown' ? 0.0 : 1.0;
    const newValue = Math.abs(startValue - (deg / 360.0));
    timerRef.current.set(newValue);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    stopTimer();
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const movePos = {
      x: e.clientX - centerX,
      y: e.clientY - centerY
    };
    
    const containerRadius = rect.width / 2;
    const atan = Math.atan2(movePos.x, movePos.y);
    let targetDeg = (atan / (Math.PI / 180.0)) + 180.0;

    // 경계 처리
    if (lastDegree < 90.0 && targetDeg > 270.0) {
      targetDeg = 0.0;
    } else if (lastDegree > 270.0 && targetDeg < 90.0) {
      targetDeg = 360.0;
    }
    
    setLastDegree(targetDeg);
    setTimer(targetDeg);
    updateKnobPosition(targetDeg);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    startTimer();
  };



  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY
        });
        handleMouseMove(mouseEvent);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, lastDegree]);

  return (
    <div className="timer-component">
      <div className="timer-container">
        <div 
          ref={progressBarRef}
          className="timer-disk"
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMouseDown(mouseEvent);
          }}
        >
          <div className="timer-bar-end"></div>
          <div 
            className="timer-bar-knob"
            style={{
              transform: `translate(${knobPosition.x - 10}px, ${knobPosition.y - 10}px)`
            }}
          ></div>
          <div className="timer-time">{currentTime}</div>
        </div>
      </div>
      
      <div className="timer-controls">
        <button 
          className="timer-play-pause-btn"
          onClick={isRunning ? stopTimer : startTimer}
          title={isRunning ? '일시정지' : '시작'}
        >
          {isRunning ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  );
};

export default TimerComponent; 