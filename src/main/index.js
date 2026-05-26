// This file serves as the entry point for the main process
// Simple Notion desktop app for Linux

const { app, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const Store = require('electron-store');
const reduxStore = require('./store/store');
const AppController = require('./controllers/AppController');
const { getSpellCheckMenu } = require('./spellCheckMenu');

// Set custom user data path for development to avoid conflicts
if (process.env.NODE_ENV === 'development') {
  const devUserDataPath = path.join(app.getPath('userData'), '-dev-data');
  app.setPath('userData', devUserDataPath);
  log.info(`Development mode: User data path set to ${devUserDataPath}`);
}

// --- Single Instance Lock --- //
// IMPORTANT: Request single instance lock BEFORE any other initialization
// Use single instance lock to handle multiple windows via second-instance events
// When user runs 'lotion' again, create a new window in the existing process
const gotTheLock = app.requestSingleInstanceLock();
log.info(`Requesting single instance lock... Got lock: ${gotTheLock}`);

if (!gotTheLock) {
  log.info('Another instance of Lotion is already running. Quitting this instance.');
  app.quit();
  // Exit immediately - don't initialize anything else
  process.exit(0);
} else {
  log.info('Single instance lock acquired successfully');
}

// Import config (needed after lock is acquired)
const config = require('../../config/config.json');

// Initialize store for user preferences (localStore for menu bar visibility etc.)
const localStore = new Store({
  defaults: {
    menuBarVisible: true,
    autoHideMenuBar: false,
    restoreTabsOnStartup: false,
    useNativeWindowFrame: false
  }
});

// --- Initialize spell check dictionaries in Redux from electron-store before anything else ---
const spellCheckDictionaries = localStore.get('spellCheckDictionaries', ['en-US']);
reduxStore.dispatch({ type: 'app/setDictionaries', payload: spellCheckDictionaries });

// Restore prefers-color-scheme override from the saved theme before any
// BrowserWindow is created — otherwise Notion launches in its system
// mode and our --c-* overrides land on the wrong base palette until
// the user picks a theme again. Mode mapping mirrors the themes[]
// array in show-logo-menu; light-mode themes set 'light', dark-mode
// themes set 'dark', and Default leaves it as 'system'.
{
  const savedTheme = (new Store()).get('theme', 'default');
  const lightThemes = new Set(['catppuccin-latte', 'sakura']);
  const isExplicitlyLight = lightThemes.has(savedTheme);
  const isExplicitlyDark = savedTheme !== 'default' && !isExplicitlyLight;
  const { nativeTheme } = require('electron');
  nativeTheme.themeSource = isExplicitlyLight ? 'light' : (isExplicitlyDark ? 'dark' : 'system');
}

// Instantiate AppController (singleton)
const appController = new AppController(reduxStore);

// Handle second-instance event (must be set up after appController is created)
// This fires when someone tries to run 'lotion' again
// We create a NEW WINDOW instead of focusing existing one
app.on('second-instance', (event, commandLine, workingDirectory) => {
  log.info('Second instance detected, creating new window');

  // Find any argument that is a Notion URL
  let initialUrl = null;
  for (const arg of commandLine) {
    if (arg && 
        (arg.startsWith('http://') || arg.startsWith('https://')) && 
        arg.includes('notion.so')) {
      initialUrl = arg;
      log.info(`Found Notion URL: ${initialUrl}`);
      break;
    }
  }

  const options = initialUrl ? { initialUrl } : {};
  appController.createNewWindow(options);
});

appController.init(); // Initialize AppController event handlers

// --- Helper Functions --- //

// Toggle native-vs-custom window frame. The Electron `frame` option is
// fixed at BrowserWindow creation time, so we just persist the choice
// and tell the user to relaunch.
function toggleNativeWindowFrame(newValue) {
  localStore.set('useNativeWindowFrame', newValue);
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (!focusedWindow) return;
  dialog.showMessageBox(focusedWindow, {
    type: 'info',
    title: 'Restart Required',
    message: newValue ? 'Native window decorations enabled' : 'Custom (tabbed) window enabled',
    detail: newValue
      ? "Lotion will switch to native window decorations the next time you launch. The custom tab bar is replaced with single-window-per-tab behavior, and settings move to the standard menu bar."
      : "Lotion will switch back to the custom tab bar the next time you launch.",
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
    cancelId: 1,
  }).then((result) => {
    if (result.response === 0) {
      // Defer to next tick so the dialog has a chance to fully dismiss
      // before we begin shutdown. Using app.quit() (not app.exit()) so
      // BrowserWindows and WebContentsViews get torn down properly —
      // app.exit() bypasses cleanup and has been seen to leave orphan
      // renderer processes that have to be killed manually.
      setImmediate(() => {
        app.relaunch();
        app.quit();
      });
    }
  });
}

// Preferences dialog - This needs to be callable, perhaps via an IPC call handled by AppController
function showPreferencesDialog() {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (!focusedWindow) {
    log.warn('showPreferencesDialog: No focused window to show dialog against.');
    return;
  }

  const menuBarVisible = localStore.get('menuBarVisible', true);
  const autoHideMenuBar = localStore.get('autoHideMenuBar', false);

  const options = {
    type: 'info',
    title: 'Lotion Preferences',
    message: 'Menu Bar Settings',
    detail: `Current Settings:
• Menu Bar Visible: ${menuBarVisible ? 'Yes' : 'No'}
• Auto-Hide Menu Bar: ${autoHideMenuBar ? 'Yes' : 'No'}

Keyboard Shortcuts:
• Ctrl+Shift+M: Toggle Menu Bar Visibility
• Ctrl+Alt+M: Toggle Auto-Hide Menu Bar
• Alt: Show Menu Bar (when auto-hide is enabled)

Note: Changes are saved automatically when using the View menu or keyboard shortcuts.`,
    buttons: ['Close', 'Reset to Defaults'],
    defaultId: 0
  };

  dialog.showMessageBox(focusedWindow, options).then((result) => {
    if (result.response === 1) {
      localStore.set('menuBarVisible', true);
      localStore.set('autoHideMenuBar', false);
      if (focusedWindow) {
        focusedWindow.setMenuBarVisibility(true);
        focusedWindow.setAutoHideMenuBar(false);
      }
      createNativeMenuWithNavigation(); // Recreate menu to update labels
      dialog.showMessageBox(focusedWindow, {
        type: 'info',
        title: 'Preferences Reset',
        message: 'Menu bar preferences have been reset to defaults.'
      });
    }
  });
}

// Menu bar control functions - These should operate on the focused window
function toggleMenuBarVisibility() {
  const focusedWC = appController.getFocusedWindowController();
  const focusedWindow = focusedWC?.getInternalBrowserWindow();
  if (!focusedWindow) return;

  const isVisible = focusedWindow.isMenuBarVisible();
  const newVisibility = !isVisible;

  focusedWindow.setMenuBarVisibility(newVisibility);
  localStore.set('menuBarVisible', newVisibility);
  createNativeMenuWithNavigation(); // Recreate menu to update labels
}

function toggleAutoHideMenuBar() {
  const focusedWC = appController.getFocusedWindowController();
  const focusedWindow = focusedWC?.getInternalBrowserWindow();
  if (!focusedWindow) return;

  const autoHide = focusedWindow.isMenuBarAutoHide();
  const newAutoHide = !autoHide;

  focusedWindow.setAutoHideMenuBar(newAutoHide);
  localStore.set('autoHideMenuBar', newAutoHide);

  if (newAutoHide) {
    focusedWindow.setMenuBarVisibility(true);
    localStore.set('menuBarVisible', true);
  }
  createNativeMenuWithNavigation(); // Recreate menu to update labels
}

// Create a native menu with navigation controls
function createNativeMenuWithNavigation() {
  const focusedWC = appController.getFocusedWindowController();
  const focusedWindow = focusedWC?.getInternalBrowserWindow();

  const template = [
    {
      label: 'Lotion',
      submenu: [
        {
          label: 'About Lotion',
          click: () => {
            if (focusedWindow) {
              dialog.showMessageBox(focusedWindow, {
                type: 'info',
                title: 'About Lotion',
                message: 'Lotion',
                detail: 'Unofficial Notion.so Desktop app for Linux\nVersion ' + app.getVersion()
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => { showPreferencesDialog(); }
        },
        {
          label: 'Use Native Window Decorations',
          type: 'checkbox',
          checked: localStore.get('useNativeWindowFrame', false),
          click: (menuItem) => toggleNativeWindowFrame(menuItem.checked),
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => { appController.requestQuit(); }
        }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => { focusedWC?.getInternalBrowserWindow()?.webContents.goBack(); }
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => { focusedWC?.getInternalBrowserWindow()?.webContents.goForward(); }
        },
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => { focusedWC?.getInternalBrowserWindow()?.webContents.reload(); }
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+H',
          click: () => { focusedWC?.loadURL(config.domainBaseUrl); }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const wc = focusedWC?.getActiveTabController()?.webContentsView?.webContents;
            if (wc) wc.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: () => {
            const wc = focusedWC?.getActiveTabController()?.webContentsView?.webContents;
            if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
          }
        },
        {
          // Hidden alias so US-layout users pressing Ctrl + + (i.e. Ctrl+Shift+=) still trigger zoom in
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Shift+=',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click: () => {
            const wc = focusedWC?.getActiveTabController()?.webContentsView?.webContents;
            if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const wc = focusedWC?.getActiveTabController()?.webContentsView?.webContents;
            if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5);
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: focusedWindow?.isMenuBarVisible() ? 'Hide Menu Bar' : 'Show Menu Bar',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: toggleMenuBarVisibility
        },
        {
          label: focusedWindow?.isMenuBarAutoHide() ? 'Disable Auto-Hide Menu Bar' : 'Enable Auto-Hide Menu Bar',
          accelerator: 'CmdOrCtrl+Alt+M',
          click: toggleAutoHideMenuBar
        },
        { type: 'separator' },
        {
          label: 'Toggle Menu Bar (Alt Key)',
          accelerator: 'Alt',
          click: () => {
            if (!focusedWindow) return;
            const isVisible = focusedWindow.isMenuBarVisible();
            const autoHide = focusedWindow.isMenuBarAutoHide();

            if (autoHide) {
              focusedWindow.setMenuBarVisibility(true);
            } else {
              toggleMenuBarVisibility();
            }
          }
        },
        { type: 'separator' },
        getSpellCheckMenu(appController)
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // For development, you might want to ignore certificate errors
  // In production, you should handle this properly
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Auto updater events (for future use)
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
  autoUpdater.quitAndInstall();
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

// Window control handlers
ipcMain.handle('window-minimize', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow) {
    focusedWindow.minimize();
  }
});

ipcMain.handle('window-toggle-maximize', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow) {
    focusedWindow.close();
  }
});

// Open external URL in default browser
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
  return { success: true };
});

