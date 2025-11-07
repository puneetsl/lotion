const { app, BrowserWindow } = require('electron');
const log = require('electron-log').scope('AppController');
const { addWindow } = require('../store/slices/windowsSlice'); // Import addWindow
const WindowController = require('./WindowController'); // Import WindowController
const TabManager = require('../managers/TabManager'); // Import TabManager
const { v4: uuidv4 } = require('uuid'); // For generating unique window IDs

let instance = null; // For singleton pattern

class AppController {
  constructor(store) {
    this.store = store;
    this.electronApp = app;
    this.windowControllers = new Map(); // Map of windowId to WindowController instance
    this.tabManager = null; // TabManager singleton instance
    this.isQuitting = false;
    // this.createWindowCallback = null; // No longer needed from index.js

    if (!instance) {
      instance = this;
    }
    log.info('AppController initialized');
    return instance;
  }

  static getInstance() {
    return instance;
  }

  init(/*{ createWindowCallback }*/) { // createWindowCallback no longer needed
    log.info('Initializing app event handlers in AppController');
    // this.createWindowCallback = createWindowCallback; // Removed

    // Initialize TabManager singleton
    this.tabManager = new TabManager(this.store);
    log.info('TabManager initialized');

    this.electronApp.whenReady().then(() => {
      log.info('Electron app is ready via AppController');
      
      // Parse command line arguments for Notion URL
      const args = process.argv;
      let initialUrl = null;
      // Find any argument that is a Notion URL
      for (const arg of args) {
        if (arg && 
            (arg.startsWith('http://') || arg.startsWith('https://')) && 
            arg.includes('notion.so')) {
          initialUrl = arg;
          log.info(`Found Notion URL: ${initialUrl}`);
          break;
        }
      }
      
      const options = initialUrl ? { initialUrl } : {};
      this.createNewWindow(options);
    });

    this.electronApp.on('window-all-closed', () => {
      log.info('All windows closed according to Electron event');
      // Note: This event might fire even if AppController still has tracked windows if they weren't closed properly.
      // The actual quitting logic should rely on whether windowControllers map is empty for non-darwin.
      if (process.platform !== 'darwin') {
         if (this.windowControllers.size === 0) {
            log.info('No active windows remaining, quitting app.');
            this.electronApp.quit();
         } else {
            log.warn('window-all-closed fired, but windowControllers map is not empty. This might indicate an issue.');
         }
      }
    });

    this.electronApp.on('activate', () => {
      log.info('App activated');
      if (this.windowControllers.size === 0) {
        this.createNewWindow();
      }
    });

    this.electronApp.on('before-quit', () => {
      log.info('App before-quit event triggered in AppController');
      this.isQuitting = true;
      // Potentially iterate over windowControllers and tell them to prepare for quit
    });
  }

  createNewWindow(options = {}) {
    const windowId = options.windowId || uuidv4();
    log.info(`AppController: creating new window with id: ${windowId}`, options);

    if (this.windowControllers.has(windowId)) {
      log.warn(`Window with id ${windowId} already exists. Focusing existing window.`);
      this.windowControllers.get(windowId).focus();
      return this.windowControllers.get(windowId);
    }

    const windowController = new WindowController({
      windowId,
      store: this.store,
      ...options, // Pass through any other options like initialUrl, title, bounds
    });

    this.windowControllers.set(windowId, windowController);
    windowController.init(); // This creates the BrowserWindow and dispatches addWindow

    log.info(`WindowController for ${windowId} created and initialized. Total windows: ${this.windowControllers.size}`);
    return windowController;
  }

  handleWindowClosed(windowId) {
    log.info(`AppController handling closed window: ${windowId}`);
    if (this.windowControllers.has(windowId)) {
      this.windowControllers.delete(windowId);
      log.info(`WindowController for ${windowId} removed. Remaining windows: ${this.windowControllers.size}`);
    } else {
      log.warn(`Attempted to handle close for non-existent windowId: ${windowId}`);
    }

    // If on non-darwin and it was the last window, quit the app
    if (process.platform !== 'darwin' && this.windowControllers.size === 0 && !this.isQuitting) {
        log.info('Last window closed on non-darwin platform, quitting application.');
        this.electronApp.quit();
    }
  }

  requestQuit() {
    log.info('Quit requested via AppController');
    this.isQuitting = true;
    // Optionally, tell all window controllers to clean up or save state
    // for (const wc of this.windowControllers.values()) { wc.prepareForQuit(); }
    this.electronApp.quit();
  }

  getFocusedWindowController() {
    const focusedWindowId = this.store.getState().windows.focusedWindowId;
    if (focusedWindowId) {
      return this.windowControllers.get(focusedWindowId) || null;
    }
    // Fallback if no windowId in store, or if a window is focused but not yet in map (race condition on init)
    // This part is tricky without fully relying on Redux state for focus source of truth.
    // For now, let's assume Redux is the source of truth for focusedWindowId
    return null;
  }

  // getMainWindowInstance() { // This was a temporary hack and should be removed
  //   const allWindows = BrowserWindow.getAllWindows();
  //   return allWindows.length > 0 ? allWindows[0] : null;
  // }
}

module.exports = AppController;
