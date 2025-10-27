const { createSlice } = require('@reduxjs/toolkit');

/**
 * Tab State Structure:
 * {
 *   tabs: {
 *     [tabId]: {
 *       tabId: string,
 *       title: string,
 *       url: string,
 *       favicon: string,
 *       parentWindowId: string,
 *       isLoaded: boolean,
 *       breadcrumbs: array,
 *       isPinned: boolean,
 *       unusedSince: number,
 *       createdAt: number
 *     }
 *   }
 * }
 */

const initialState = {
  tabs: {}, // Store tab states by tabId
};

const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    // Create a new tab
    createTab: (state, action) => {
      const {
        tabId,
        parentWindowId,
        url,
        title = 'New Tab',
        favicon = '',
        isPinned = false,
      } = action.payload;

      state.tabs[tabId] = {
        tabId,
        parentWindowId,
        url: url || 'https://www.notion.so',
        title,
        favicon,
        isLoaded: false,
        breadcrumbs: [],
        isPinned,
        unusedSince: Date.now(),
        createdAt: Date.now(),
      };
    },

    // Remove a tab
    removeTab: (state, action) => {
      const tabId = action.payload;
      delete state.tabs[tabId];
    },

    // Remove multiple tabs
    removeTabs: (state, action) => {
      const tabIds = action.payload;
      tabIds.forEach((tabId) => {
        delete state.tabs[tabId];
      });
    },

    // Update tab's parent window
    updateTabParentWindow: (state, action) => {
      const { tabId, parentWindowId } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].parentWindowId = parentWindowId;
      }
    },

    // Update tab title
    updateTabTitle: (state, action) => {
      const { tabId, title } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].title = title;
      }
    },

    // Update tab URL
    updateTabUrl: (state, action) => {
      const { tabId, url } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].url = url;
      }
    },

    // Update tab favicon
    updateTabFavicon: (state, action) => {
      const { tabId, favicon } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].favicon = favicon;
      }
    },

    // Update tab loaded state
    updateTabLoaded: (state, action) => {
      const { tabId, isLoaded } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].isLoaded = isLoaded;
      }
    },

    // Update tab breadcrumbs
    updateTabBreadcrumbs: (state, action) => {
      const { tabId, breadcrumbs } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].breadcrumbs = breadcrumbs;
      }
    },

    // Toggle tab pinned state
    toggleTabPinned: (state, action) => {
      const tabId = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].isPinned = !state.tabs[tabId].isPinned;
      }
    },

    // Set tab pinned state explicitly
    setTabPinned: (state, action) => {
      const { tabId, isPinned } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].isPinned = isPinned;
      }
    },

    // Update when tab was last used
    updateTabUnusedSince: (state, action) => {
      const { tabId, unusedSince } = action.payload;
      if (state.tabs[tabId]) {
        state.tabs[tabId].unusedSince = unusedSince || Date.now();
      }
    },

    // Bulk update tab properties
    updateTabProperties: (state, action) => {
      const { tabId, properties } = action.payload;
      if (state.tabs[tabId]) {
        Object.assign(state.tabs[tabId], properties);
      }
    },

    // Reset all tabs (useful for cleanup)
    resetTabs: () => initialState,
  },
});

// Export actions
const {
  createTab,
  removeTab,
  removeTabs,
  updateTabParentWindow,
  updateTabTitle,
  updateTabUrl,
  updateTabFavicon,
  updateTabLoaded,
  updateTabBreadcrumbs,
  toggleTabPinned,
  setTabPinned,
  updateTabUnusedSince,
  updateTabProperties,
  resetTabs,
} = tabsSlice.actions;

// Export reducer
const tabsReducer = tabsSlice.reducer;

module.exports = {
  // Actions
  createTab,
  removeTab,
  removeTabs,
  updateTabParentWindow,
  updateTabTitle,
  updateTabUrl,
  updateTabFavicon,
  updateTabLoaded,
  updateTabBreadcrumbs,
  toggleTabPinned,
  setTabPinned,
  updateTabUnusedSince,
  updateTabProperties,
  resetTabs,

  // Reducer
  tabsReducer,
};
