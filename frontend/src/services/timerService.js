class TimerService {
  constructor() {
    // localStorage에서 저장된 상태 복원
    const savedState = this.loadState();
    if (savedState) {
      this.duration = savedState.duration;
      this.remaining = savedState.remaining;
      this.isRunning = false; // 페이지 이동 시에는 항상 중지 상태
    } else {
      this.duration = 600; // 기본 10분
      this.remaining = 600;
    }
    this.isRunning = false;
    this.intervalId = null;
    this.callbacks = new Set();
  }

  // 상태를 localStorage에 저장
  saveState() {
    try {
      localStorage.setItem('timerState', JSON.stringify({
        duration: this.duration,
        remaining: this.remaining
      }));
    } catch (error) {
      console.warn('타이머 상태 저장 실패:', error);
    }
  }

  // localStorage에서 상태 복원
  loadState() {
    try {
      const saved = localStorage.getItem('timerState');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('타이머 상태 복원 실패:', error);
      return null;
    }
  }

  // 콜백 등록
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // 모든 콜백 호출
  notify() {
    this.callbacks.forEach(callback => {
      callback({
        duration: this.duration,
        remaining: this.remaining,
        isRunning: this.isRunning
      });
    });
  }

  // 시간 설정
  setTime(minutes, seconds) {
    const total = minutes * 60 + seconds;
    if (total > 0) {
      this.duration = total;
      this.remaining = total;
      this.stop();
      this.saveState();
      this.notify();
    }
  }

  // 타이머 시작/일시정지
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  // 타이머 시작
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      if (this.remaining <= 1) {
        this.stop();
        this.remaining = 0;
        this.saveState();
      } else {
        this.remaining--;
        this.saveState();
      }
      this.notify();
    }, 1000);
    
    this.notify();
  }

  // 타이머 일시정지
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.saveState();
    this.notify();
  }

  // 타이머 정지
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.saveState();
  }

  // 타이머 리셋
  reset() {
    this.remaining = this.duration;
    this.stop();
    this.saveState();
    this.notify();
  }

  // 현재 상태 가져오기
  getState() {
    return {
      duration: this.duration,
      remaining: this.remaining,
      isRunning: this.isRunning
    };
  }

  // 타이머 완료 여부
  isCompleted() {
    return this.remaining === 0;
  }

  // 남은 시간을 분:초 형식으로 반환
  getFormattedTime() {
    const minutes = Math.floor(this.remaining / 60);
    const seconds = this.remaining % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  }

  // 전체 시간을 분:초 형식으로 반환
  getFormattedDuration() {
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  }
}

// 싱글톤 인스턴스 생성
const timerService = new TimerService();

export default timerService; 