const { contextBridge, ipcRenderer } = require('electron');

// Expose tab bar API to renderer process
contextBridge.exposeInMainWorld('tabBarAPI', {
  // Get initial tab state
  getInitialState: () => ipcRenderer.invoke('tab-bar:get-initial-state'),

  // Tab operations
  createTab: (options) => ipcRenderer.invoke('tab-bar:create-tab', options),
  closeTab: (tabId) => ipcRenderer.invoke('tab-bar:close-tab', tabId),
  switchTab: (tabId) => ipcRenderer.invoke('tab-bar:switch-tab', tabId),
  reorderTabs: (windowId, tabIds) => ipcRenderer.invoke('tab-bar:reorder-tabs', { windowId, tabIds }),
  pinTab: (tabId) => ipcRenderer.invoke('tab-bar:pin-tab', tabId),
  unpinTab: (tabId) => ipcRenderer.invoke('tab-bar:unpin-tab', tabId),

  // Listen for tab state changes from main process
  onTabsUpdated: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('tab-bar:tabs-updated', listener);
    return () => ipcRenderer.removeListener('tab-bar:tabs-updated', listener);
  },

  onTabActivated: (callback) => {
    const listener = (event, tabId) => callback(tabId);
    ipcRenderer.on('tab-bar:tab-activated', listener);
    return () => ipcRenderer.removeListener('tab-bar:tab-activated', listener);
  },
});
