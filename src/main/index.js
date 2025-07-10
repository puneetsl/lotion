// This file serves as the entry point for the main process
// Simple Notion desktop app for Linux

const { app, /* BrowserWindow, Menu, shell, dialog, */ ipcMain } = require('electron'); // Removed unused imports for now
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const Store = require('electron-store'); // This is electron-store, for persistence
const reduxStore = require('./store/store');
const AppController = require('./controllers/AppController');
const { getSpellCheckMenu } = require('./spellCheckMenu');

// Set custom user data path for development to avoid conflicts
if (process.env.NODE_ENV === 'development') {
  const devUserDataPath = path.join(app.getPath('userData'), '.. countertops-dev-data');
  app.setPath('userData', devUserDataPath);
  log.info(`Development mode: User data path set to ${devUserDataPath}`);
}

// Import config (still needed for WindowController's default URL)
const config = require('../../config/config.json');

// Initialize store for user preferences (localStore for menu bar visibility etc.)
// This might also move into Redux state later or be accessed via AppController.
const localStore = new Store({
  defaults: {
    menuBarVisible: true,
    autoHideMenuBar: false
  }
});

// --- Initialize spell check dictionaries in Redux from electron-store before anything else ---
const spellCheckDictionaries = localStore.get('spellCheckDictionaries', ['en-US']);
reduxStore.dispatch({ type: 'app/setDictionaries', payload: spellCheckDictionaries });

// let mainWindow; // No longer managed here
// let isQuitting = false; // Managed by AppController

// Instantiate AppController (singleton)
const appController = new AppController(reduxStore);
appController.init(); // Initialize AppController event handlers


// --- All functions below are candidates for refactoring or removal --- //
// --- as their responsibilities move to controllers or Redux state --- //

// createWindow() - Removed, functionality moved to WindowController via AppController.createNewWindow()

