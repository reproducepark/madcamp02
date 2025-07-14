class OverlayService {
  constructor() {
    this.overlayWindow = null;
    this.isOverlayOpen = false;
    this.subscribers = [];
    
    console.log('OverlayService: 생성자 호출됨');
    console.log('OverlayService: window.electronAPI 존재 여부:', !!window.electronAPI);
    
    // Electron 환경에서 오버레이 창이 닫혔을 때의 이벤트 구독
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('OverlayService: 오버레이 창 닫힘 이벤트 구독 시작');
      window.electronAPI.onOverlayWindowClosed(() => {
        console.log('OverlayService: 오버레이 창이 닫힘');
        this.isOverlayOpen = false;
        this.notifySubscribers();
      });
    } else {
      console.warn('OverlayService: Electron API를 사용할 수 없음');
    }
  }

  // 오버레이 창 열기
  async openOverlay() {
    if (this.isOverlayOpen) {
      return;
    }

    // Electron 환경에서만 실행
    if (window.electronAPI) {
      try {
        await window.electronAPI.openOverlayWindow();
        this.isOverlayOpen = true;
        this.notifySubscribers();
      } catch (error) {
        console.error('Failed to open overlay window:', error);
      }
    } else {
      console.warn('Electron API not available');
    }
  }

  // 오버레이 창 닫기
  async closeOverlay() {
    console.log('OverlayService: closeOverlay 호출됨, 현재 상태:', this.isOverlayOpen);
    
    if (!this.isOverlayOpen) {
      console.log('OverlayService: 이미 닫혀있음');
      return;
    }

    // Electron 환경에서만 실행
    if (window.electronAPI) {
      try {
        console.log('OverlayService: Electron API로 창 닫기 시도');
        await window.electronAPI.closeOverlayWindow();
        console.log('OverlayService: 창 닫기 성공');
        this.isOverlayOpen = false;
        this.notifySubscribers();
      } catch (error) {
        console.error('OverlayService: 창 닫기 실패:', error);
      }
    } else {
      console.warn('OverlayService: Electron API not available');
    }
  }

  // 오버레이 창 토글
  toggleOverlay() {
    if (this.isOverlayOpen) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
  }

  // 오버레이 상태 확인
  getOverlayState() {
    return {
      isOpen: this.isOverlayOpen
    };
  }

  // 구독
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // 상태 변경 알림
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.getOverlayState());
    });
  }
}

const overlayService = new OverlayService();
export default overlayService; 