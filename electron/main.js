const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let overlayWindow;

const isDev = !app.isPackaged;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,  // Enables sandbox for better security
            enableRemoteModule: false,  // Prevents unnecessary remote access
            webSecurity: true,  // Enforces security policies
        },
    });

   const startURL = isDev
        ? "http://localhost:5173"
        : `file://${path.join(__dirname, "../frontend/dist/index.html")}`;

    mainWindow.loadURL(startURL).catch((err) => {
        console.error("Failed to load URL:", err);
    });
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus(); // 👈 창을 강제로 포커스
    });

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

function createOverlayWindow() {
    console.log('Main: createOverlayWindow 호출됨');
    console.log('Main: 기존 overlayWindow 존재 여부:', !!overlayWindow);
    
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        console.log('Main: 기존 오버레이 창에 포커스');
        overlayWindow.focus();
        return;
    }

    console.log('Main: 새로운 오버레이 창 생성 시작');
    overlayWindow = new BrowserWindow({
        width: 200,
        height: 200,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: true,
        minimizable: false,
        maximizable: false,
        closable: true, // 닫기 가능하도록 변경
        focusable: false,
        center: true,
        backgroundColor: '#00000000', // 완전 투명 배경
        hasShadow: false, // 창 그림자 제거
        opacity: 1.0, // 완전 불투명 (내용만)
        titleBarStyle: 'hidden', // 맥 전용: 타이틀바 숨김
        vibrancy: 'under-window', // 맥 전용: 비브랜시 효과
        visualEffectState: 'active', // 맥 전용: 비주얼 효과 활성화
        show: false, // 처음에는 숨김
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            enableRemoteModule: false,
            webSecurity: true,
        },
    });
    console.log('Main: 새로운 오버레이 창 생성 완료, ID:', overlayWindow.id);

    const overlayURL = isDev
        ? "http://localhost:5173/overlay"
        : `file://${path.join(__dirname, "../frontend/dist/overlay.html")}`;

    overlayWindow.loadURL(overlayURL).catch((err) => {
        console.error("Failed to load overlay URL:", err);
    });

    // 창이 준비되면 화면 중앙에 위치하고 투명화 설정
    overlayWindow.once('ready-to-show', () => {
        overlayWindow.center();
        // 추가 투명화 설정
        overlayWindow.setBackgroundColor('#00000000');
        
        // 맥 전용 추가 설정
        if (process.platform === 'darwin') {
            overlayWindow.setVibrancy('under-window');
            overlayWindow.setVisualEffectState('active');
            console.log('Main: 맥 전용 투명화 설정 완료');
        }
        
        // 창을 보이게 함
        overlayWindow.show();
        console.log('Main: 오버레이 창 투명화 설정 완료');
    });

    // ESC 키로 창 닫기
    overlayWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape') {
            console.log('Main: ESC 키로 오버레이 창 닫기');
            overlayWindow.close();
        }
    });

    // 창이 닫힐 때 변수 정리 및 메인 창에 알림
    overlayWindow.on('closed', () => {
        console.log('Main: 오버레이 창이 닫힘');
        overlayWindow = null;
        // 메인 창에 오버레이가 닫혔음을 알림
        if (mainWindow && !mainWindow.isDestroyed()) {
            console.log('Main: 메인 창에 오버레이 닫힘 알림 전송');
            mainWindow.webContents.send('overlay-window-closed');
        }
    });

    // 개발 모드에서는 DevTools를 별도 창으로 열기
    if (isDev) {
        overlayWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

function closeOverlayWindow() {
    console.log('Main: closeOverlayWindow 호출됨');
    console.log('Main: overlayWindow 존재 여부:', !!overlayWindow);
    console.log('Main: overlayWindow destroyed 여부:', overlayWindow ? overlayWindow.isDestroyed() : 'N/A');
    
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        console.log('Main: 오버레이 창 닫기 시도');
        try {
            overlayWindow.close();
            console.log('Main: overlayWindow.close() 호출 완료');
            overlayWindow = null;
            console.log('Main: 오버레이 창 닫기 완료');
        } catch (error) {
            console.error('Main: 오버레이 창 닫기 중 오류:', error);
        }
    } else {
        console.log('Main: 닫을 오버레이 창이 없거나 이미 파괴됨');
    }
}

// IPC 핸들러 등록
ipcMain.handle('open-overlay-window', () => {
    console.log('Main: open-overlay-window IPC 호출됨');
    createOverlayWindow();
});

ipcMain.handle('close-overlay-window', () => {
    console.log('Main: close-overlay-window IPC 호출됨');
    closeOverlayWindow();
    return true; // 성공 응답 반환
});

ipcMain.handle('close-current-window', (event) => {
    console.log('Main: close-current-window IPC 호출됨');
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        console.log('Main: 현재 창 닫기 시도');
        window.close();
        return true;
    }
    return false;
});

// 타이머 상태 동기화를 위한 IPC 핸들러
ipcMain.handle('get-timer-state', () => {
    // 메인 창에서 타이머 상태를 가져와서 오버레이 창에 전달
    if (mainWindow && !mainWindow.isDestroyed()) {
        return mainWindow.webContents.executeJavaScript(`
            window.timerService ? window.timerService.getState() : null
        `);
    }
    return null;
});

// 타이머 상태 변경을 모든 창에 브로드캐스트
ipcMain.handle('broadcast-timer-state', (event, state) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('timer-state-updated', state);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer-state-updated', state);
    }
});

app.on("ready", createMainWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
