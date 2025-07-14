const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

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

// IPC 핸들러 등록
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
