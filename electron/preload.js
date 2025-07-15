const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, callback) => ipcRenderer.on(channel, (event, args) => callback(args)),
});

contextBridge.exposeInMainWorld('electronAPI', {
    openOverlayWindow: () => ipcRenderer.invoke('open-overlay-window'),
    closeOverlayWindow: () => ipcRenderer.invoke('close-overlay-window'),
    closeCurrentWindow: () => ipcRenderer.invoke('close-current-window'),
    broadcastTimerState: (state) => ipcRenderer.invoke('broadcast-timer-state', state),
    onOverlayWindowClosed: (callback) => {
        const handler = (event) => callback();
        ipcRenderer.on('overlay-window-closed', handler);
        return () => ipcRenderer.removeListener('overlay-window-closed', handler);
    },
    onTimerStateUpdated: (callback) => {
        const handler = (event, state) => callback(state);
        ipcRenderer.on('timer-state-updated', handler);
        return () => ipcRenderer.removeListener('timer-state-updated', handler);
    },
    onOverlayPositionChanged: (callback) => {
        const handler = (event, position) => callback(position);
        ipcRenderer.on('overlay-position-changed', handler);
        return () => ipcRenderer.removeListener('overlay-position-changed', handler);
    },
    // LLM API 호출 함수들
    llmGenerateText: (prompt, history, options) => ipcRenderer.invoke('llm-generate-text', prompt, history, options),
});
