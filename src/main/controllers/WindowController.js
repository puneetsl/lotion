const { BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log').scope('WindowController');
const { addWindow, removeWindow, setWindowFocus, updateWindowBounds, updateWindowTitle } = require('../store/slices/windowsSlice');
const config = require('../../../config/config.json'); // Adjust path as needed

class WindowController {
  constructor({ windowId, store, initialUrl, title, bounds }) {
    this.windowId = windowId;
    this.store = store;
    this.browserWindow = null;
    this.initialUrl = initialUrl || config.domainBaseUrl;
    this.initialTitle = title || 'Lotion';
    this.initialBounds = bounds || { width: 1200, height: 800 };

    log.info(`WindowController initialized for windowId: ${this.windowId}`);
  }

  init() {
    log.info(`Initializing window: ${this.windowId}`);
    // BrowserWindow creation and event handling will be added here (Task 1.3.3, 1.3.4)
    this.createBrowserWindow();
    this.setupBrowserWindowListeners();
    this.loadInitialContent();

    // Dispatch action to add this window to the Redux store
    this.store.dispatch(addWindow({
      windowId: this.windowId,
      bounds: this.browserWindow.getBounds(), // Get actual bounds after creation
      url: this.initialUrl,
      title: this.initialTitle,
      isFocused: this.browserWindow.isFocused(), // Check initial focus state
    }));
  }

  createBrowserWindow() {
    const getIconPath = () => {
      // This helper can be moved to a shared utility if used elsewhere
      if (process.platform === 'linux') {
        return path.join(__dirname, '../../../assets/icon.png'); // Adjust path from controllers dir
      } else if (process.platform === 'win32') {
        return path.join(__dirname, '../../../assets/icon.ico');
      } else if (process.platform === 'darwin') {
        return path.join(__dirname, '../../../assets/icon.icns');
      }
      return path.join(__dirname, '../../../assets/icon.png');
    };

    this.browserWindow = new BrowserWindow({
      ...this.initialBounds,
      minWidth: 600,
      minHeight: 400,
      icon: getIconPath(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, '../../renderer/preload.js'), // Adjust path
      },
      show: false, // Start hidden, show when ready
      title: this.initialTitle, // Set initial title
    });
    log.info(`BrowserWindow created for ${this.windowId}`);
  }

  setupBrowserWindowListeners() {
    this.browserWindow.once('ready-to-show', () => {
      this.show();
      // Any other ready-to-show logic from index.js can be moved here
      // e.g., menu bar visibility based on localStore
    });

    this.browserWindow.on('closed', () => {
      log.info(`Window ${this.windowId} closed`);
      this.store.dispatch(removeWindow(this.windowId));
      // AppController needs to be notified to remove this WindowController instance
      const appCtrl = require('./AppController').getInstance(); // Or better dependency injection
      if (appCtrl) {
        appCtrl.handleWindowClosed(this.windowId);
      }
      this.browserWindow = null; // Clean up reference
    });

    this.browserWindow.on('focus', () => {
      log.debug(`Window ${this.windowId} focused`);
      this.store.dispatch(setWindowFocus({ windowId: this.windowId, focused: true }));
    });

    this.browserWindow.on('blur', () => {
      log.debug(`Window ${this.windowId} lost focus`);
      this.store.dispatch(setWindowFocus({ windowId: this.windowId, focused: false }));
    });

    this.browserWindow.on('resize', () => {
      if(this.browserWindow && !this.browserWindow.isMinimized()) {
        const bounds = this.browserWindow.getBounds();
        log.debug(`Window ${this.windowId} resized`, bounds);
        this.store.dispatch(updateWindowBounds({ windowId: this.windowId, bounds }));
      }
    });

    this.browserWindow.on('move', () => {
      if(this.browserWindow && !this.browserWindow.isMinimized()) {
        const bounds = this.browserWindow.getBounds();
        log.debug(`Window ${this.windowId} moved`, bounds);
        this.store.dispatch(updateWindowBounds({ windowId: this.windowId, bounds }));
      }
    });

    // Page title updated (e.g. from Notion itself)
    this.browserWindow.webContents.on('page-title-updated', (event, title) => {
        event.preventDefault(); // Prevent default title setting by Electron
        const cleanTitle = title.replace(' | Notion', '').trim();
        const finalTitle = `${cleanTitle} - Lotion`;
        if (this.browserWindow) {
            this.browserWindow.setTitle(finalTitle);
        }
        this.store.dispatch(updateWindowTitle({ windowId: this.windowId, title: finalTitle }));
    });

    // Handle external links and navigation blocking as in index.js
    this.browserWindow.webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });

    this.browserWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== config.domainBaseUrl) {
        event.preventDefault();
        require('electron').shell.openExternal(navigationUrl);
      }
    });

    // Handle did-navigate for potential URL updates to store (if needed for tabs later)
    // this.browserWindow.webContents.on('did-navigate', (event, url) => { ... });
  }

  loadInitialContent() {
    if (this.browserWindow) {
      log.info(`Loading URL ${this.initialUrl} for window ${this.windowId}`);
      this.browserWindow.loadURL(this.initialUrl);
    }
  }

  // --- Public Methods --- //

  get id() {
    return this.windowId;
  }

  getInternalBrowserWindow() {
    return this.browserWindow;
  }

  show() {
    if (this.browserWindow && !this.browserWindow.isVisible()) {
      log.info(`Showing window: ${this.windowId}`);
      this.browserWindow.show();
      this.focus(); // Optionally focus when shown
    }
  }

  hide() {
    if (this.browserWindow && this.browserWindow.isVisible()) {
      log.info(`Hiding window: ${this.windowId}`);
      this.browserWindow.hide();
    }
  }

  focus() {
    if (this.browserWindow && !this.browserWindow.isFocused()) {
      log.info(`Focusing window: ${this.windowId}`);
      this.browserWindow.focus();
    }
  }

  loadURL(url) {
    if (this.browserWindow) {
      log.info(`Window ${this.windowId} loading URL: ${url}`);
      this.browserWindow.loadURL(url);
      // Potentially update Redux store with new URL if tracking per window
      // this.store.dispatch(updateWindowUrl({ windowId: this.windowId, url }));
    }
  }

  // Add other methods like close, setBounds, setTitle, etc.
  // These methods would typically dispatch to Redux first or update BrowserWindow and then dispatch.
}

module.exports = WindowController; 