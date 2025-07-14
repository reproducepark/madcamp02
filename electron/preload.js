const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, callback) => ipcRenderer.on(channel, (event, args) => callback(args)),
});

contextBridge.exposeInMainWorld('electronAPI', {
    openOverlayWindow: () => ipcRenderer.invoke('open-overlay-window'),
    closeOverlayWindow: () => ipcRenderer.invoke('close-overlay-window'),
    getTimerState: () => ipcRenderer.invoke('get-timer-state'),
    broadcastTimerState: (state) => ipcRenderer.invoke('broadcast-timer-state', state),
    onTimerStateUpdated: (callback) => {
        const handler = (event, state) => callback(state);
        ipcRenderer.on('timer-state-updated', handler);
        return () => ipcRenderer.removeListener('timer-state-updated', handler);
    },
    onOverlayWindowClosed: (callback) => {
        const handler = (event) => callback();
        ipcRenderer.on('overlay-window-closed', handler);
        return () => ipcRenderer.removeListener('overlay-window-closed', handler);
    },
    closeCurrentWindow: () => ipcRenderer.invoke('close-current-window'),
});
