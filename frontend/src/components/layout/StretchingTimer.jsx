import React, { useState } from 'react';
import { useTimer } from '../../hooks/useTimer';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = 120;
const SVG_SIZE = 240;

function StretchingTimer() {
  // 기본값: 1시간
  const [inputMinutes, setInputMinutes] = useState(60);
  const [inputSeconds, setInputSeconds] = useState(0);
  
  // 전역 타이머 서비스 사용
  const { duration, remaining, isRunning, setTime, toggle, reset, getFormattedTime, getFormattedDuration } = useTimer();

  // 시간 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const num = Math.max(0, parseInt(value) || 0);
    if (name === 'minutes') setInputMinutes(num);
    if (name === 'seconds') setInputSeconds(num);
  };

  // 시간 설정 버튼
  const handleSetTime = () => {
    setTime(inputMinutes, inputSeconds);
  };

  // 타이머 시작/일시정지
  const handleStartPause = () => {
    toggle();
  };

  // 리셋
  const handleReset = () => {
    reset();
  };

  // SVG 원형 타이머 계산 (항상 60분 기준, 부채꼴)
  const totalMinutes = 60;
  const setMinutes = Math.max(1, Math.floor(duration / 60)); // 최소 1분
  const elapsed = duration - remaining;
  const elapsedRatio = elapsed / duration;
  // 현재 남은 각도(시작: 설정한 분, 끝: 0)
  const startAngle = -90; // 12시 방향
  const endAngle = startAngle + 360 * (setMinutes / totalMinutes) * (1 - elapsedRatio);

  // 부채꼴 path 생성 함수
  function describeSector(cx, cy, r, startAngle, endAngle) {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(rad * startAngle);
    const y1 = cy + r * Math.sin(rad * startAngle);
    const x2 = cx + r * Math.cos(rad * endAngle);
    const y2 = cy + r * Math.sin(rad * endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
  }

  const sectorPath = describeSector(CENTER, CENTER, RADIUS, startAngle, endAngle);

  // 시간 표시
  const { minutes: min, seconds: sec } = getFormattedTime();
  const { minutes: totalMin, seconds: totalSec } = getFormattedDuration();

  // 눈금 및 숫자(0~55, 5분 단위)
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x1 = CENTER + Math.cos(angle) * (RADIUS + 8);
    const y1 = CENTER + Math.sin(angle) * (RADIUS + 8);
    const x2 = CENTER + Math.cos(angle) * (RADIUS + 18);
    const y2 = CENTER + Math.sin(angle) * (RADIUS + 18);
    const labelX = CENTER + Math.cos(angle) * (RADIUS + 32);
    const labelY = CENTER + Math.sin(angle) * (RADIUS + 32) + 6;
    return {
      x1, y1, x2, y2, labelX, labelY, label: (i === 0 ? '0' : (i * 5).toString())
    };
  });

  return (
    <div style={{
      background: '#fff',
      borderRadius: 24,
      boxShadow: '0 2px 12px #0001',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: 340,
      margin: '0 auto'
    }}>
      <svg width={SVG_SIZE} height={SVG_SIZE} style={{ display: 'block', marginBottom: 8 }}>
        {/* 배경 원 */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="#f8f8f8"
        />
        {/* 빨간 피자조각 영역 */}
        <path
          d={sectorPath}
          fill="#d32f2f"
          style={{ transition: 'd 0.5s linear' }}
        />
        {/* 눈금 및 숫자 */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#bbb"
              strokeWidth={2}
            />
            <text
              x={tick.labelX}
              y={tick.labelY}
              textAnchor="middle"
              fontSize={18}
              fill="#888"
              fontWeight={tick.label === '0' ? 'bold' : 'normal'}
            >
              {tick.label}
            </text>
          </g>
        ))}
        {/* 중앙 남은 시간 */}
        <text
          x={CENTER}
          y={CENTER + 16}
          textAnchor="middle"
          fontSize={44}
          fill="#222"
          fontWeight="bold"
        >
          {min}:{sec}
        </text>
      </svg>
      {/* 시간 입력 및 컨트롤 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '12px 0 18px 0',
        background: '#f4f4f4',
        borderRadius: 16,
        padding: '8px 16px'
      }}>
        <input
          type="number"
          name="minutes"
          min={0}
          max={999}
          value={inputMinutes}
          onChange={handleInputChange}
          style={{
            width: 48,
            fontSize: 20,
            border: 'none',
            background: 'transparent',
            textAlign: 'right',
            outline: 'none',
            color: '#222',
            fontWeight: 'bold'
          }}
        />
        <span style={{ fontSize: 18, color: '#888' }}>분</span>
        <input
          type="number"
          name="seconds"
          min={0}
          max={59}
          value={inputSeconds}
          onChange={handleInputChange}
          style={{
            width: 48,
            fontSize: 20,
            border: 'none',
            background: 'transparent',
            textAlign: 'right',
            outline: 'none',
            color: '#222',
            fontWeight: 'bold'
          }}
        />
        <span style={{ fontSize: 18, color: '#888' }}>초</span>
        <button
          onClick={handleSetTime}
          style={{
            background: '#fff',
            border: '1.5px solid #bbb',
            borderRadius: 12,
            padding: '4px 14px',
            fontSize: 16,
            color: '#333',
            cursor: 'pointer',
            marginLeft: 8
          }}
        >
          설정
        </button>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
        <button
          onClick={handleStartPause}
          style={{
            background: isRunning ? '#d32f2f' : '#fff',
            color: isRunning ? '#fff' : '#d32f2f',
            border: `2px solid #d32f2f`,
            borderRadius: 20,
            fontSize: 22,
            fontWeight: 'bold',
            padding: '6px 32px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isRunning ? '일시정지' : '시작'}
        </button>
        <button
          onClick={handleReset}
          style={{
            background: '#fff',
            color: '#888',
            border: '2px solid #bbb',
            borderRadius: 20,
            fontSize: 18,
            fontWeight: 'bold',
            padding: '6px 24px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          리셋
        </button>
      </div>
      <div style={{ color: '#888', fontSize: 16, marginTop: 2 }}>
        전체: {totalMin}:{totalSec}
      </div>
    </div>
  );
}

export default StretchingTimer; 