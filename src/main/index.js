// This file serves as the entry point for the main process
// Simple Notion desktop app for Linux

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const Store = require('electron-store');

// Import config
const config = require('../../config/config.json');

// Initialize store for user preferences
const store = new Store({
  defaults: {
    menuBarVisible: true,
    autoHideMenuBar: false
  }
});

let mainWindow;
let isQuitting = false;

function createWindow() {
  // Create the browser window
  const getIconPath = () => {
    if (process.platform === 'linux') {
      return path.join(__dirname, '../../assets/icon.png');
    } else if (process.platform === 'win32') {
      return path.join(__dirname, '../../assets/icon.ico');
    } else if (process.platform === 'darwin') {
      return path.join(__dirname, '../../assets/icon.icns');
    }
    return path.join(__dirname, '../../assets/icon.png'); // fallback
  };

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: getIconPath(),
    // Use fully native title bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, '../renderer/preload.js')
    },
    show: false
  });

  // Create a simple native menu bar with navigation
  createNativeMenuWithNavigation();

  // Load Notion web app
  mainWindow.loadURL(config.domainBaseUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (process.platform === 'darwin') {
      app.dock.show();
    }

    // Apply saved menu bar preferences
    const menuBarVisible = store.get('menuBarVisible', true);
    const autoHideMenuBar = store.get('autoHideMenuBar', false);
    
    mainWindow.setMenuBarVisibility(menuBarVisible);
    mainWindow.setAutoHideMenuBar(autoHideMenuBar);

    // Just update the title, no toolbar injection
    updateWindowTitle();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== config.domainBaseUrl) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Update window title when navigation occurs
  mainWindow.webContents.on('did-navigate', () => {
    updateWindowTitle();
  });

  mainWindow.webContents.on('did-navigate-in-page', () => {
    updateWindowTitle();
  });

  mainWindow.webContents.on('page-title-updated', (event, title) => {
    event.preventDefault(); // Prevent default title setting
    const cleanTitle = title.replace(' | Notion', '').trim();
    mainWindow.setTitle(`${cleanTitle} - Lotion`);
  });
}

// Preferences dialog
function showPreferencesDialog() {
  const menuBarVisible = store.get('menuBarVisible', true);
  const autoHideMenuBar = store.get('autoHideMenuBar', false);
  
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

  dialog.showMessageBox(mainWindow, options).then((result) => {
    if (result.response === 1) {
      // Reset to defaults
      store.set('menuBarVisible', true);
      store.set('autoHideMenuBar', false);
      
      mainWindow.setMenuBarVisibility(true);
      mainWindow.setAutoHideMenuBar(false);
      
      // Recreate menu to update labels
      createNativeMenuWithNavigation();
      
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Preferences Reset',
        message: 'Menu bar preferences have been reset to defaults.'
      });
    }
  });
}

// Menu bar control functions
function toggleMenuBarVisibility() {
  if (!mainWindow) return;
  
  const isVisible = mainWindow.isMenuBarVisible();
  const newVisibility = !isVisible;
  
  mainWindow.setMenuBarVisibility(newVisibility);
  store.set('menuBarVisible', newVisibility);
  
  // Recreate menu to update the menu item text
  createNativeMenuWithNavigation();
}

function toggleAutoHideMenuBar() {
  if (!mainWindow) return;
  
  const autoHide = mainWindow.isMenuBarAutoHide();
  const newAutoHide = !autoHide;
  
  mainWindow.setAutoHideMenuBar(newAutoHide);
  store.set('autoHideMenuBar', newAutoHide);
  
  // If we're enabling auto-hide, make sure menu bar is visible first
  if (newAutoHide) {
    mainWindow.setMenuBarVisibility(true);
    store.set('menuBarVisible', true);
  }
  
  // Recreate menu to update the menu item text
  createNativeMenuWithNavigation();
}

// Create a native menu with navigation controls
function createNativeMenuWithNavigation() {
  const template = [
    {
      label: 'Lotion',
      submenu: [
        {
          label: 'About Lotion',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Lotion',
              message: 'Lotion',
              detail: 'Unofficial Notion.so Desktop app for Linux\nVersion 1.0.0'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            showPreferencesDialog();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Navigation',
      submenu: [
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow && mainWindow.webContents.navigationHistory.canGoBack()) {
              mainWindow.webContents.navigationHistory.goBack();
            }
          }
        },
        {
          label: 'Forward',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow && mainWindow.webContents.navigationHistory.canGoForward()) {
              mainWindow.webContents.navigationHistory.goForward();
            }
          }
        },
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Home',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            if (mainWindow) {
              mainWindow.loadURL(config.domainBaseUrl);
            }
          }
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
          label: mainWindow.isMenuBarVisible() ? 'Hide Menu Bar' : 'Show Menu Bar',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: toggleMenuBarVisibility
        },
        {
          label: mainWindow.isMenuBarAutoHide() ? 'Disable Auto-Hide Menu Bar' : 'Enable Auto-Hide Menu Bar',
          accelerator: 'CmdOrCtrl+Alt+M',
          click: toggleAutoHideMenuBar
        },
        { type: 'separator' },
        {
          label: 'Toggle Menu Bar (Alt Key)',
          accelerator: 'Alt',
          click: () => {
            // This provides the traditional Alt key behavior
            const isVisible = mainWindow.isMenuBarVisible();
            const autoHide = mainWindow.isMenuBarAutoHide();
            
            if (autoHide) {
              // If auto-hide is enabled, just show the menu temporarily
              mainWindow.setMenuBarVisibility(true);
            } else {
              // Toggle visibility and save preference
              toggleMenuBarVisibility();
            }
          }
        }
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
  
  // Menu bar visibility is now handled by preferences in ready-to-show event
}

// Simple window title update without script injection
async function updateWindowTitle() {
  try {
    // Get the page title without injecting scripts
    const title = await mainWindow.webContents.executeJavaScript('document.title', true);
    if (title) {
      const cleanTitle = title.replace(' | Notion', '').trim();
      mainWindow.setTitle(`${cleanTitle} - Lotion`);
    }
  } catch (error) {
    // Silently handle errors
    mainWindow.setTitle('Lotion - Notion Desktop');
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

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
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Navigation handlers
ipcMain.handle('navigation-back', () => {
  if (mainWindow && mainWindow.webContents.navigationHistory.canGoBack()) {
    mainWindow.webContents.navigationHistory.goBack();
  }
});

ipcMain.handle('navigation-forward', () => {
  if (mainWindow && mainWindow.webContents.navigationHistory.canGoForward()) {
    mainWindow.webContents.navigationHistory.goForward();
  }
});

ipcMain.handle('navigation-refresh', () => {
  if (mainWindow) {
    mainWindow.webContents.reload();
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
  return {
    visible: mainWindow ? mainWindow.isMenuBarVisible() : true,
    autoHide: mainWindow ? mainWindow.isMenuBarAutoHide() : false
  };
});

ipcMain.handle('preferences-show', () => {
  showPreferencesDialog();
});

// Export for testing
module.exports = { createWindow };

// Add command line switches to potentially reduce graphics errors on Linux
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer'); 