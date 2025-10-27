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

      // Check if spell check is enabled in settings
      const Store = require('electron-store');
      const store = new Store();
      const spellCheckEnabled = store.get('spellCheckEnabled', true);
      this.webContentsView.webContents.session.setSpellCheckerEnabled(spellCheckEnabled);
      log.debug(`Tab ${this.tabId}: Spell checker enabled: ${spellCheckEnabled}`);
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

      // Inject custom CSS after page loads
      this.injectCustomCSS();
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

    // Handle external links - allow Notion domains, open others externally
    webContents.setWindowOpenHandler(({ url }) => {
      const parsedUrl = new URL(url);

      // Check if URL is a Notion domain (notion.so or notion.com)
      const isNotionDomain =
        parsedUrl.hostname === 'notion.so' ||
        parsedUrl.hostname === 'www.notion.so' ||
        parsedUrl.hostname.endsWith('.notion.so') ||
        parsedUrl.hostname === 'notion.com' ||
        parsedUrl.hostname === 'www.notion.com' ||
        parsedUrl.hostname.endsWith('.notion.com');

      if (isNotionDomain) {
        // Allow Notion links to open in new tab within app
        log.debug(`Tab ${this.tabId}: Allowing new window for Notion URL: ${url}`);
        return { action: 'allow' };
      } else {
        // Open non-Notion links in external browser
        require('electron').shell.openExternal(url);
        log.debug(`Tab ${this.tabId}: Opening external URL in browser: ${url}`);
        return { action: 'deny' };
      }
    });

    // Allow navigation within Notion, block external sites
    webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);

      // Check if URL is a Notion domain (notion.so or notion.com)
      const isNotionDomain =
        parsedUrl.hostname === 'notion.so' ||
        parsedUrl.hostname === 'www.notion.so' ||
        parsedUrl.hostname.endsWith('.notion.so') ||
        parsedUrl.hostname === 'notion.com' ||
        parsedUrl.hostname === 'www.notion.com' ||
        parsedUrl.hostname.endsWith('.notion.com');

      // Only block if it's NOT a Notion URL
      if (!isNotionDomain) {
        event.preventDefault();
        require('electron').shell.openExternal(navigationUrl);
        log.debug(`Tab ${this.tabId}: Blocked external navigation to ${navigationUrl}`);
      } else {
        log.debug(`Tab ${this.tabId}: Allowing internal navigation to ${navigationUrl}`);
      }
    });

    // Handle crashes
    webContents.on('render-process-gone', (event, details) => {
      log.error(`Tab ${this.tabId}: Renderer process gone`, details);
      // TODO: Show crash recovery UI
    });

    // Context menu with spell check
    webContents.on('context-menu', (event, params) => {
      const { Menu, MenuItem } = require('electron');
      const menu = new Menu();

      // Add spell check suggestions if there's a misspelled word
      if (params.misspelledWord) {
        // Add suggestions
        params.dictionarySuggestions.forEach((suggestion) => {
          menu.append(
            new MenuItem({
              label: suggestion,
              click: () => webContents.replaceMisspelling(suggestion),
            })
          );
        });

        // Add separator if there are suggestions
        if (params.dictionarySuggestions.length > 0) {
          menu.append(new MenuItem({ type: 'separator' }));
        }

        // Add to dictionary
        menu.append(
          new MenuItem({
            label: 'Add to Dictionary',
            click: () => webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
          })
        );

        menu.append(new MenuItem({ type: 'separator' }));
      }

      // Standard editing commands
      if (params.isEditable) {
        menu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: params.editFlags.canCut }));
        menu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy }));
        menu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
      } else if (params.selectionText) {
        // If there's selected text but not editable, show copy
        menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      }

      // Link context menu
      if (params.linkURL) {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(
          new MenuItem({
            label: 'Open Link in Browser',
            click: () => require('electron').shell.openExternal(params.linkURL),
          })
        );
        menu.append(
          new MenuItem({
            label: 'Copy Link Address',
            click: () => require('electron').clipboard.writeText(params.linkURL),
          })
        );
      }

      // Image context menu
      if (params.hasImageContents) {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(
          new MenuItem({
            label: 'Copy Image',
            click: () => webContents.copyImageAt(params.x, params.y),
          })
        );
        if (params.srcURL) {
          menu.append(
            new MenuItem({
              label: 'Copy Image Address',
              click: () => require('electron').clipboard.writeText(params.srcURL),
            })
          );
        }
      }

      // Show developer tools option in development mode
      if (process.env.NODE_ENV !== 'production') {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(
          new MenuItem({
            label: 'Inspect Element',
            click: () => webContents.inspectElement(params.x, params.y),
          })
        );
      }

      // Only show menu if it has items
      if (menu.items.length > 0) {
        menu.popup();
      }
    });

    log.debug(`Event listeners set up for tab: ${this.tabId}`);
  }

  /**
   * Inject custom CSS from user's config directory
   */
  async injectCustomCSS() {
    if (this.isDestroyed || !this.webContentsView) {
      log.warn(`Cannot inject CSS in destroyed tab: ${this.tabId}`);
      return;
    }

    const { app } = require('electron');
    const fs = require('fs');
    const Store = require('electron-store');
    const store = new Store();

    // First, inject theme if one is selected
    const currentTheme = store.get('theme', 'none');
    if (currentTheme !== 'none') {
      const themePath = path.join(app.getPath('userData'), 'themes', `${currentTheme}.css`);
      if (fs.existsSync(themePath)) {
        try {
          const themeCSS = fs.readFileSync(themePath, 'utf8');
          // Remove old theme CSS if exists
          if (this.injectedThemeKey) {
            await this.webContentsView.webContents.removeInsertedCSS(this.injectedThemeKey);
          }
          // Inject theme CSS
          this.injectedThemeKey = await this.webContentsView.webContents.insertCSS(themeCSS);
          log.info(`Theme "${currentTheme}" injected for tab ${this.tabId}`);
        } catch (err) {
          log.error(`Tab ${this.tabId}: Error injecting theme:`, err);
        }
      }
    } else {
      // Remove theme if switching to "none"
      if (this.injectedThemeKey) {
        try {
          await this.webContentsView.webContents.removeInsertedCSS(this.injectedThemeKey);
          this.injectedThemeKey = null;
          log.info(`Theme removed for tab ${this.tabId}`);
        } catch (err) {
          log.error(`Tab ${this.tabId}: Error removing theme:`, err);
        }
      }
    }

    // Then, inject custom.css (user's personal overrides)
    const customCSSPath = path.join(app.getPath('userData'), 'custom.css');
    if (fs.existsSync(customCSSPath)) {
      try {
        const css = fs.readFileSync(customCSSPath, 'utf8');
        // Remove old CSS if exists
        if (this.injectedCSSKey) {
          await this.webContentsView.webContents.removeInsertedCSS(this.injectedCSSKey);
        }
        // Inject new CSS
        this.injectedCSSKey = await this.webContentsView.webContents.insertCSS(css);
        log.info(`Custom CSS injected for tab ${this.tabId}`);
      } catch (err) {
        log.error(`Tab ${this.tabId}: Error injecting custom CSS:`, err);
      }
    }
  }

  /**
   * Reload custom CSS
   */
  async reloadCustomCSS() {
    await this.injectCustomCSS();
  }

  /**
   * Load a theme by name
   */
  async loadTheme(themeName) {
    if (this.isDestroyed || !this.webContentsView) {
      log.warn(`Cannot load theme in destroyed tab: ${this.tabId}`);
      return;
    }

    const { app } = require('electron');
    const fs = require('fs');

    // Remove old theme if exists
    if (this.injectedThemeKey) {
      try {
        await this.webContentsView.webContents.removeInsertedCSS(this.injectedThemeKey);
        this.injectedThemeKey = null;
      } catch (err) {
        log.error(`Tab ${this.tabId}: Error removing old theme:`, err);
      }
    }

    // Load new theme if not "none"
    if (themeName !== 'none') {
      const themePath = path.join(app.getPath('userData'), 'themes', `${themeName}.css`);
      if (fs.existsSync(themePath)) {
        try {
          const themeCSS = fs.readFileSync(themePath, 'utf8');
          this.injectedThemeKey = await this.webContentsView.webContents.insertCSS(themeCSS);
          log.info(`Theme "${themeName}" loaded for tab ${this.tabId}`);
        } catch (err) {
          log.error(`Tab ${this.tabId}: Error loading theme "${themeName}":`, err);
        }
      } else {
        log.warn(`Tab ${this.tabId}: Theme file not found: ${themePath}`);
      }
    } else {
      log.info(`Theme removed for tab ${this.tabId}`);
    }
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
