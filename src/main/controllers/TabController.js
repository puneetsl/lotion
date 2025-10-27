const { WebContentsView } = require('electron');
const path = require('path');
const log = require('electron-log').scope('TabController');
const {
  updateTabTitle,
  updateTabUrl,
  updateTabFavicon,
  updateTabLoaded,
  updateTabBreadcrumbs,
  updateTabUnusedSince,
} = require('../store/slices/tabsSlice');
const config = require('../../../config/config.json');

/**
 * TabController manages a single tab instance
 * Each tab has its own WebContentsView that loads Notion
 */
class TabController {
  constructor({ tabId, windowId, store, initialUrl }) {
    this.tabId = tabId;
    this.windowId = windowId;
    this.store = store;
    this.initialUrl = initialUrl || config.domainBaseUrl;
    this.webContentsView = null;
    this.isVisible = false;
    this.isDestroyed = false;

    log.info(`TabController initialized for tab: ${this.tabId} in window: ${this.windowId}`);
  }

  /**
   * Initialize the tab - create WebContentsView and set up listeners
   */
  init() {
    if (this.isDestroyed) {
      log.warn(`Cannot init destroyed tab: ${this.tabId}`);
      return;
    }

    log.info(`Initializing tab: ${this.tabId}`);
    this.createWebContentsView();
    this.setupEventListeners();
    this.loadURL(this.initialUrl);
  }

