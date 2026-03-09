const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadDB: () => ipcRenderer.invoke('load-db'),
  saveDB: (data) => ipcRenderer.invoke('save-db', data),
  readTextFile: () => ipcRenderer.invoke('read-text-file'),
  deleteOriginals: () => ipcRenderer.invoke('delete-originals'),
  loadSplashConfig: () => ipcRenderer.invoke('load-splash-config'),
  readSplashText: (filename) => ipcRenderer.invoke('read-splash-text', filename),
  saveImportedImage: (buffer) => ipcRenderer.invoke('save-imported-image', buffer),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  fetchCivitai: (url, apiKey) => ipcRenderer.invoke('fetch-civitai', { url, apiKey }),
  generateThumbnails: () => ipcRenderer.invoke('generate-thumbnails'),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  sendUnsavedState: (state) => ipcRenderer.send('set-unsaved-state', state),
  forceClose: () => ipcRenderer.send('force-close'),
  onPromptUnsaved: (callback) => ipcRenderer.on('prompt-unsaved', callback),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback),
});
