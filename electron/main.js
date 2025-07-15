const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// dotenv를 사용하여 .env 파일 로드
require('dotenv').config();

const iconPath = path.resolve(__dirname, "../frontend/src/assets/icon_1024.png");
console.log('Icon path:', iconPath);
console.log('Icon file exists:', fs.existsSync(iconPath));

let mainWindow;
let overlayWindow;

const isDev = !app.isPackaged;

// 환경 변수에서 API 키 가져오기
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('🔑 환경 변수 확인:');
console.log('process.env.VITE_GEMINI_API_KEY exists:', !!process.env.VITE_GEMINI_API_KEY);
console.log('process.env.VITE_GEMINI_API_KEY length:', process.env.VITE_GEMINI_API_KEY ? process.env.VITE_GEMINI_API_KEY.length : 0);
console.log('process.env keys:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('VITE')));

// Gemini API 직접 호출 함수
const callGeminiAPI = async (prompt, options = {}) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_actual_api_key_here') {
      throw new Error('API 키가 설정되지 않았습니다. .env 파일에서 VITE_GEMINI_API_KEY를 설정해주세요.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxOutputTokens || 2048,
        topP: options.topP || 0.8,
        topK: options.topK || 40
      }
    };

    console.log('📡 Gemini API 직접 호출 시작');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API 오류: ${data.error.message}`);
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
    }

    console.log('✅ Gemini API 직접 호출 성공');
    return {
      success: true,
      text: generatedText,
      data: data
    };
  } catch (error) {
    console.error('❌ Gemini API 직접 호출 실패:', error);
    throw error;
  }
};

// 프로덕션 환경에서 로깅 활성화
if (!isDev) {
    console.log('Production mode detected');
    console.log('App path:', app.getAppPath());
    console.log('Current directory:', __dirname);
}

function createMainWindow() {
    console.log('Creating main window...');
    
    mainWindow = new BrowserWindow({
        title: '몰입메이트',
        width: 1280,  // 16:10 비율에 맞는 크기
        height: 800,  // 1280 * (10/16) = 800
        show: true,
        resizable: true, // 창 크기 조정 허용
        minWidth: 1250,   // 최소 너비 (16:10 비율)
        minHeight: 750,  // 최소 높이 (960 * (10/16) = 600)
        icon: iconPath, // 애플리케이션 아이콘 설정
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,  // 프로덕션에서 sandbox 비활성화
            enableRemoteModule: false,  // Prevents unnecessary remote access
            webSecurity: true,  // Enforces security policies
        },
    });

    Menu.setApplicationMenu(null);

    const startURL = isDev
        ? "http://localhost:5173"
        : `file://${path.join(__dirname, "../frontend/dist/index.html")}`;

    console.log('Loading URL:', startURL);
    console.log('File path:', path.join(__dirname, "../frontend/dist/index.html"));

    mainWindow.loadURL(startURL).catch((err) => {
        console.error("Failed to load URL:", err);
    });
    
    mainWindow.once('ready-to-show', () => {
        console.log('Main window ready to show');
        mainWindow.show();
        mainWindow.focus(); // 👈 창을 강제로 포커스
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Main window finished loading');
    });

    // 16:10 비율 강제 유지
    mainWindow.on('resize', () => {
        const [width, height] = mainWindow.getSize();
        const targetHeight = Math.round(width * (10/16));
        
        if (height !== targetHeight) {
            mainWindow.setSize(width, targetHeight, false);
        }
    });

    // 개발자 도구 열기 (개발/프로덕션 모두)
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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
        icon: iconPath, // 오버레이 윈도우 아이콘 설정
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,  // 프로덕션에서 sandbox 비활성화
            enableRemoteModule: false,
            webSecurity: true,
        }
    });

    const overlayURL = isDev
        ? "http://localhost:5173/overlay"
        : `file://${path.join(__dirname, "../frontend/dist/overlay.html")}`;

    console.log('Loading overlay URL:', overlayURL);

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

// LLM API 호출 핸들러
ipcMain.handle('llm-generate-text', async (event, prompt, history, options) => {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      message: 'Gemini API 키가 설정되지 않았습니다.',
      error: 'API_KEY_NOT_SET'
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // 이력을 기반으로 콘텐츠 구성
    const contents = history.map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user', // 'assistant'를 'model'로 변경
      parts: [{ text: item.content }]
    }));
    
    // 현재 프롬프트를 사용자 메시지로 추가
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const requestBody = {
      // 시스템 프롬프트와 사용자 프롬프트를 분리합니다.
      // SCRUM_GENERATION_SYSTEM_PROMPT를 system_instruction으로 사용합니다.
      // 참고: 이 핸들러는 현재 스크럼 생성에만 사용되므로,
      // 다른 종류의 텍스트 생성이 필요할 경우 수정이 필요할 수 있습니다.
      system_instruction: {
        parts: [{ text: SCRUM_GENERATION_SYSTEM_PROMPT }]
      },
      contents: contents.slice(contents.length - 1), // 마지막 사용자 프롬프트만 사용
      generationConfig: {
        temperature: options.temperature || 0.4,
        maxOutputTokens: options.maxOutputTokens || 4096,
        // 기타 설정은 기본값 사용
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API 오류: ${data.error.message}`);
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
    }

    console.log('✅ Gemini API 직접 호출 성공');
    return {
      success: true,
      data: data,
      text: generatedText,
      status: 200
    };
  } catch (error) {
    console.error('❌ Gemini API 직접 호출 실패:', error);
    return {
      success: false,
      message: `LLM API 오류: ${error.message}`,
      error: error
    };
  }
});

app.on("ready", () => {
    // macOS에서 독 아이콘 설정
    if (process.platform === 'darwin') {
        // 독 아이콘 설정 시도
        try {
            app.dock.setIcon(iconPath);
            console.log('Dock icon set successfully');
        } catch (error) {
            console.error('Failed to set dock icon:', error);
        }
        
        // 독 아이콘 숨기기/보이기로 새로고침 시도
        setTimeout(() => {
            try {
                app.dock.hide();
                setTimeout(() => {
                    app.dock.show();
                }, 100);
            } catch (error) {
                console.error('Failed to refresh dock:', error);
            }
        }, 1000);
    }
    createMainWindow();
});

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