  /**
   * Create the WebContentsView for this tab
   */
  createWebContentsView() {
    this.webContentsView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        preload: path.join(__dirname, '../../renderer/preload.js'),
        spellcheck: true,
      },
    });

    // Set up spell checker languages from Redux store
    const state = this.store.getState();
    const dictionaries = state.app.dictionaries || ['en-US'];

    try {
      this.webContentsView.webContents.session.setSpellCheckerLanguages(dictionaries);
      log.debug(`Tab ${this.tabId}: Spell checker languages set to ${dictionaries}`);
    } catch (err) {
      log.error(`Tab ${this.tabId}: Error setting spell checker languages:`, err);
    }

    log.debug(`WebContentsView created for tab: ${this.tabId}`);
  }

  /**
   * Set up event listeners for the tab's web contents
   */
  setupEventListeners() {
    const { webContents } = this.webContentsView;

    // Page title updated
    webContents.on('page-title-updated', (event, title) => {
      event.preventDefault(); // Prevent default title setting
      const cleanTitle = title.replace(' | Notion', '').trim();
      log.debug(`Tab ${this.tabId}: Title updated to "${cleanTitle}"`);

      this.store.dispatch(
        updateTabTitle({
          tabId: this.tabId,
          title: cleanTitle,
        })
      );

      // TODO: Extract breadcrumbs from page title or DOM
      // For now, use simple breadcrumb from title
      const breadcrumbs = cleanTitle
        ? [{ id: 'page', title: cleanTitle }]
        : [];
      this.store.dispatch(
        updateTabBreadcrumbs({
          tabId: this.tabId,
          breadcrumbs,
        })
      );
    });

    // Navigation completed
    webContents.on('did-finish-load', () => {
      log.debug(`Tab ${this.tabId}: Page loaded`);
      this.store.dispatch(
        updateTabLoaded({
          tabId: this.tabId,
          isLoaded: true,
        })
      );
    });

    // Navigation started
    webContents.on('did-start-loading', () => {
      log.debug(`Tab ${this.tabId}: Page loading...`);
      this.store.dispatch(
        updateTabLoaded({
          tabId: this.tabId,
          isLoaded: false,
        })
      );
    });

    // URL changed
    webContents.on('did-navigate', (event, url) => {
      log.debug(`Tab ${this.tabId}: Navigated to ${url}`);
      this.store.dispatch(
        updateTabUrl({
          tabId: this.tabId,
          url,
        })
      );
    });

    // Favicon updated
    webContents.on('page-favicon-updated', (event, favicons) => {
      if (favicons && favicons.length > 0) {
        log.debug(`Tab ${this.tabId}: Favicon updated`);
        this.store.dispatch(
          updateTabFavicon({
            tabId: this.tabId,
            favicon: favicons[0],
          })
        );
      }
    });

    // Handle external links
    webContents.setWindowOpenHandler(({ url }) => {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    });

    // Block navigation to external sites
    webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== config.domainBaseUrl) {
        event.preventDefault();
        require('electron').shell.openExternal(navigationUrl);
      }
    });

    // Handle crashes
    webContents.on('render-process-gone', (event, details) => {
      log.error(`Tab ${this.tabId}: Renderer process gone`, details);
      // TODO: Show crash recovery UI
    });

    log.debug(`Event listeners set up for tab: ${this.tabId}`);
  }

  /**
   * Load a URL in this tab
   */
  loadURL(url) {
    if (this.isDestroyed || !this.webContentsView) {
      log.warn(`Cannot load URL in destroyed tab: ${this.tabId}`);
      return;
    }

    log.info(`Tab ${this.tabId}: Loading URL ${url}`);
    this.webContentsView.webContents.loadURL(url);

    // Update Redux state
    this.store.dispatch(
      updateTabUrl({
        tabId: this.tabId,
        url,
      })
    );
  }

  /**
   * Show this tab (add to window's content view)
   */
  show() {
    if (this.isDestroyed) {
      log.warn(`Cannot show destroyed tab: ${this.tabId}`);
      return;
    }

    this.isVisible = true;
    log.debug(`Tab ${this.tabId}: Now visible`);

    // Mark as recently used
    this.store.dispatch(
      updateTabUnusedSince({
        tabId: this.tabId,
        unusedSince: Date.now(),
      })
    );
  }

  /**
   * Hide this tab (remove from window's content view)
   */
  hide() {
    if (this.isDestroyed) {
      return;
    }

    this.isVisible = false;
    log.debug(`Tab ${this.tabId}: Now hidden`);

    // Mark as unused
    this.store.dispatch(
      updateTabUnusedSince({
        tabId: this.tabId,
        unusedSince: Date.now(),
      })
    );
  }

  /**
   * Reload the tab's content
   */
  reload() {
    if (this.isDestroyed || !this.webContentsView) {
      log.warn(`Cannot reload destroyed tab: ${this.tabId}`);
      return;
    }

    log.info(`Tab ${this.tabId}: Reloading`);
    this.webContentsView.webContents.reload();
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    if (
      this.isDestroyed ||
      !this.webContentsView ||
      !this.webContentsView.webContents.navigationHistory.canGoBack()
    ) {
      return;
    }

    log.debug(`Tab ${this.tabId}: Going back`);
    this.webContentsView.webContents.navigationHistory.goBack();
  }

  /**
   * Go forward in navigation history
   */
  goForward() {
    if (
      this.isDestroyed ||
      !this.webContentsView ||
      !this.webContentsView.webContents.navigationHistory.canGoForward()
    ) {
      return;
    }

    log.debug(`Tab ${this.tabId}: Going forward`);
    this.webContentsView.webContents.navigationHistory.goForward();
  }

  /**
   * Check if tab can go back
   */
  canGoBack() {
    if (this.isDestroyed || !this.webContentsView) {
      return false;
    }
    return this.webContentsView.webContents.navigationHistory.canGoBack();
  }

  /**
   * Check if tab can go forward
   */
  canGoForward() {
    if (this.isDestroyed || !this.webContentsView) {
      return false;
    }
    return this.webContentsView.webContents.navigationHistory.canGoForward();
  }

  /**
   * Get the WebContentsView instance
   */
  getWebContentsView() {
    return this.webContentsView;
  }

  /**
   * Get the current URL
   */
  getURL() {
    if (this.isDestroyed || !this.webContentsView) {
      return null;
    }
    return this.webContentsView.webContents.getURL();
  }

  /**
   * Get the current title
   */
  getTitle() {
    if (this.isDestroyed || !this.webContentsView) {
      return '';
    }
    return this.webContentsView.webContents.getTitle();
  }

  /**
   * Check if tab is loading
   */
  isLoading() {
    if (this.isDestroyed || !this.webContentsView) {
      return false;
    }
    return this.webContentsView.webContents.isLoading();
  }

  /**
   * Destroy this tab and clean up resources
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    log.info(`Destroying tab: ${this.tabId}`);

    // Remove all event listeners
    if (this.webContentsView && this.webContentsView.webContents) {
      this.webContentsView.webContents.removeAllListeners();
    }

    // Destroy the WebContentsView
    if (this.webContentsView && !this.webContentsView.webContents.isDestroyed()) {
      this.webContentsView.webContents.destroy();
    }

    this.webContentsView = null;
    this.isDestroyed = true;
    this.isVisible = false;

    log.debug(`Tab ${this.tabId}: Destroyed`);
  }

  /**
   * Check if this tab is destroyed
   */
  isTabDestroyed() {
    return this.isDestroyed;
  }
}

module.exports = TabController;
