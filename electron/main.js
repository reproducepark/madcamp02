const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let overlayWindow;

const isDev = !app.isPackaged;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,  // 16:10 비율에 맞는 크기
        height: 800,  // 1280 * (10/16) = 800
        show: true,
        resizable: true, // 창 크기 조정 허용
        minWidth: 960,   // 최소 너비 (16:10 비율)
        minHeight: 600,  // 최소 높이 (960 * (10/16) = 600)
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

    // 16:10 비율 강제 유지
    mainWindow.on('resize', () => {
        const [width, height] = mainWindow.getSize();
        const targetHeight = Math.round(width * (10/16));
        
        if (height !== targetHeight) {
            mainWindow.setSize(width, targetHeight, false);
        }
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

function createOverlayWindow() {
    console.log('Main: createOverlayWindow 호출됨');
    
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        console.log('Main: 기존 오버레이 창에 포커스');
        overlayWindow.focus();
        return;
    }

    console.log('Main: 새로운 오버레이 창 생성 시작');
    
    overlayWindow = new BrowserWindow({
        width: 150,
        height: 150,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: true,
        minimizable: false,
        maximizable: false,
        closable: true,
        focusable: false,
        center: false, // center 대신 수동으로 위치 설정
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            enableRemoteModule: false,
            webSecurity: true,
        }
    });

    const overlayURL = isDev
        ? "http://localhost:5173/overlay"
        : `file://${path.join(__dirname, "../frontend/dist/overlay.html")}`;

    overlayWindow.loadURL(overlayURL).catch((err) => {
        console.error("Failed to load overlay URL:", err);
    });

    overlayWindow.once('ready-to-show', () => {
        // 저장된 위치가 있으면 사용, 없으면 중앙에 배치
        overlayWindow.webContents.executeJavaScript(`
            (() => {
                try {
                    const saved = localStorage.getItem('overlayPosition');
                    const parsed = saved ? JSON.parse(saved) : null;
                    return parsed;
                } catch (error) {
                    console.warn('저장된 위치 로드 실패:', error);
                    return null;
                }
            })()
        `).then((savedPosition) => {
            if (savedPosition && savedPosition.x !== undefined && savedPosition.y !== undefined) {
                overlayWindow.setPosition(savedPosition.x, savedPosition.y);
            } else {
                overlayWindow.center();
            }
            overlayWindow.show();
        }).catch((error) => {
            console.error('위치 로드 실패, 중앙에 배치:', error);
            overlayWindow.center();
            overlayWindow.show();
        });
    });

    // 창이 이동될 때 위치 저장
    overlayWindow.on('moved', () => {
        const position = overlayWindow.getPosition();
        overlayWindow.webContents.send('overlay-position-changed', position);
    });

    // 창이 닫히기 전에 현재 위치 저장
    overlayWindow.on('close', () => {
        const position = overlayWindow.getPosition();
        overlayWindow.webContents.send('overlay-position-changed', position);
    });

    overlayWindow.on('closed', () => {
        console.log('Main: 오버레이 창이 닫힘');
        overlayWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('overlay-window-closed');
        }
    });

    if (isDev) {
        overlayWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

function closeOverlayWindow() {
    console.log('Main: closeOverlayWindow 호출됨');
    
    if (overlayWindow && !overlayWindow.isDestroyed()) {
        console.log('Main: 오버레이 창 닫기 시도');
        overlayWindow.close();
        overlayWindow = null;
        console.log('Main: 오버레이 창 닫기 완료');
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
    return true;
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

// 타이머 상태 브로드캐스트
ipcMain.handle('broadcast-timer-state', (event, state) => {
    // 이벤트를 발생시킨 창을 제외하고 다른 창들에게 상태 전송
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow !== senderWindow) {
        overlayWindow.webContents.send('timer-state-updated', state);
    }
    
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow !== senderWindow) {
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
