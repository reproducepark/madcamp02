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

export default function GanttChart({ goals, baseDate = '2024-07-14' }) {
  const weekDays = getWeekDays(baseDate);
  const weekStart = weekDays[0].time;
  const weekEnd = weekDays[6].time;
  const outerRadius = 10;
  const borderWidth = 2;
  const innerRadius = outerRadius - borderWidth;

  const sortedGoals = [...goals].sort((a, b) => {
    const aStart = new Date(a.start_date);
    const bStart = new Date(b.start_date);
    if (aStart.getTime() !== bStart.getTime()) return aStart - bStart;

    const aIsCompleted = a.real_end_date !== null;
    const bIsCompleted = b.real_end_date !== null;
    const aEnd = new Date(aIsCompleted ? a.real_end_date : a.planned_end_date);
    const bEnd = new Date(bIsCompleted ? b.real_end_date : b.planned_end_date);
    if (aEnd.getTime() !== bEnd.getTime()) return aEnd - bEnd;

    return (a.id || 0) - (b.id || 0);
  });

  return (
    <div className="gantt-chart">
      <div className="gantt-header">
        {weekDays.map(day => <div key={day.date} className="gantt-cell header">{day.label}</div>)}
      </div>
      {sortedGoals.map((goal, idx) => {
        const isCompleted = goal.progress === 1 && goal.real_end_date;

        const rawStart = new Date(goal.start_date).getTime();
        const rawEnd = new Date(isCompleted ? goal.real_end_date : goal.planned_end_date).getTime();

        if (isNaN(rawStart) || isNaN(rawEnd)) return null;
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
              {!isCompleted && (
                <div
                  className="gantt-bar-progress"
                  style={{
                    width: `${Math.round((goal.progress ?? 0) * 100)}%`,
                    borderRadius: (goal.progress === 1)
                      ? `${innerRadius}px`
                      : `${innerRadius}px 0 0 ${innerRadius}px`
                  }}
                />
              )}
              <span className="gantt-bar-label">{goal.content}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}