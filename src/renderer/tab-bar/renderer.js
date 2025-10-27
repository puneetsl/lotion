// Tab Bar Renderer - Vanilla JS version (no React bundling needed)
// This runs in a separate renderer process from the tab content

let tabs = [];
let activeTabId = null;
let windowId = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialState();
  setupEventListeners();
  detectTheme();
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
}

// Render tab bar UI
function render() {
  const container = document.getElementById('root');
  if (!container) return;

  container.innerHTML = `
    <div class="tab-bar">
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

  return `
    <div class="tab ${isActive ? 'active' : ''} ${isPinned ? 'pinned' : ''}"
         data-tab-id="${tab.tabId}"
         title="${tab.title || 'Untitled'}">
      ${tab.favicon ? `<img src="${tab.favicon}" class="favicon" alt="">` : ''}
      <span class="tab-title">${title}</span>
      ${!isPinned ? `<button class="close-btn" data-tab-id="${tab.tabId}" title="Close Tab">×</button>` : ''}
    </div>
  `;
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
