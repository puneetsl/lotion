const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Listen for messages from main process
  onMessage: (callback) => ipcRenderer.on('message', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Window controls for custom title bar
  minimize: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Navigation
  goBack: () => ipcRenderer.invoke('navigation-back'),
  goForward: () => ipcRenderer.invoke('navigation-forward'),
  refresh: () => ipcRenderer.invoke('navigation-refresh'),

  // Spell check dictionary selection
  setDictionary: (dictionary) => ipcRenderer.invoke('set-dictionary', dictionary)
});

// Log when preload script is loaded
console.log('✅ Preload script loaded successfully');