import React, { useState, useEffect, useRef } from 'react';
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
  const chartRef = useRef(null);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const updateFontSize = () => {
      if (chartRef.current) {
        const width = chartRef.current.offsetWidth;
        // Adjust font size based on width. These are example values.
        if (width < 500) {
          setFontSize(10);
        } else if (width < 800) {
          setFontSize(12);
        } else {
          setFontSize(14);
        }
      }
    };

    window.addEventListener('resize', updateFontSize);
    updateFontSize(); // Initial call

    return () => window.removeEventListener('resize', updateFontSize);
  }, []);

  const weekDays = getWeekDays(baseDate);
  const weekStart = weekDays[0].time;
  const weekEnd = new Date(weekDays[6].time).setHours(23, 59, 59, 999);

  const sortedGoals = [...goals].sort((a, b) => {
    const aStart = new Date(a.start_date);
    const bStart = new Date(b.start_date);
    if (aStart.getTime() !== bStart.getTime()) {
      return aStart - bStart;
    }
    const aIsCompleted = a.real_end_date !== null;
    const bIsCompleted = b.real_end_date !== null;
    const aEnd = new Date(aIsCompleted ? a.real_end_date : a.planned_end_date);
    const bEnd = new Date(bIsCompleted ? b.real_end_date : b.planned_end_date);
    if (aEnd.getTime() !== bEnd.getTime()) {
      return aEnd - bEnd;
    }
    return (a.id || 0) - (b.id || 0);
  });

  return (
    <div className="gantt-chart" ref={chartRef} style={{ fontSize: `${fontSize}px` }}>
      <div className="gantt-header">
        {weekDays.map(day => <div key={day.date} className="gantt-cell header">{day.label}</div>)}
      </div>
      {sortedGoals.map((goal, idx) => {
        const isCompleted = goal.real_end_date !== null;
        
        const startDate = new Date(goal.start_date);
        startDate.setHours(0,0,0,0);
        const rawStart = startDate.getTime();

        let rawEnd;
        if (isCompleted) {
            const realEndDate = new Date(goal.real_end_date);
            realEndDate.setHours(23, 59, 59, 999);
            rawEnd = realEndDate.getTime();
        } else {
            const plannedEndDate = new Date(goal.planned_end_date);
            plannedEndDate.setHours(23, 59, 59, 999);
            rawEnd = plannedEndDate.getTime();
        }

        if (rawStart === null || isNaN(rawEnd)) return null;
        if (rawEnd < weekStart || rawStart > weekEnd) return null;

        const clampedStart = Math.max(rawStart, weekStart);
        const clampedEnd = Math.min(rawEnd, weekEnd);

        const startIdx = weekDays.findIndex(wd => wd.time >= clampedStart);
        const reverseIdx = weekDays.slice().reverse().findIndex(wd => wd.time <= clampedEnd);
        const endIdx = reverseIdx >= 0 ? weekDays.length - 1 - reverseIdx : weekDays.length - 1;

        if (startIdx < 0 || endIdx < startIdx) return null;

        const barLeft = `${(startIdx / weekDays.length) * 100}%`;
        const barWidth = `${((endIdx - startIdx + 1) / weekDays.length) * 100}%`;

        return (
          <div className="gantt-row" key={goal.id || idx}>
            {weekDays.map((_, i) => <div key={i} className="gantt-cell" />)}
            <div
              className={`gantt-bar ${isCompleted ? 'completed' : ''}`}
              style={{ left: barLeft, width: barWidth }}
            >
              <span className="gantt-bar-label">{goal.content}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}