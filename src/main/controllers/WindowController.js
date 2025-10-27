const { BrowserWindow, WebContentsView } = require('electron');
const path = require('path');
const log = require('electron-log').scope('WindowController');
const { addWindow, removeWindow, setWindowFocus, updateWindowBounds, updateWindowTitle } = require('../store/slices/windowsSlice');
const config = require('../../../config/config.json'); // Adjust path as needed

class WindowController {
  constructor({ windowId, store, initialUrl, title, bounds }) {
    this.windowId = windowId;
    this.store = store;
    this.browserWindow = null;
    this.tabBarView = null; // WebContentsView for tab bar UI
    this.currentActiveTabController = null; // Reference to active tab's controller
    this.initialUrl = initialUrl || config.domainBaseUrl;
    this.initialTitle = title || 'Lotion';
    this.initialBounds = bounds || { width: 1200, height: 800 };

    // Tab bar height in pixels (reduced for a sleeker look)
    this.TAB_BAR_HEIGHT = 32;

    log.info(`WindowController initialized for windowId: ${this.windowId}`);
  }

  init() {
    log.info(`Initializing window: ${this.windowId}`);
    this.createBrowserWindow();
    this.createTabBarView();
    this.setupBrowserWindowListeners();
    this.createInitialTab();

    // Dispatch action to add this window to the Redux store
    this.store.dispatch(addWindow({
      windowId: this.windowId,
      bounds: this.browserWindow.getBounds(), // Get actual bounds after creation
      url: this.initialUrl,
      title: this.initialTitle,
      isFocused: this.browserWindow.isFocused(), // Check initial focus state
    }));

    // Show window after everything is set up
    // We don't use ready-to-show because we're using WebContentsView
    this.show();
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
      frame: false, // Remove window decorations for custom title bar
      titleBarStyle: 'hidden', // Hide title bar on macOS
      transparent: false, // Don't use transparency (causes resize issues on Linux)
      backgroundColor: '#f5f5f5', // Match light theme background
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, '../../renderer/preload.js'), // Adjust path
        spellcheck: true // Enable Electron's built-in spell check
      },
      show: false, // Start hidden, show when ready
      title: this.initialTitle, // Set initial title
    });
    log.info(`BrowserWindow created for ${this.windowId}`);

    // Always use the persisted value from electron-store for spell checker languages
    const Store = require('electron-store');
    const localStore = new Store();
    let dictionaries = localStore.get('spellCheckDictionaries', ['en-US']);
    if (!dictionaries || !Array.isArray(dictionaries) || dictionaries.length === 0) {
      dictionaries = ['en-US'];
      localStore.set('spellCheckDictionaries', dictionaries);
    }
    this.store.dispatch({ type: 'app/setDictionaries', payload: dictionaries });
    log.info(`[SpellCheck] Setting spell checker languages: ${JSON.stringify(dictionaries)}`);
    try {
      const result = this.browserWindow.webContents.session.setSpellCheckerLanguages(dictionaries);
      log.info(`[SpellCheck] setSpellCheckerLanguages result: ${result}`);
    } catch (err) {
      log.error(`[SpellCheck] Error setting spell checker languages: ${err}`);
    }
  }

  setupBrowserWindowListeners() {
    // Note: ready-to-show doesn't fire reliably when using WebContentsView
    // We'll show the window manually after setup

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
        // Update tab bar and content area layout
        this.updateViewBounds();
      }
    });

    this.browserWindow.on('move', () => {
      if(this.browserWindow && !this.browserWindow.isMinimized()) {
        const bounds = this.browserWindow.getBounds();
        log.debug(`Window ${this.windowId} moved`, bounds);
        this.store.dispatch(updateWindowBounds({ windowId: this.windowId, bounds }));
      }
    });

    this.browserWindow.on('maximize', () => {
      log.debug(`Window ${this.windowId} maximized`);
      // Defer bounds update to next tick to ensure window manager has finished resizing
      setImmediate(() => {
        this.updateViewBounds();
      });
    });

    this.browserWindow.on('unmaximize', () => {
      log.debug(`Window ${this.windowId} unmaximized`);
      // Defer bounds update to next tick to ensure window manager has finished resizing
      setImmediate(() => {
        this.updateViewBounds();
      });
    });
  }

  /**
   * Create tab bar WebContentsView
   */
  createTabBarView() {
    log.info(`Creating tab bar for window ${this.windowId}`);

    this.tabBarView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../../renderer/tab-bar/preload.js'),
      },
    });

    // Add tab bar to window
    this.browserWindow.contentView.addChildView(this.tabBarView);

    // Load tab bar HTML
    const tabBarPath = path.join(__dirname, '../../renderer/tab-bar/index.html');
    this.tabBarView.webContents.loadFile(tabBarPath);

    // Update bounds
    this.updateViewBounds();
  }

  /**
   * Update tab bar and content area bounds based on window size
   */
  updateViewBounds() {
    if (!this.browserWindow || !this.tabBarView) return;

    // For frameless windows (frame: false), getBounds() returns the correct size
    // getContentBounds() can return cached/stale values during maximize transitions
    const bounds = this.browserWindow.getBounds();
    const { width, height } = bounds;

    log.debug(`Updating view bounds for window ${this.windowId}:`, {
      bounds: bounds,
      isMaximized: this.browserWindow.isMaximized(),
      width,
      height
    });

    // Tab bar at top - ALWAYS set bounds to ensure it stays on top
    this.tabBarView.setBounds({
      x: 0,
      y: 0,
      width: width,
      height: this.TAB_BAR_HEIGHT,
    });

    // Update active tab content area (below tab bar)
    if (this.currentActiveTabController && this.currentActiveTabController.webContentsView) {
      this.currentActiveTabController.webContentsView.setBounds({
        x: 0,
        y: this.TAB_BAR_HEIGHT,
        width: width,
        height: height - this.TAB_BAR_HEIGHT,
      });
      log.debug(`Set tab content bounds:`, { x: 0, y: this.TAB_BAR_HEIGHT, width, height: height - this.TAB_BAR_HEIGHT });
    }

    // Ensure tab bar stays on top by removing and re-adding it
    // This forces it to be the topmost view
    if (this.browserWindow.contentView) {
      this.browserWindow.contentView.removeChildView(this.tabBarView);
      this.browserWindow.contentView.addChildView(this.tabBarView);
    }
  }

  /**
   * Create initial tab when window opens
   */
  createInitialTab() {
    const TabManager = require('../managers/TabManager');
    const tabManager = TabManager.getInstance();

    log.info(`Creating initial tab for window ${this.windowId}`);
    const tabController = tabManager.createTab({
      windowId: this.windowId,
      url: this.initialUrl,
      title: this.initialTitle,
      makeActive: true,
    });

    this.setActiveTab(tabController);
  }

  /**
   * Set active tab and display its WebContentsView
   * @param {TabController} tabController - The tab to activate
   */
  setActiveTab(tabController) {
    if (!tabController) {
      log.warn(`Cannot set active tab: tabController is null`);
      return;
    }

    log.info(`Setting active tab ${tabController.tabId} for window ${this.windowId}`);

    // Hide current active tab if exists
    if (this.currentActiveTabController && this.currentActiveTabController !== tabController) {
      this.currentActiveTabController.hide();

      // Remove from window's content view
      if (this.currentActiveTabController.webContentsView) {
        this.browserWindow.contentView.removeChildView(
          this.currentActiveTabController.webContentsView
        );
      }
    }

    // Set new active tab
    this.currentActiveTabController = tabController;

    // Add to window's content view
    if (tabController.webContentsView) {
      this.browserWindow.contentView.addChildView(tabController.webContentsView);
      this.updateViewBounds(); // Position it correctly
      tabController.show();
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
    // Load URL in active tab instead of window
    if (this.currentActiveTabController) {
      log.info(`Window ${this.windowId} loading URL in active tab: ${url}`);
      this.currentActiveTabController.loadURL(url);
    } else {
      log.warn(`Window ${this.windowId} has no active tab to load URL`);
    }
  }

  /**
   * Get tab controller by tab ID
   * @param {string} tabId - Tab ID to find
   * @returns {TabController|null}
   */
  getTabController(tabId) {
    const TabManager = require('../managers/TabManager');
    const tabManager = TabManager.getInstance();
    return tabManager.getTab(tabId);
  }

  /**
   * Switch to a different tab
   * @param {string} tabId - Tab ID to switch to
   */
  switchToTab(tabId) {
    const tabController = this.getTabController(tabId);
    if (tabController && tabController.windowId === this.windowId) {
      this.setActiveTab(tabController);

      // Update Redux store
      const { setActiveTabForWindow } = require('../store/slices/windowsSlice');
      this.store.dispatch(setActiveTabForWindow({ windowId: this.windowId, tabId }));
    } else {
      log.warn(`Cannot switch to tab ${tabId}: not found or belongs to different window`);
    }
  }

  /**
   * Get the currently active tab controller
   * @returns {TabController|null}
   */
  getActiveTabController() {
    return this.currentActiveTabController;
  }

  /**
   * Clean up when window closes
   */
  destroy() {
    log.info(`Destroying WindowController ${this.windowId}`);

    // Clean up tab bar
    if (this.tabBarView) {
      this.tabBarView.webContents.close();
      this.tabBarView = null;
    }

    // Clean up browser window
    if (this.browserWindow) {
      this.browserWindow.destroy();
      this.browserWindow = null;
    }

    this.currentActiveTabController = null;
  }
}

module.exports = WindowController;
