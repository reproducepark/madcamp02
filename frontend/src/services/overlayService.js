class OverlayService {
  constructor() {
    this.isOpen = false;
    this.callbacks = new Set();
    this.position = this.loadPosition();
  }

  // 위치 저장
  savePosition(x, y) {
    this.position = { x, y };
    try {
      localStorage.setItem('overlayPosition', JSON.stringify(this.position));
    } catch (error) {
      console.error('OverlayService: 위치 저장 실패', error);
    }
  }

  // 위치 로드
  loadPosition() {
    try {
      const saved = localStorage.getItem('overlayPosition');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('OverlayService: 저장된 위치 로드 실패:', error);
      return null;
    }
  }

  // 저장된 위치 가져오기
  getSavedPosition() {
    return this.position;
  }

  // 오버레이 열기
  async openOverlay() {
    if (this.isOpen) return;
    
    try {
      if (window.electronAPI && window.electronAPI.openOverlayWindow) {
        await window.electronAPI.openOverlayWindow();
        this.isOpen = true;
        this.notify();
      }
    } catch (error) {
      console.error('오버레이 열기 실패:', error);
    }
  }

  // 오버레이 닫기
  async closeOverlay() {
    if (!this.isOpen) return;
    
    try {
      if (window.electronAPI && window.electronAPI.closeOverlayWindow) {
        await window.electronAPI.closeOverlayWindow();
        this.isOpen = false;
        this.notify();
      }
    } catch (error) {
      console.error('오버레이 닫기 실패:', error);
    }
  }

  // 오버레이 토글
  async toggleOverlay() {
    if (this.isOpen) {
      await this.closeOverlay();
    } else {
      await this.openOverlay();
    }
  }

  // 현재 상태 가져오기
  getOverlayState() {
    return { isOpen: this.isOpen };
  }

  // 상태 변경 알림
  notify() {
    const state = { isOpen: this.isOpen };
    this.callbacks.forEach(callback => callback(state));
  }

  // 구독
  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // 오버레이 창이 닫혔을 때 호출
  onOverlayClosed() {
    this.isOpen = false;
    this.notify();
  }
}

const overlayService = new OverlayService();

// Electron 환경에서 오버레이 창이 닫혔을 때 알림 받기
if (typeof window !== 'undefined' && window.electronAPI) {
  try {
    window.electronAPI.onOverlayWindowClosed(() => {
      overlayService.onOverlayClosed();
    });
  } catch (error) {
    console.warn('오버레이 창 닫힘 이벤트 구독 실패:', error);
  }
}

export default overlayService; 