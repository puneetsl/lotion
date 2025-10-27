// Tab Bar Renderer - React-based UI for managing tabs
// This runs in a separate renderer process from the tab content

const React = require('react');
const ReactDOM = require('react-dom/client');

// Tab Bar Component
function TabBar() {
  const [tabs, setTabs] = React.useState([]);
  const [activeTabId, setActiveTabId] = React.useState(null);
  const [windowId, setWindowId] = React.useState(null);

  // Load initial state on mount
  React.useEffect(() => {
    async function loadInitialState() {
      try {
        const state = await window.tabBarAPI.getInitialState();
        setTabs(state.tabs || []);
        setActiveTabId(state.activeTabId || null);
        setWindowId(state.windowId || null);
      } catch (error) {
        console.error('Failed to load initial tab state:', error);
      }
    }

    loadInitialState();

    // Listen for tab updates from main process
    const unsubscribeTabsUpdated = window.tabBarAPI.onTabsUpdated((data) => {
      setTabs(data.tabs);
    });

    const unsubscribeTabActivated = window.tabBarAPI.onTabActivated((tabId) => {
      setActiveTabId(tabId);
    });

    return () => {
      unsubscribeTabsUpdated();
      unsubscribeTabActivated();
    };
  }, []);

  const handleCreateTab = () => {
    window.tabBarAPI.createTab({ windowId });
  };

  const handleCloseTab = (tabId, event) => {
    event.stopPropagation();
    window.tabBarAPI.closeTab(tabId);
  };

  const handleSwitchTab = (tabId) => {
    window.tabBarAPI.switchTab(tabId);
  };

  const handlePinTab = (tabId, event) => {
    event.stopPropagation();
    window.tabBarAPI.pinTab(tabId);
  };

  return React.createElement(
    'div',
    { style: styles.container },
    React.createElement(
      'div',
      { style: styles.tabList },
      tabs.map((tab) =>
        React.createElement(Tab, {
          key: tab.tabId,
          tab: tab,
          isActive: tab.tabId === activeTabId,
          onSwitch: () => handleSwitchTab(tab.tabId),
          onClose: (e) => handleCloseTab(tab.tabId, e),
          onPin: (e) => handlePinTab(tab.tabId, e),
        })
      ),
      React.createElement(
        'button',
        {
          style: styles.newTabButton,
          onClick: handleCreateTab,
          title: 'New Tab',
        },
        '+'
      )
    )
  );
}

// Individual Tab Component
function Tab({ tab, isActive, onSwitch, onClose, onPin }) {
  const tabStyle = {
    ...styles.tab,
    ...(isActive ? styles.tabActive : {}),
    ...(tab.isPinned ? styles.tabPinned : {}),
  };

  return React.createElement(
    'div',
    { style: tabStyle, onClick: onSwitch, title: tab.title || 'Untitled' },
    tab.favicon &&
      React.createElement('img', {
        src: tab.favicon,
        style: styles.favicon,
        alt: '',
      }),
    React.createElement(
      'span',
      { style: styles.tabTitle },
      truncateTitle(tab.title || 'New Tab', 20)
    ),
    !tab.isPinned &&
      React.createElement(
        'button',
        {
          style: styles.closeButton,
          onClick: onClose,
          title: 'Close Tab',
        },
        '×'
      )
  );
}

// Helper function to truncate long titles
function truncateTitle(title, maxLength) {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

// Styles
const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '40px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
  },
  tabList: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    minWidth: '120px',
    maxWidth: '200px',
    backgroundColor: '#e0e0e0',
    borderRight: '1px solid #ccc',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderBottom: '2px solid #007AFF',
  },
  tabPinned: {
    minWidth: '40px',
    maxWidth: '40px',
  },
  favicon: {
    width: '16px',
    height: '16px',
  },
  tabTitle: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    color: '#333',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#666',
    borderRadius: '3px',
    transition: 'background-color 0.2s',
  },
  newTabButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    color: '#666',
    transition: 'background-color 0.2s',
  },
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(TabBar));