// Preferences dialog - This needs to be callable, perhaps via an IPC call handled by AppController
// or a method on AppController that can access the focused WindowController's BrowserWindow.
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
    // ... (rest of the options as before)
    detail: `Current Settings:\n• Menu Bar Visible: ${menuBarVisible ? 'Yes' : 'No'}\n• Auto-Hide Menu Bar: ${autoHideMenuBar ? 'Yes' : 'No'}\n\nKeyboard Shortcuts:\n• Ctrl+Shift+M: Toggle Menu Bar Visibility\n• Ctrl+Alt+M: Toggle Auto-Hide Menu Bar\n• Alt: Show Menu Bar (when auto-hide is enabled)\n\nNote: Changes are saved automatically when using the View menu or keyboard shortcuts.`,
    buttons: ['Close', 'Reset to Defaults'],
    defaultId: 0
  };

  require('electron').dialog.showMessageBox(focusedWindow, options).then((result) => {
    if (result.response === 1) {
      localStore.set('menuBarVisible', true);
      localStore.set('autoHideMenuBar', false);
      if (focusedWindow) {
        focusedWindow.setMenuBarVisibility(true);
        focusedWindow.setAutoHideMenuBar(false);
      }
      createNativeMenuWithNavigation(); // Recreate menu to update labels
      require('electron').dialog.showMessageBox(focusedWindow, {
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
  localStore.set('menuBarVisible', newVisibility); // This preference might move to Redux
  createNativeMenuWithNavigation(); // Recreate menu to update labels
}

function toggleAutoHideMenuBar() {
  const focusedWC = appController.getFocusedWindowController();
  const focusedWindow = focusedWC?.getInternalBrowserWindow();
  if (!focusedWindow) return;
  
  const autoHide = focusedWindow.isMenuBarAutoHide();
  const newAutoHide = !autoHide;
  
  focusedWindow.setAutoHideMenuBar(newAutoHide);
  localStore.set('autoHideMenuBar', newAutoHide); // This preference might move to Redux
  
  if (newAutoHide) {
    focusedWindow.setMenuBarVisibility(true);
    localStore.set('menuBarVisible', true);
  }
  createNativeMenuWithNavigation(); // Recreate menu to update labels
}

// Create a native menu with navigation controls
// This function will need access to the currently focused WindowController or its BrowserWindow
function createNativeMenuWithNavigation() {
  const focusedWC = appController.getFocusedWindowController();
  const focusedWindow = focusedWC?.getInternalBrowserWindow();
  // Some menu items depend on mainWindow existing. For now, we adapt.
  // Ideally, AppController provides context or WindowController manages its own menu aspects.

  const template = [
    {
      label: 'Lotion',
      submenu: [
        {
          label: 'About Lotion',
          click: () => {
            if (focusedWindow) {
              require('electron').dialog.showMessageBox(focusedWindow, {
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
          click: () => { appController.requestQuit()}
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
          click: () => { focusedWC?.loadURL(config.domainBaseUrl); } // Use WC method if available
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, // This will reload the focused window's content
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: focusedWindow && focusedWindow.isMenuBarVisible() ? 'Hide Menu Bar' : 'Show Menu Bar',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: toggleMenuBarVisibility
        },
        {
          label: focusedWindow && focusedWindow.isMenuBarAutoHide() ? 'Disable Auto-Hide Menu Bar' : 'Enable Auto-Hide Menu Bar',
          accelerator: 'CmdOrCtrl+Alt+M',
          click: toggleAutoHideMenuBar
        },
        { type: 'separator' },
        {
          label: 'Toggle Menu Bar (Alt Key)',
          accelerator: 'Alt',
          click: () => {
            if (focusedWindow) {
              const isVisible = focusedWindow.isMenuBarVisible();
              const autoHide = focusedWindow.isMenuBarAutoHide();
              if (autoHide) { focusedWindow.setMenuBarVisibility(true); }
              else { toggleMenuBarVisibility(); }
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' }, // Operates on focused window
        { role: 'close' }      // Operates on focused window
      ]
    },
    {
      label: 'Settings',
      submenu: [
        getSpellCheckMenu(appController)
      ]
    }
  ];

  const menu = require('electron').Menu.buildFromTemplate(template);
  require('electron').Menu.setApplicationMenu(menu);
  
  // Initial call for menu bar visibility based on preferences when app starts or new window created.
  // This needs to be re-evaluated. WindowController.init could set its own menu bar state.
  if (focusedWindow) {
      const menuBarVisible = localStore.get('menuBarVisible', true);
      const autoHideMenuBar = localStore.get('autoHideMenuBar', false);
      focusedWindow.setMenuBarVisibility(menuBarVisible);
      focusedWindow.setAutoHideMenuBar(autoHideMenuBar);
  }
}

// Initial menu creation. This should ideally be triggered after the first window is ready.
// AppController's ready handler is a good place, or after the first WindowController.init().
app.on('ready', () => {
    createNativeMenuWithNavigation(); 
});


// updateWindowTitle() - This logic has been moved to WindowController's page-title-updated listener.

// App lifecycle events (whenReady, window-all-closed, activate, before-quit) are now in AppController.

// Security: Prevent new window creation - This should also be managed by AppController or WindowController
// For now, keeping it here. WindowController's setWindowOpenHandler covers its own webContents.
app.on('web-contents-created', (event, contents) => {
  // This is a global handler. If we want to restrict only non-app windows:
  // if (contents.hostWebContents && contents.hostWebContents.id === focusedWindow?.webContents.id) { ... }
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors - Potentially AppController concern
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Auto updater events - AppController concern
autoUpdater.on('checking-for-update', () => { log.info('Checking for update...'); });
autoUpdater.on('update-available', (info) => { log.info('Update available.'); });
autoUpdater.on('update-not-available', (info) => { log.info('Update not available.'); });
autoUpdater.on('error', (err) => { log.error('Error in auto-updater. ' + err); });
autoUpdater.on('download-progress', (progressObj) => { /* ... */ });
autoUpdater.on('update-downloaded', (info) => { log.info('Update downloaded'); autoUpdater.quitAndInstall(); });

// IPC handlers for communication with renderer process
// Some of these might move to AppController or be handled by WindowControllers directly via webContents IPC.
ipcMain.handle('get-config', () => { return config; });
ipcMain.handle('get-version', () => { return app.getVersion(); });

// Window control handlers - These should be routed to the focused WindowController
ipcMain.handle('window-minimize', () => { appController.getFocusedWindowController()?.getInternalBrowserWindow()?.minimize(); });
ipcMain.handle('window-toggle-maximize', () => {
  const wc = appController.getFocusedWindowController();
  const win = wc?.getInternalBrowserWindow();
  if (win) { win.isMaximized() ? win.unmaximize() : win.maximize(); }
});
ipcMain.handle('window-close', () => { appController.getFocusedWindowController()?.getInternalBrowserWindow()?.close(); });

// Navigation handlers - Route to focused WindowController
ipcMain.handle('navigation-back', () => { appController.getFocusedWindowController()?.getInternalBrowserWindow()?.webContents.goBack(); });
ipcMain.handle('navigation-forward', () => { appController.getFocusedWindowController()?.getInternalBrowserWindow()?.webContents.goForward(); });
ipcMain.handle('navigation-refresh', () => { appController.getFocusedWindowController()?.getInternalBrowserWindow()?.webContents.reload(); });

// Menu bar control handlers from IPC - Route to functions that use focused WindowController
ipcMain.handle('menu-bar-toggle-visibility', toggleMenuBarVisibility);
ipcMain.handle('menu-bar-toggle-auto-hide', toggleAutoHideMenuBar);
ipcMain.handle('menu-bar-get-status', () => {
  const wc = appController.getFocusedWindowController();
  const win = wc?.getInternalBrowserWindow();
  return {
    visible: win ? win.isMenuBarVisible() : true,
    autoHide: win ? win.isMenuBarAutoHide() : false
  };
});
ipcMain.handle('preferences-show', showPreferencesDialog);


// Export for testing - No longer exporting createWindow or getMainWindowInstance
// module.exports = { };

// Add command line switches
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');