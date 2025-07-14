import { useState, useEffect } from 'react';
import timerService from '../services/timerService';

export const useTimer = () => {
  const [timerState, setTimerState] = useState(timerService.getState());

  useEffect(() => {
    // 타이머 서비스 구독
    const unsubscribe = timerService.subscribe((state) => {
      setTimerState(state);
    });

    // 컴포넌트 언마운트 시 구독 해제
    return unsubscribe;
  }, []);

  return {
    ...timerState,
    setTime: timerService.setTime.bind(timerService),
    toggle: timerService.toggle.bind(timerService),
    start: timerService.start.bind(timerService),
    pause: timerService.pause.bind(timerService),
    reset: timerService.reset.bind(timerService),
    getFormattedTime: timerService.getFormattedTime.bind(timerService),
    getFormattedDuration: timerService.getFormattedDuration.bind(timerService),
    isCompleted: timerService.isCompleted.bind(timerService)
  };
}; 