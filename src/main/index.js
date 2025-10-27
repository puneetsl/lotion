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

// Import config (still needed for WindowController's default URL)
const config = require('../../config/config.json');

// Initialize store for user preferences (localStore for menu bar visibility etc.)
const localStore = new Store({
  defaults: {
    menuBarVisible: true,
    autoHideMenuBar: false
  }
});

// --- Initialize spell check dictionaries in Redux from electron-store before anything else ---
const spellCheckDictionaries = localStore.get('spellCheckDictionaries', ['en-US']);
reduxStore.dispatch({ type: 'app/setDictionaries', payload: spellCheckDictionaries });

// Instantiate AppController (singleton)
const appController = new AppController(reduxStore);
appController.init(); // Initialize AppController event handlers

// --- Helper Functions --- //

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
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
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

// Add command line switches to potentially reduce graphics errors on Linux
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Subscribe to Redux state changes to update menu when needed
reduxStore.subscribe(() => {
  // Recreate menu when spell check dictionaries change
  createNativeMenuWithNavigation();
});
