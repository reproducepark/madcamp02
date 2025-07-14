import React from 'react';
import '../../styles/GanttChart.css';

function getWeekDays(baseDateStr) {
  const base = new Date(baseDateStr);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return {
      label: `${dayNames[d.getDay()]}(${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')})`,
      date: d.toISOString().slice(0, 10),
      time: d.getTime(),
    };
  });
}

export default function ScrumGanttChart({ goals, baseDate = '2024-07-14' }) {
  const weekDays = getWeekDays(baseDate);
  const weekStart = weekDays[0].time;
  const weekEnd = weekDays[6].time;

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        {weekDays.map(day => <div key={day.date} className="gantt-cell header">{day.label}</div>)}
      </div>
      {goals.map((goal, idx) => {
        const rawStart = goal.start_date ? new Date(goal.start_date).getTime() : null;
        const rawEnd = new Date(goal.real_end_date || goal.planned_end_date).getTime();
        if (rawStart === null || isNaN(rawEnd)) return null;
        // 주 범위와 겹치는 경우만 표시
        if (rawEnd < weekStart || rawStart > weekEnd) return null;
        // 주 범위 내로 clamp
        const clampedStart = Math.max(rawStart, weekStart);
        const clampedEnd = Math.min(rawEnd, weekEnd);
        const startIdx = weekDays.findIndex(wd => wd.time === clampedStart);
        const endIdx = weekDays.findIndex(wd => wd.time === clampedEnd);
        // bar width 계산
        const total = weekDays.length;
        const barLeft = `${(startIdx / total) * 100}%`;
        const barWidth = `${((endIdx - startIdx + 1) / total) * 100}%`;
        
        // 완료된 목표인지 확인
        const isCompleted = goal.real_end_date !== null;
        
        return (
          <div className="gantt-row" key={goal.id || idx}>
            {weekDays.map((_, i) => (
              <div key={i} className="gantt-cell" />
            ))}
            {/* bar를 한 번만 absolute로 렌더링 */}
            {startIdx >= 0 && endIdx >= startIdx && (
              <div
                className={`gantt-bar ${isCompleted ? 'completed' : ''}`}
                style={{ left: barLeft, width: barWidth }}
              >
                <span className="gantt-bar-label">{goal.content}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 