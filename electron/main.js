const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// dotenv를 사용하여 .env 파일 로드
require('dotenv').config();

// Google GenAI 라이브러리 추가
const { GoogleGenAI } = require("@google/genai");

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

// Google GenAI 클라이언트 초기화
let ai = null;
const initializeGenAI = () => {
  if (ai) return ai;
  
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
      throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    ai = new GoogleGenAI(GEMINI_API_KEY);
    console.log('✅ Google GenAI 클라이언트 초기화 성공 (메인 프로세스)');
    return ai;
  } catch (error) {
    console.error('❌ Google GenAI 클라이언트 초기화 실패 (메인 프로세스):', error);
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
        minWidth: 960,   // 최소 너비 (16:10 비율)
        minHeight: 600,  // 최소 높이 (960 * (10/16) = 600)
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
ipcMain.handle('llm-generate-text', async (event, prompt, history = [], options = {}) => {
    try {
        console.log('Main: LLM API 호출 시작');
        
        // API 키가 없으면 에러
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_actual_api_key_here') {
            throw new Error('API 키가 설정되지 않았습니다. .env 파일에서 VITE_GEMINI_API_KEY를 설정해주세요.');
        }
        
        // GenAI 클라이언트 초기화
        const genAI = initializeGenAI();
        
        // 히스토리가 있으면 프롬프트에 포함
        let fullPrompt = prompt;
        if (history.length > 0) {
            const historyText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
            fullPrompt = `${historyText}\n\n현재 요청: ${prompt}`;
        }
        
        // API 키를 명시적으로 설정하여 호출
        const response = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: fullPrompt,
            config: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxOutputTokens || 2048,
                topP: options.topP || 0.8,
                topK: options.topK || 40,
                thinkingConfig: {
                    thinkingBudget: 0, // Disables thinking for faster response
                },
            }
        });
        
        console.log('Main: LLM API 호출 성공');
        return {
            success: true,
            data: response,
            text: response.text,
            status: 200
        };
    } catch (error) {
        console.error('Main: LLM API 호출 실패:', error);
        return {
            success: false,
            message: `LLM API 오류: ${error.message}`,
            error: error
        };
    }
});

// 프로젝트 보고서 생성 핸들러
ipcMain.handle('llm-generate-project-report', async (event, projectData) => {
    try {
        console.log('Main: 프로젝트 보고서 생성 시작');
        
        const PROJECT_REPORT_SYSTEM_PROMPT = `당신은 주어진 JSON 데이터를 바탕으로 프로젝트 진행 상황 보고서를 생성하는 AI 어시스턴트입니다.

당신의 임무는 프로젝트 주제, 팀 체크리스트, 그리고 익명으로 제공된 여러 구성원의 체크리스트를 처리하여 보고서를 생성하는 것입니다.

생성된 보고서는 아래의 세 가지 섹션으로 엄격하게 구성되어야 합니다:
- 어제까지 한 일
- 오늘 할 일  
- 궁금한/필요한/알아낸 것

보고서 생성 시 다음 규칙을 반드시 준수해야 합니다:

구조: 위에 명시된 세 가지 섹션 구조를 반드시 따라야 함.
언어: 보고서는 반드시 한국어로 작성해야 함.
작성 스타일: 답변은 '~합니다'와 같은 서술형 문장이 아닌, 'ㅇㅇ 완료', 'ㅁㅁ 필요' 와 같이 명사형으로 간결하게 마무리해야 함.

업무 취합:
"어제까지 한 일": "team_checklist"와 "member_checklists"에 있는 모든 "completed" 필드의 작업을 취합하여 목록으로 작성.
"오늘 할 일": 모든 "incomplete" 필드의 작업을 취합하여 목록으로 작성. 더불어, 개별 멤버에게 작업을 할당하지 말고, 팀 전체의 통합된 업무 목록으로 제시해야 함. 만약 없다면 최대 3개의 업무를 기존 완료한 것들을 바탕으로 제시해야 함.

'궁금한/필요한/알아낸 것' 섹션:
"inquiries" 필드의 정보를 사용하여 이 섹션을 작성함. 만약 "inquiries" 필드가 비어 있다면, "project_topic"을 참고하여 팀에 도움이 될 만한 관련 사항을 생성해야 함. 입력값에 URL이나 참조 링크가 포함된 경우, 해당 내용을 요약하되 URL 자체는 결과물에 포함하지 않아야 함.

빈 필드 처리: 만약 특정 섹션에 해당하는 입력 체크리스트가 비어 있다면, 해당 출력 섹션도 비워두어야 함.`;
        
        const prompt = `${PROJECT_REPORT_SYSTEM_PROMPT}

다음 JSON 데이터를 바탕으로 프로젝트 진행 상황 보고서를 생성해주세요:

${JSON.stringify(projectData, null, 2)}

위 데이터를 분석하여 세 가지 섹션으로 구성된 보고서를 생성해주세요.`;
        
        const genAI = initializeGenAI();
        const response = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                topP: 0.8,
                topK: 40,
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            }
        });
        
        console.log('Main: 프로젝트 보고서 생성 성공');
        return {
            success: true,
            report: response.text,
            rawResponse: response
        };
    } catch (error) {
        console.error('Main: 프로젝트 보고서 생성 실패:', error);
        return {
            success: false,
            error: error.message,
            rawResponse: error
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
