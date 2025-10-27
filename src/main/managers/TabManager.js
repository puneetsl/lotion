const log = require('electron-log').scope('TabManager');
const { v4: uuidv4 } = require('uuid');
const TabController = require('../controllers/TabController');
const {
  createTab,
  removeTab,
  updateTabParentWindow,
} = require('../store/slices/tabsSlice');
const {
  addTabToWindow,
  removeTabFromWindow,
  setActiveTabForWindow,
} = require('../store/slices/windowsSlice');

let instance = null; // Singleton instance

/**
 * TabManager - Singleton that manages all tabs across all windows
 * Coordinates tab creation, destruction, and movement between windows
 */
class TabManager {
  constructor(store) {
    if (instance) {
      return instance;
    }

    this.store = store;
    this.tabs = new Map(); // Map<tabId, TabController>

    instance = this;
    log.info('TabManager initialized');
  }

  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!instance) {
      throw new Error('TabManager not initialized. Call new TabManager(store) first.');
    }
    return instance;
  }

  /**
   * Create a new tab
   * @param {Object} options - Tab creation options
   * @param {string} options.windowId - Window to create tab in
   * @param {string} [options.tabId] - Optional tab ID (auto-generated if not provided)
   * @param {string} [options.url] - Initial URL to load
   * @param {string} [options.title] - Initial title
   * @param {boolean} [options.makeActive] - Whether to make this tab active
   * @param {boolean} [options.isPinned] - Whether to pin this tab
   * @returns {TabController} The created tab controller
   */
  createTab({
    windowId,
    tabId = uuidv4(),
    url,
    title = 'New Tab',
    makeActive = true,
    isPinned = false,
  }) {
    if (this.tabs.has(tabId)) {
      log.warn(`Tab ${tabId} already exists, returning existing tab`);
      return this.tabs.get(tabId);
    }

    log.info(`Creating tab ${tabId} in window ${windowId}`);

    // Create tab in Redux store
    this.store.dispatch(
      createTab({
        tabId,
        parentWindowId: windowId,
        url,
        title,
        isPinned,
      })
    );

    // Add tab to window in Redux store
    this.store.dispatch(
      addTabToWindow({
        windowId,
        tabId,
      })
    );

    // Create TabController instance
    const tabController = new TabController({
      tabId,
      windowId,
      store: this.store,
      initialUrl: url,
    });

    // Initialize the tab (creates WebContentsView)
    tabController.init();

    // Store in map
    this.tabs.set(tabId, tabController);

    // Make active if requested
    if (makeActive) {
      this.store.dispatch(
        setActiveTabForWindow({
          windowId,
          tabId,
        })
      );
    }

    log.info(
      `Tab ${tabId} created successfully. Total tabs: ${this.tabs.size}`
    );

    return tabController;
  }

  /**
   * Get a tab controller by ID
   * @param {string} tabId - The tab ID
   * @returns {TabController|null} The tab controller or null if not found
   */
  getTab(tabId) {
    return this.tabs.get(tabId) || null;
  }

  /**
   * Check if a tab exists
   * @param {string} tabId - The tab ID
   * @returns {boolean} True if tab exists
   */
  hasTab(tabId) {
    return this.tabs.has(tabId);
  }

  /**
   * Get all tabs for a specific window
   * @param {string} windowId - The window ID
   * @returns {TabController[]} Array of tab controllers
   */
  getTabsForWindow(windowId) {
    const state = this.store.getState();
    const window = state.windows.windows[windowId];

    if (!window || !window.tabIds) {
      return [];
    }

    return window.tabIds
      .map((tabId) => this.tabs.get(tabId))
      .filter((tab) => tab !== undefined);
  }

  /**
   * Get all tabs
   * @returns {TabController[]} Array of all tab controllers
   */
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  /**
   * Get the active tab for a window
   * @param {string} windowId - The window ID
   * @returns {TabController|null} The active tab controller or null
   */
  getActiveTabForWindow(windowId) {
    const state = this.store.getState();
    const window = state.windows.windows[windowId];

    if (!window || !window.activeTabId) {
      return null;
    }

    return this.tabs.get(window.activeTabId) || null;
  }

  /**
   * Destroy a tab and clean up resources
   * @param {string} tabId - The tab ID to destroy
   */
  destroyTab(tabId) {
    const tabController = this.tabs.get(tabId);

    if (!tabController) {
      log.warn(`Cannot destroy non-existent tab: ${tabId}`);
      return;
    }

    log.info(`Destroying tab: ${tabId}`);

    // Get the tab's window before removing from Redux
    const state = this.store.getState();
    const tab = state.tabs.tabs[tabId];
    const windowId = tab?.parentWindowId;

    // Remove from window in Redux
    if (windowId) {
      this.store.dispatch(
        removeTabFromWindow({
          windowId,
          tabId,
        })
      );
    }

    // Remove from Redux store
    this.store.dispatch(removeTab(tabId));

    // Destroy the TabController
    tabController.destroy();

    // Remove from map
    this.tabs.delete(tabId);

    log.info(
      `Tab ${tabId} destroyed. Remaining tabs: ${this.tabs.size}`
    );
  }

  /**
   * Destroy multiple tabs
   * @param {string[]} tabIds - Array of tab IDs to destroy
   */
  destroyTabs(tabIds) {
    log.info(`Destroying ${tabIds.length} tabs`);
    tabIds.forEach((tabId) => this.destroyTab(tabId));
  }

  /**
   * Move a tab to a different window
   * @param {string} tabId - The tab ID
   * @param {string} newWindowId - The destination window ID
   */
  moveTabToWindow(tabId, newWindowId) {
    const tabController = this.tabs.get(tabId);

    if (!tabController) {
      log.warn(`Cannot move non-existent tab: ${tabId}`);
      return;
    }

    const state = this.store.getState();
    const tab = state.tabs.tabs[tabId];
    const oldWindowId = tab?.parentWindowId;

    if (oldWindowId === newWindowId) {
      log.debug(`Tab ${tabId} already in window ${newWindowId}`);
      return;
    }

    log.info(`Moving tab ${tabId} from window ${oldWindowId} to ${newWindowId}`);

    // Remove from old window
    if (oldWindowId) {
      this.store.dispatch(
        removeTabFromWindow({
          windowId: oldWindowId,
          tabId,
        })
      );
    }

    // Add to new window
    this.store.dispatch(
      addTabToWindow({
        windowId: newWindowId,
        tabId,
      })
    );

    // Update tab's parent window
    this.store.dispatch(
      updateTabParentWindow({
        tabId,
        parentWindowId: newWindowId,
      })
    );

    // Update the tab controller's window reference
    tabController.windowId = newWindowId;

    log.info(`Tab ${tabId} moved successfully`);
  }

  /**
   * Get tab count
   * @returns {number} Total number of tabs
   */
  getTabCount() {
    return this.tabs.size;
  }

  /**
   * Get tab count for a specific window
   * @param {string} windowId - The window ID
   * @returns {number} Number of tabs in the window
   */
  getTabCountForWindow(windowId) {
    const state = this.store.getState();
    const window = state.windows.windows[windowId];
    return window?.tabIds?.length || 0;
  }

  /**
   * Clean up all tabs (for app shutdown)
   */
  destroyAllTabs() {
    log.info(`Destroying all ${this.tabs.size} tabs`);

    this.tabs.forEach((tabController, tabId) => {
      try {
        tabController.destroy();
      } catch (error) {
        log.error(`Error destroying tab ${tabId}:`, error);
      }
    });

    this.tabs.clear();
    log.info('All tabs destroyed');
  }

  /**
   * Get tabs that haven't been used recently (for memory optimization)
   * @param {number} [thresholdMs=30*60*1000] - Time threshold in milliseconds (default: 30 minutes)
   * @returns {string[]} Array of stale tab IDs
   */
  getStaleTabIds(thresholdMs = 30 * 60 * 1000) {
    const state = this.store.getState();
    const now = Date.now();

    return Object.values(state.tabs.tabs)
      .filter((tab) => {
        // Don't unload pinned tabs or the active tab in any window
        if (tab.isPinned) return false;

        // Check if it's the active tab in any window
        const isActive = Object.values(state.windows.windows).some(
          (window) => window.activeTabId === tab.tabId
        );

        if (isActive) return false;

        // Check if it's been unused for longer than threshold
        return (
          tab.isLoaded && now - tab.unusedSince > thresholdMs
        );
      })
      .map((tab) => tab.tabId);
  }

  /**
   * Unload stale tabs to free memory
   * @param {number} [thresholdMs=30*60*1000] - Time threshold in milliseconds
   */
  unloadStaleTabs(thresholdMs = 30 * 60 * 1000) {
    const staleTabIds = this.getStaleTabIds(thresholdMs);

    if (staleTabIds.length === 0) {
      log.debug('No stale tabs to unload');
      return;
    }

    log.info(`Unloading ${staleTabIds.length} stale tabs`);

    staleTabIds.forEach((tabId) => {
      const tabController = this.tabs.get(tabId);
      if (tabController && !tabController.isTabDestroyed()) {
        // TODO: Implement tab unloading (keep tab but destroy WebContents)
        // For now, we'll just log it
        log.debug(`Would unload tab: ${tabId}`);
      }
    });
  }
}

module.exports = TabManager;
