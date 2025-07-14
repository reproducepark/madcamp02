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
  
  // 시간 입력 상태 추가
  const [inputMinutes, setInputMinutes] = useState(10);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [duration, setDuration] = useState(600); // 전체 시간(초)
  const [remaining, setRemaining] = useState(600); // 남은 시간(초)
  
  const DURATION_IN_SECONDS = 60 * 60; // 60 minutes
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

    useEffect(() => {
    // 타이머 초기화
    if (progressBarRef.current) {
      timerRef.current = new ProgressBar.Circle(progressBarRef.current, {
        color: '#ff4444',
        trailWidth: 40,
        trailColor: '#333333',
        strokeWidth: 37,
        duration: 1 * 1000,
        from: { color: '#ff4444' },
        to: { color: '#cc0000' },
        step: function(state, timer) {
          updateTimerTime(timer, state);
        }
      });
      
      // SVG 스케일 조정
      if (timerRef.current.svg) {
        timerRef.current.svg.style.transform = 'scale(-1, 1)';
      }
      
      // 초기 타이머 설정
      const initialTimerDeg = (duration / DURATION_IN_SECONDS) * 360;
      const clampedDeg = Math.max(0, Math.min(360, initialTimerDeg));
      
      timerRef.current.set(clampedDeg / 360);
      setTimer(clampedDeg);
      setLastDegree(clampedDeg);
      updateKnobPosition(clampedDeg);
      setCurrentTime(formatTime(duration));
    }

    return () => {
      if (timerRef.current) {
        timerRef.current.destroy();
      }
    };
  }, [duration]);

  const updateTimerTime = (timer, state) => {
    const valueSeconds = Math.round(timer.value() * DURATION_IN_SECONDS);
    const timeString = formatTime(valueSeconds);
    setCurrentTime(timeString);
  };

  const updateKnobPosition = (degree) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const containerRadius = rect.width / 2;
    const rotation = degree * (Math.PI / 180.0);
    
    // 원의 끝점에 정확히 위치하도록 계산
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

  // 시간 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const num = Math.max(0, parseInt(value) || 0);
    if (name === 'minutes') setInputMinutes(num);
    if (name === 'seconds') setInputSeconds(num);
    
    // 실시간으로 타이머 업데이트 (타이머가 실행 중이 아닐 때만)
    if (!isRunning) {
      const total = (name === 'minutes' ? num : inputMinutes) * 60 + (name === 'seconds' ? num : inputSeconds);
      if (total > 0) {
        setDuration(total);
        setRemaining(total);
        setCurrentTime(formatTime(total));
        
        // 프로그레스 바 업데이트
        const newDeg = (total / DURATION_IN_SECONDS) * 360;
        setLastDegree(newDeg);
        if (timerRef.current) {
          timerRef.current.set(newDeg / 360);
        }
        updateKnobPosition(newDeg);
      }
    }
  };

  // 시간 설정 버튼
  const handleSetTime = () => {
    const total = inputMinutes * 60 + inputSeconds;
    if (total > 0) {
      setDuration(total);
      setRemaining(total);
      setIsRunning(false);
      clearInterval(intervalRef.current);
      
      // 프로그레스 바 업데이트
      const newDeg = (total / DURATION_IN_SECONDS) * 360;
      setLastDegree(newDeg);
      if (timerRef.current) {
        timerRef.current.set(newDeg / 360);
      }
      updateKnobPosition(newDeg);
      setCurrentTime(formatTime(total));
    }
  };

  // 타이머 시작/일시정지
  const handleStartPause = () => {
    console.log('=== handleStartPause called ===');
    console.log('Current isRunning:', isRunning);
    console.log('Current remaining:', remaining);
    console.log('Current duration:', duration);
    
    if (isRunning) {
      console.log('Stopping timer...');
      setIsRunning(false);
      clearInterval(intervalRef.current);
    } else {
      console.log('Starting timer...');
      setIsRunning(true);
    }
  };

  // 리셋
  const handleReset = () => {
    // 50분으로 설정
    const resetMinutes = 50;
    const resetSeconds = 0;
    const resetDuration = resetMinutes * 60 + resetSeconds;
    
    setInputMinutes(resetMinutes);
    setInputSeconds(resetSeconds);
    setDuration(resetDuration);
    setRemaining(resetDuration);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setCurrentTime(formatTime(resetDuration));
    
    // 프로그레스 바 리셋
    const newDeg = (resetDuration / DURATION_IN_SECONDS) * 360;
    setLastDegree(newDeg);
    if (timerRef.current) {
      timerRef.current.set(newDeg / 360);
    }
    updateKnobPosition(newDeg);
  };

  // 타이머 동작
  useEffect(() => {
    console.log('=== Timer useEffect triggered ===');
    console.log('isRunning:', isRunning);
    console.log('remaining:', remaining);
    console.log('duration:', duration);
    
    if (!isRunning) {
      console.log('Timer not running, returning early');
      return;
    }
    
    console.log('Setting up interval...');
    intervalRef.current = setInterval(() => {
      console.log('=== Interval tick ===');
      setRemaining(prev => {
        console.log('setRemaining called with prev:', prev);
        if (prev <= 1) {
          console.log('Timer finished!');
          setIsRunning(false);
          clearInterval(intervalRef.current);
          return 0;
        }
        const newRemaining = prev - 1;
        console.log('New remaining:', newRemaining);
        setCurrentTime(formatTime(newRemaining));
        
        // 시간 입력 필드도 업데이트
        const newMinutes = Math.floor(newRemaining / 60);
        const newSeconds = newRemaining % 60;
        setInputMinutes(newMinutes);
        setInputSeconds(newSeconds);
        
        // 프로그레스 바 업데이트
        const newDeg = (newRemaining / DURATION_IN_SECONDS) * 360;
        setLastDegree(newDeg);
        if (timerRef.current) {
          timerRef.current.set(newDeg / 360);
        }
        updateKnobPosition(newDeg);
        
        return newRemaining;
      });
    }, 1000);
    
    console.log('Interval set up with ID:', intervalRef.current);
    return () => {
      console.log('Cleaning up interval:', intervalRef.current);
      clearInterval(intervalRef.current);
    };
  }, [isRunning]);



  const setTimer = (deg) => {
    if (!timerRef.current) return;
    
    // 카운트다운에서는 각도가 클수록 남은 시간이 많음 (1.0에 가까움)
    // 각도가 작을수록 남은 시간이 적음 (0.0에 가까움)
    const newValue = deg / 360.0;
    timerRef.current.set(newValue);
    
    // 드래그할 때 시간 입력 필드도 업데이트 (타이머가 실행 중이 아닐 때만)
    if (!isRunning) {
      const newDuration = Math.round((deg / 360.0) * DURATION_IN_SECONDS);
      const newMinutes = Math.floor(newDuration / 60);
      const newSeconds = newDuration % 60;
      
      setInputMinutes(newMinutes);
      setInputSeconds(newSeconds);
      setDuration(newDuration);
      setRemaining(newDuration);
      setCurrentTime(formatTime(newDuration));
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setIsRunning(false);
    clearInterval(intervalRef.current);
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
              transform: `translate(${knobPosition.x - 10}px, ${knobPosition.y - 10}px)`,
              width: '20px',
              height: '20px'
            }}
          ></div>
        </div>
      </div>
      
      {/* 시간 입력 및 컨트롤 */}
      <div className="timer-input-section">
        <div className="timer-input-container">
          <input
            type="number"
            name="minutes"
            min={0}
            max={999}
            value={inputMinutes}
            onChange={handleInputChange}
            className="timer-input"
          />
          <span className="timer-input-label">분</span>
          <input
            type="number"
            name="seconds"
            min={0}
            max={59}
            value={inputSeconds}
            onChange={handleInputChange}
            className="timer-input"
          />
          <span className="timer-input-label">초</span>

        </div>
      </div>
      
      <div className="timer-controls">
        <button
          onClick={handleStartPause}
          className={`timer-start-btn ${isRunning ? 'running' : ''}`}
        >
          {isRunning ? '정지' : '시작'}
        </button>
        <button
          onClick={handleReset}
          className={`timer-reset-btn ${isRunning ? 'active' : ''}`}
          disabled={!isRunning}
        >
          리셋
        </button>
      </div>
      

    </div>
  );
};

export default TimerComponent; 