// Get current theme
ipcMain.handle('get-current-theme', () => {
  const store = new Store();
  return store.get('theme', 'default');
});

// Show logo menu as native popup
ipcMain.handle('show-logo-menu', async (event) => {
  const { Menu, shell } = require('electron');
  const focusedWindowController = appController.getFocusedWindowController();

  if (!focusedWindowController) {
    return { success: false, error: 'No focused window' };
  }

  // Get current spell check setting
  const store = new Store();
  const spellCheckEnabled = store.get('spellCheckEnabled', true); // Default to enabled
  const currentTheme = store.get('theme', 'default'); // Default to Notion's default theme
  const restoreTabsOnStartup = store.get('restoreTabsOnStartup', false);

  // Theme switcher helper function
  const switchTheme = async (themeName) => {
    store.set('theme', themeName);
    console.log(`Switching theme to: ${themeName}`);

    // Match Notion's "use system setting" detection to the theme so
    // its prefers-color-scheme media queries flip appropriately.
    const themeMode = (themes.find((t) => t.id === themeName) || {}).mode || 'system';
    require('electron').nativeTheme.themeSource = themeMode;

    // Apply theme to all tabs in focused window
    if (focusedWindowController) {
      const windowId = focusedWindowController.windowId;
      const tabManager = require('./managers/TabManager').getInstance();

      // Notify tab bar about theme change
      if (focusedWindowController.tabBarView && focusedWindowController.tabBarView.webContents) {
        focusedWindowController.tabBarView.webContents.send('tab-bar:theme-changed', themeName);
        console.log(`Sent theme change to tab bar: ${themeName}`);
      }

      // Get all tabs and filter by window
      const allTabs = tabManager.getAllTabs();
      const tabs = allTabs.filter(tab => tab.windowId === windowId);

      console.log(`Found ${tabs.length} tabs to apply theme to`);

      for (const tabController of tabs) {
        // Reload the page to apply theme
        if (tabController.webContentsView && tabController.webContentsView.webContents) {
          tabController.webContentsView.webContents.reload();
        }
      }
    }
  };

  // Use `type: 'checkbox'` rather than 'radio' because Electron's
  // radio behavior in popup menus on Linux/GTK doesn't reliably
  // reset sibling state across menu instances — we ended up showing
  // multiple "checked" themes after the user picked several in a
  // row. Each menu open rebuilds the items fresh, so a single
  // `checked: true` (the current theme) renders correctly.
  // `mode` drives nativeTheme.themeSource so Notion's "use system
  // setting" auto-switches between its own light/dark mode to match
  // the theme intent — keeps our --c-* overrides applied to the right
  // base palette.
  const themes = [
    { id: 'default', label: 'Default', mode: 'system' },
    { id: 'dracula', label: 'Dracula', mode: 'dark' },
    { id: 'nord', label: 'Nord', mode: 'dark' },
    { id: 'gruvbox-dark', label: 'Gruvbox Dark', mode: 'dark' },
    { id: 'monokai', label: 'Monokai', mode: 'dark' },
    { id: 'noir', label: 'Noir', mode: 'dark' },
    { id: 'catppuccin-mocha', label: 'Catppuccin Mocha', mode: 'dark' },
    { id: 'catppuccin-macchiato', label: 'Catppuccin Macchiato', mode: 'dark' },
    { id: 'catppuccin-frappe', label: 'Catppuccin Frappe', mode: 'dark' },
    { id: 'catppuccin-latte', label: 'Catppuccin Latte', mode: 'light' },
    { id: 'sakura', label: 'Sakura', mode: 'light' },
  ];

  const themeSubmenu = themes.map((t) => ({
    label: t.label,
    type: 'checkbox',
    checked: currentTheme === t.id,
    click: () => switchTheme(t.id),
  }));

  const applySpellCheckToTabs = (enabled) => {
    if (!focusedWindowController) return;
    const tabManager = require('./managers/TabManager').getInstance();
    const tabs = tabManager.getTabsForWindow(focusedWindowController.windowId);
    tabs.forEach((tabController) => {
      const wc = tabController.webContentsView?.webContents;
      if (wc) wc.session.setSpellCheckerEnabled(enabled);
    });
  };

  const menu = Menu.buildFromTemplate([
    {
      label: `Lotion v${app.getVersion()}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Spell Check',
      type: 'checkbox',
      checked: spellCheckEnabled,
      click: (menuItem) => {
        store.set('spellCheckEnabled', menuItem.checked);
        applySpellCheckToTabs(menuItem.checked);
      },
    },
    {
      label: 'Restore Tabs on Startup',
      type: 'checkbox',
      checked: restoreTabsOnStartup,
      click: (menuItem) => {
        store.set('restoreTabsOnStartup', menuItem.checked);
      },
    },
    {
      label: 'Use Native Window Decorations',
      type: 'checkbox',
      checked: localStore.get('useNativeWindowFrame', false),
      click: (menuItem) => toggleNativeWindowFrame(menuItem.checked),
    },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: themeSubmenu,
    },
    {
      label: 'Reload Custom CSS',
      click: async () => {
        if (!focusedWindowController) return;
        const tabManager = require('./managers/TabManager').getInstance();
        const tabs = tabManager.getTabsForWindow(focusedWindowController.windowId);
        for (const tabController of tabs) {
          await tabController.reloadCustomCSS();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'About Lotion',
      click: () => {
        dialog.showMessageBox(focusedWindowController.browserWindow, {
          type: 'info',
          title: 'About Lotion',
          message: `Lotion ${app.getVersion()}`,
          detail: 'Unofficial Notion.so desktop client.\n\nhttps://github.com/puneetsl/lotion',
          buttons: ['Close', 'Open GitHub'],
          defaultId: 0,
          cancelId: 0,
        }).then((result) => {
          if (result.response === 1) {
            shell.openExternal('https://github.com/puneetsl/lotion');
          }
        });
      },
    },
    {
      label: 'Help & GitHub',
      submenu: [
        {
          label: 'Star on GitHub',
          click: () => shell.openExternal('https://github.com/puneetsl/lotion'),
        },
        {
          label: 'Follow @puneetsl',
          click: () => shell.openExternal('https://github.com/puneetsl'),
        },
        { type: 'separator' },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/puneetsl/lotion/issues/new'),
        },
      ],
    },
  ]);

  // Popup the menu at the mouse cursor position
  menu.popup({
    window: focusedWindowController.browserWindow
  });

  return { success: true };
});

// Navigation handlers
ipcMain.handle('navigation-back', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow && focusedWindow.webContents.navigationHistory.canGoBack()) {
    focusedWindow.webContents.navigationHistory.goBack();
  }
});

ipcMain.handle('navigation-forward', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow && focusedWindow.webContents.navigationHistory.canGoForward()) {
    focusedWindow.webContents.navigationHistory.goForward();
  }
});

ipcMain.handle('navigation-refresh', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  if (focusedWindow) {
    focusedWindow.webContents.reload();
  }
});

// Menu bar control handlers
ipcMain.handle('menu-bar-toggle-visibility', () => {
  toggleMenuBarVisibility();
});

ipcMain.handle('menu-bar-toggle-auto-hide', () => {
  toggleAutoHideMenuBar();
});

ipcMain.handle('menu-bar-get-status', () => {
  const focusedWindow = appController.getFocusedWindowController()?.getInternalBrowserWindow();
  return {
    visible: focusedWindow ? focusedWindow.isMenuBarVisible() : true,
    autoHide: focusedWindow ? focusedWindow.isMenuBarAutoHide() : false
  };
});

ipcMain.handle('preferences-show', () => {
  showPreferencesDialog();
});

// --- Tab Bar IPC Handlers --- //

// Get initial tab state for tab bar renderer
ipcMain.handle('tab-bar:get-initial-state', (event) => {
  const webContents = event.sender;

  // Find which window this tab bar belongs to
  let windowController = null;
  for (const wc of appController.windowControllers.values()) {
    if (wc.tabBarView && wc.tabBarView.webContents === webContents) {
      windowController = wc;
      break;
    }
  }

  if (!windowController) {
    log.warn('Tab bar requested initial state but could not find parent window');
    return { tabs: [], activeTabId: null, windowId: null };
  }

  // Get tabs for this window from Redux state
  const state = reduxStore.getState();
  const windowState = state.windows.windows[windowController.windowId];

  if (!windowState) {
    return { tabs: [], activeTabId: null, windowId: windowController.windowId };
  }

  // Build tab list with details
  const tabs = windowState.tabIds.map((tabId) => {
    const tabState = state.tabs.tabs[tabId];
    return tabState || { tabId };
  });

  return {
    tabs,
    activeTabId: windowState.activeTabId,
    windowId: windowController.windowId,
  };
});

// Create new tab
ipcMain.handle('tab-bar:create-tab', async (event, options = {}) => {
  const webContents = event.sender;

  // Find parent window
  let windowController = null;
  for (const wc of appController.windowControllers.values()) {
    if (wc.tabBarView && wc.tabBarView.webContents === webContents) {
      windowController = wc;
      break;
    }
  }

  if (!windowController) {
    log.warn('Tab bar create-tab: could not find parent window');
    return { success: false };
  }

  const TabManager = require('./managers/TabManager');
  const tabManager = TabManager.getInstance();

  const tabController = tabManager.createTab({
    windowId: windowController.windowId,
    url: options.url || config.domainBaseUrl,
    title: options.title || 'New Tab',
    makeActive: true,
  });

  // Switch to the new tab
  windowController.setActiveTab(tabController);

  // Notify tab bar of update
  notifyTabBarUpdate(windowController.windowId);

  return { success: true, tabId: tabController.tabId };
});

// Close tab
ipcMain.handle('tab-bar:close-tab', async (event, tabId) => {
  const TabManager = require('./managers/TabManager');
  const tabManager = TabManager.getInstance();

  const tabController = tabManager.getTab(tabId);
  if (!tabController) {
    log.warn(`Cannot close tab ${tabId}: not found`);
    return { success: false };
  }

  const windowId = tabController.windowId;
  const windowController = appController.windowControllers.get(windowId);

  // Destroy the tab
  tabManager.destroyTab(tabId);

  // If this was the active tab, switch to another tab
  if (windowController && windowController.currentActiveTabController?.tabId === tabId) {
    const state = reduxStore.getState();
    const windowState = state.windows.windows[windowId];

    if (windowState && windowState.tabIds.length > 0) {
      // Switch to first available tab
      const nextTabId = windowState.tabIds[0];
      windowController.switchToTab(nextTabId);
    }
  }

  // Notify tab bar of update
  if (windowController) {
    notifyTabBarUpdate(windowId);
  }

  return { success: true };
});

// Switch to tab
ipcMain.handle('tab-bar:switch-tab', async (event, tabId) => {
  const TabManager = require('./managers/TabManager');
  const tabManager = TabManager.getInstance();

  const tabController = tabManager.getTab(tabId);
  if (!tabController) {
    log.warn(`Cannot switch to tab ${tabId}: not found`);
    return { success: false };
  }

  const windowController = appController.windowControllers.get(tabController.windowId);
  if (windowController) {
    windowController.switchToTab(tabId);
    return { success: true };
  }

  return { success: false };
});

// Reorder tabs
ipcMain.handle('tab-bar:reorder-tabs', async (event, { windowId, tabIds }) => {
  const { reorderTabsInWindow } = require('./store/slices/windowsSlice');
  reduxStore.dispatch(reorderTabsInWindow({ windowId, tabIds }));

  notifyTabBarUpdate(windowId);
  return { success: true };
});

// Pin tab
ipcMain.handle('tab-bar:pin-tab', async (event, tabId) => {
  const { pinTab } = require('./store/slices/tabsSlice');
  reduxStore.dispatch(pinTab(tabId));

  const TabManager = require('./managers/TabManager');
  const tabManager = TabManager.getInstance();
  const tabController = tabManager.getTab(tabId);

  if (tabController) {
    notifyTabBarUpdate(tabController.windowId);
  }

  return { success: true };
});

// Navigate back in active tab
ipcMain.handle('tab-bar:navigate-back', async (event) => {
  const focusedWindowController = appController.getFocusedWindowController();
  if (focusedWindowController && focusedWindowController.currentActiveTabController) {
    const webContents = focusedWindowController.currentActiveTabController.webContentsView.webContents;
    if (webContents.canGoBack()) {
      webContents.goBack();
    }
  }
  return { success: true };
});

// Navigate forward in active tab
ipcMain.handle('tab-bar:navigate-forward', async (event) => {
  const focusedWindowController = appController.getFocusedWindowController();
  if (focusedWindowController && focusedWindowController.currentActiveTabController) {
    const webContents = focusedWindowController.currentActiveTabController.webContentsView.webContents;
    if (webContents.canGoForward()) {
      webContents.goForward();
    }
  }
  return { success: true };
});

// Refresh active tab
ipcMain.handle('tab-bar:refresh', async (event) => {
  const focusedWindowController = appController.getFocusedWindowController();
  if (focusedWindowController && focusedWindowController.currentActiveTabController) {
    const webContents = focusedWindowController.currentActiveTabController.webContentsView.webContents;
    webContents.reload();
  }
  return { success: true };
});

// Unpin tab
ipcMain.handle('tab-bar:unpin-tab', async (event, tabId) => {
  const { unpinTab } = require('./store/slices/tabsSlice');
  reduxStore.dispatch(unpinTab(tabId));

  const TabManager = require('./managers/TabManager');
  const tabManager = TabManager.getInstance();
  const tabController = tabManager.getTab(tabId);

  if (tabController) {
    notifyTabBarUpdate(tabController.windowId);
  }

  return { success: true };
});

// Helper function to notify tab bar of updates
function notifyTabBarUpdate(windowId) {
  const windowController = appController.windowControllers.get(windowId);
  if (!windowController || !windowController.tabBarView) return;

  const state = reduxStore.getState();
  const windowState = state.windows.windows[windowId];

  if (!windowState) return;

  // Build tab list
  const tabs = windowState.tabIds.map((tabId) => {
    const tabState = state.tabs.tabs[tabId];
    return tabState || { tabId };
  });

  // Send update to tab bar
  windowController.tabBarView.webContents.send('tab-bar:tabs-updated', { tabs });

  // Send active tab update
  if (windowState.activeTabId) {
    windowController.tabBarView.webContents.send('tab-bar:tab-activated', windowState.activeTabId);
  }
}

// Add command line switches to potentially reduce graphics errors on Linux
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Subscribe to Redux state changes to update UI
let previousTabsState = {};
let previousActiveTabsState = {};
reduxStore.subscribe(() => {
  const state = reduxStore.getState();

  // Recreate menu when spell check dictionaries change
  createNativeMenuWithNavigation();

  // Notify tab bars when tab data changes (titles, favicons, etc.)
  const currentTabsState = state.tabs.tabs;

  // Notify tab bars when the active tab changes — the per-window activeTabId
  // lives in state.windows, not state.tabs, so we need to watch it separately
  // or tab clicks won't update the highlighted tab in the bar.
  const currentActiveTabsState = {};
  for (const [wid, w] of Object.entries(state.windows.windows || {})) {
    currentActiveTabsState[wid] = w.activeTabId;
  }

  const tabsChanged = JSON.stringify(currentTabsState) !== JSON.stringify(previousTabsState);
  const activeChanged = JSON.stringify(currentActiveTabsState) !== JSON.stringify(previousActiveTabsState);

  if (tabsChanged || activeChanged) {
    previousTabsState = { ...currentTabsState };
    previousActiveTabsState = currentActiveTabsState;

    for (const windowController of appController.windowControllers.values()) {
      if (windowController.tabBarView && windowController.tabBarView.webContents) {
        notifyTabBarUpdate(windowController.windowId);
      }
    }
  }
});
