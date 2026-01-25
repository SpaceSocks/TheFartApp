const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),
  onQuickFart: (callback) => ipcRenderer.on('quick-fart', callback),
  getSoundFiles: () => ipcRenderer.invoke('get-sound-files'),
});
