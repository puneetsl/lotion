// Tab Bar Renderer - Vanilla JS version (no React bundling needed)
// This runs in a separate renderer process from the tab content

let tabs = [];
let activeTabId = null;
let windowId = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialState();
  setupEventListeners();
  await loadInitialTheme();
  render();
});

// Load initial state from main process
async function loadInitialState() {
  try {
    const state = await window.tabBarAPI.getInitialState();
    tabs = state.tabs || [];
    activeTabId = state.activeTabId || null;
    windowId = state.windowId || null;
    console.log('Tab bar loaded:', { tabs, activeTabId, windowId });
  } catch (error) {
    console.error('Failed to load initial tab state:', error);
  }
}

// Setup IPC event listeners
function setupEventListeners() {
  // Listen for tab updates from main process
  window.tabBarAPI.onTabsUpdated((data) => {
    tabs = data.tabs;
    render();
  });

  window.tabBarAPI.onTabActivated((tabId) => {
    activeTabId = tabId;
    render();
  });

  // Listen for theme changes
  if (window.tabBarAPI.onThemeChanged) {
    window.tabBarAPI.onThemeChanged((themeName) => {
      console.log('Theme changed to:', themeName);
      applyLotionTheme(themeName);
    });
  }
}

// Render tab bar UI
function render() {
  const container = document.getElementById('root');
  if (!container) return;

  container.innerHTML = `
    <div class="tab-bar">
      <div class="nav-controls">
        <div class="app-logo" id="app-logo" title="Lotion">
          <img src="./logo.png" alt="L" style="width: 100%; height: 100%;" onerror="this.parentElement.textContent='L'">
        </div>
        <button class="nav-btn" id="back-btn" title="Go Back">‹</button>
        <button class="nav-btn" id="forward-btn" title="Go Forward">›</button>
        <button class="nav-btn" id="refresh-btn" title="Refresh">↻</button>
      </div>
      <div class="tab-list">
        ${tabs.map(tab => renderTab(tab)).join('')}
        <button class="new-tab-btn" id="new-tab-btn" title="New Tab">+</button>
      </div>
      <div class="window-controls">
        <button class="window-control-btn minimize" id="minimize-btn" title="Minimize">−</button>
        <button class="window-control-btn maximize" id="maximize-btn" title="Maximize">□</button>
        <button class="window-control-btn close" id="close-btn" title="Close">×</button>
      </div>
    </div>
  `;

  // Add event listeners after rendering
  addEventListeners();
}

// Render individual tab
function renderTab(tab) {
  const isActive = tab.tabId === activeTabId;
  const isPinned = tab.isPinned;
  const title = truncateTitle(tab.title || 'New Tab', 20);

  // Use favicon if available, otherwise show a default icon or emoji
  const faviconHtml = tab.favicon
    ? `<img src="${escapeHtml(tab.favicon)}" class="favicon" alt="" onerror="this.style.display='none'">`
    : '<span class="favicon">📄</span>';

  return `
    <div class="tab ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''}"
         data-tab-id="${tab.tabId}"
         title="${escapeHtml(tab.title || 'Untitled')}">
      ${faviconHtml}
      <span class="tab-title">${escapeHtml(title)}</span>
      ${!isPinned ? `<button class="close-btn" data-tab-id="${tab.tabId}" title="Close Tab">×</button>` : ''}
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add click event listeners
function addEventListeners() {
  // Tab click - switch to tab
  document.querySelectorAll('.tab').forEach(tabEl => {
    tabEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('close-btn')) {
        const tabId = tabEl.dataset.tabId;
        window.tabBarAPI.switchTab(tabId);
      }
    });
  });

  // Close button click
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabId = btn.dataset.tabId;
      window.tabBarAPI.closeTab(tabId);
    });
  });

  // New tab button click
  const newTabBtn = document.getElementById('new-tab-btn');
  if (newTabBtn) {
    newTabBtn.addEventListener('click', () => {
      window.tabBarAPI.createTab({ windowId });
    });
  }

  // Navigation buttons
  const backBtn = document.getElementById('back-btn');
  const forwardBtn = document.getElementById('forward-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.tabBarAPI.navigateBack();
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      window.tabBarAPI.navigateForward();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.tabBarAPI.refresh();
    });
  }

  // Window control buttons
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      window.tabBarAPI.minimizeWindow();
    });
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      window.tabBarAPI.maximizeWindow();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.tabBarAPI.closeWindow();
    });
  }

  // Logo menu - show native popup menu
  const appLogo = document.getElementById('app-logo');

  if (appLogo) {
    appLogo.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.tabBarAPI.showLogoMenu();
    });
  }
}

// Utility function to truncate long titles
function truncateTitle(title, maxLength) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

// Detect and apply theme
function detectTheme() {
  // Check system dark mode preference
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply theme
  applyTheme(prefersDark);

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      applyTheme(e.matches);
    });
  }
}

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function applyLotionTheme(themeName) {
  // Remove all theme classes
  document.body.classList.remove('dark-mode', 'theme-dracula', 'theme-nord', 'theme-gruvbox-dark', 'theme-catppuccin-mocha', 'theme-catppuccin-macchiato', 'theme-catppuccin-frappe', 'theme-catppuccin-latte');

  // Apply new theme class (default theme has no class)
  if (themeName && themeName !== 'default' && themeName !== 'none') {
    document.body.classList.add(`theme-${themeName}`);
  } else {
    // If theme is default, apply system theme
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
}

async function loadInitialTheme() {
  try {
    if (window.tabBarAPI.getTheme) {
      const theme = await window.tabBarAPI.getTheme();
      console.log('Initial theme loaded:', theme);
      applyLotionTheme(theme);
    }
  } catch (error) {
    console.error('Failed to load initial theme:', error);
  }
}
