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
    
    // Electron 환경에서 다른 창의 상태 변경을 감지
    this.setupElectronSync();
  }

  // Electron 환경에서 상태 동기화 설정
  setupElectronSync() {
    if (window.electronAPI && window.electronAPI.onTimerStateUpdated) {
      try {
        window.electronAPI.onTimerStateUpdated((state) => {
          console.log('TimerService: 다른 창에서 상태 업데이트 수신', state);
          // 다른 창에서 온 상태로 동기화
          this.syncState(state);
        });
      } catch (error) {
        console.warn('Electron 동기화 설정 실패:', error);
      }
    }
  }

  // 외부 상태로 동기화 (다른 창에서 온 상태)
  syncState(externalState) {
    const wasRunning = this.isRunning;
    
    // 상태 업데이트
    this.duration = externalState.duration;
    this.remaining = externalState.remaining;
    
    // isRunning 상태는 마지막으로 동기화 (아래 로직에 영향)
    const newIsRunning = externalState.isRunning;

    // 실행 상태가 변경된 경우 interval 관리
    // A창에서 start -> B창으로 전파 -> B창에서 startInterval() 호출 (문제 발생)
    // 이젠 수신측에서는 interval을 직접 제어하지 않음.
    // 시작/중지 액션은 항상 사용자의 직접적인 입력(toggle, start, pause)에서 시작되어야 함
    if (wasRunning && !newIsRunning) {
      // 다른 창에서 타이머가 '중지'된 경우, 이 창의 interval도 확실히 제거
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    } else if (!wasRunning && newIsRunning) {
      // 다른 창에서 타이머가 '시작'된 경우, 이 창은 interval을 시작하지 않음
      // 대신 상태가 계속 동기화되므로 시각적으로 업데이트됨
      // 만약 로컬 interval이 돌고 있었다면(엣지 케이스), 확실히 제거
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
    
    // isRunning 상태를 마지막에 설정
    this.isRunning = newIsRunning;
    
    // 로컬 상태 저장
    this.saveState();
    
    // 구독자들에게 알림 (무한 루프 방지를 위해 외부 상태와 동일한 경우만)
    this.notify(false); // false = 브로드캐스트하지 않음
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
  notify(broadcast = true) {
    const state = {
      duration: this.duration,
      remaining: this.remaining,
      isRunning: this.isRunning
    };
    console.log('TimerService: 상태 알림', state, '구독자 수:', this.callbacks.size);
    this.callbacks.forEach(callback => {
      callback(state);
    });
    
    // Electron 환경에서 다른 창에 상태 브로드캐스트 (broadcast가 true인 경우만)
    if (broadcast && window.electronAPI && window.electronAPI.broadcastTimerState) {
      window.electronAPI.broadcastTimerState(state);
    }
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
    console.log('TimerService: toggle 호출, 현재 상태:', this.isRunning);
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  // 타이머 시작
  start() {
    if (this.isRunning) return;
    
    console.log('TimerService: 타이머 시작');
    this.isRunning = true;
    this.startInterval();
    this.notify();
  }

  // interval 시작 (별도 메서드로 분리)
  startInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
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
  }

  // 타이머 일시정지
  pause() {
    if (!this.isRunning) return;
    
    console.log('TimerService: 타이머 일시정지');
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
    console.log('TimerService: 타이머 정지');
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

// Electron 환경에서 전역으로 노출
if (typeof window !== 'undefined') {
  window.timerService = timerService;
}

export default timerService; 