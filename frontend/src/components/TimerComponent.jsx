import React, { useEffect, useRef, useState } from 'react';
import ProgressBar from 'progressbar.js';
import timerService from '../services/timerService';
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

  // TimerService 구독
  useEffect(() => {
    // 초기 상태 설정
    const initialState = timerService.getState();
    setDuration(initialState.duration);
    setRemaining(initialState.remaining);
    setIsRunning(initialState.isRunning);
    setCurrentTime(formatTime(initialState.remaining));
    
    // 시간 입력 필드 초기화
    const minutes = Math.floor(initialState.remaining / 60);
    const seconds = initialState.remaining % 60;
    setInputMinutes(minutes);
    setInputSeconds(seconds);
    
    const unsubscribeTimer = timerService.subscribe((state) => {
      console.log('TimerComponent: 상태 업데이트', state);
      setIsRunning(state.isRunning);
      setDuration(state.duration);
      setRemaining(state.remaining);
      setCurrentTime(formatTime(state.remaining));
      
      // 시간 입력 필드 업데이트
      const minutes = Math.floor(state.remaining / 60);
      const seconds = state.remaining % 60;
      setInputMinutes(minutes);
      setInputSeconds(seconds);
      
      // 프로그레스 바 업데이트
      const newDeg = (state.remaining / DURATION_IN_SECONDS) * 360;
      setLastDegree(newDeg);
      if (timerRef.current) {
        timerRef.current.set(newDeg / 360);
      }
      updateKnobPosition(newDeg);
    });



    return () => {
      unsubscribeTimer();
    };
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
        to: { color: '#cc0000' },
        step: function(state, timer) {
          updateTimerTime(timer, state);
        }
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
      setLastDegree(clampedDeg);
      updateKnobPosition(clampedDeg);
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
        timerService.setTime(name === 'minutes' ? num : inputMinutes, name === 'seconds' ? num : inputSeconds);
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
    timerService.toggle();
  };

  // 리셋
  const handleReset = () => {
    // 50분으로 설정
    timerService.setTime(50, 0);
  };

  // 오버레이 토글 (비활성화됨)
  const handleOverlayToggle = () => {
    console.log('TimerComponent: 오버레이 기능이 비활성화되었습니다.');
    alert('오버레이 기능이 비활성화되었습니다.');
  };





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
      
      timerService.setTime(newMinutes, newSeconds);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    timerService.pause();
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
        {/* 시계 인덱스 SVG - 별도 레이어로 분리 */}
        <div className="timer-index-layer">
          <svg className="timer-index-svg" width="260" height="260">
          {/* 1분/5분 바 인덱스 */}
          {[...Array(60)].map((_, i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180); // 0이 위로
            const cx = 130;
            const cy = 130;
            const rOuter = i % 5 === 0 ? 110 : 105; // 바깥쪽 끝 반지름을 더 줄임
            const rInner = i % 5 === 0 ? 100 : 100; // 5분 단위는 더 길게, 1분 단위는 더 짧게
            const x1 = cx + rInner * Math.cos(angle);
            const y1 = cy + rInner * Math.sin(angle);
            const x2 = cx + rOuter * Math.cos(angle);
            const y2 = cy + rOuter * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={'#222'}
                strokeWidth={i % 5 === 0 ? 3 : 1}
                opacity={i % 5 === 0 ? 0.8 : 0.5}
              />
            );
          })}
          {/* 5분 단위 숫자 인덱스 - 숨김 처리 */}
          {/* {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180); // 0시가 위로 오도록
            const r = 122; // 숫자 반지름을 10만큼 늘림
            const cx = 130;
            const cy = 130;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle) + 4; // +4는 시각적 보정
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="18"
                fill="#222"
                fontWeight="bold"
                style={{userSelect: 'none'}}
              >
                {i === 0 ? '0' : 60 - i * 5}
              </text>
            );
          })} */}
          </svg>
        </div>
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
        <button
          onClick={handleOverlayToggle}
          className="timer-overlay-btn"
          disabled
        >
          오버레이 열기
        </button>
      </div>
      

    </div>
  );
};

export default TimerComponent; 