const { createSlice } = require('@reduxjs/toolkit');

/**
 * Tab Spaces State Structure:
 * Tab Spaces are groups/collections of tabs (like browser tab groups)
 *
 * {
 *   tabSpaces: {
 *     [tabSpaceId]: {
 *       tabSpaceId: string,
 *       name: string,
 *       color: string,
 *       tabs: [{ tabId: string, parentTabId: string | null }],
 *       createdAt: number
 *     }
 *   },
 *   orderedTabSpaceIds: string[], // Order of tab spaces in UI
 *   activeTabSpaceId: string | null // Currently active tab space
 * }
 */

const initialState = {
  tabSpaces: {},
  orderedTabSpaceIds: [],
  activeTabSpaceId: null,
};

const tabSpacesSlice = createSlice({
  name: 'tabSpaces',
  initialState,
  reducers: {
    // Create a new tab space
    createTabSpace: (state, action) => {
      const {
        tabSpaceId,
        name = 'New Group',
        color = '#808080',
      } = action.payload;

      state.tabSpaces[tabSpaceId] = {
        tabSpaceId,
        name,
        color,
        tabs: [],
        createdAt: Date.now(),
      };

      // Add to ordered list
      state.orderedTabSpaceIds.push(tabSpaceId);

      // Set as active if it's the first one
      if (!state.activeTabSpaceId) {
        state.activeTabSpaceId = tabSpaceId;
      }
    },

    // Remove a tab space
    removeTabSpace: (state, action) => {
      const tabSpaceId = action.payload;

      // Remove from tabSpaces
      delete state.tabSpaces[tabSpaceId];

      // Remove from ordered list
      state.orderedTabSpaceIds = state.orderedTabSpaceIds.filter(
        (id) => id !== tabSpaceId
      );

      // Update active tab space if needed
      if (state.activeTabSpaceId === tabSpaceId) {
        state.activeTabSpaceId = state.orderedTabSpaceIds[0] || null;
      }
    },

    // Update tab space name
    updateTabSpaceName: (state, action) => {
      const { tabSpaceId, name } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        state.tabSpaces[tabSpaceId].name = name;
      }
    },

    // Update tab space color
    updateTabSpaceColor: (state, action) => {
      const { tabSpaceId, color } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        state.tabSpaces[tabSpaceId].color = color;
      }
    },

    // Add tab to tab space
    addTabToTabSpace: (state, action) => {
      const { tabSpaceId, tabId, parentTabId = null } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        // Check if tab already exists in this space
        const existingIndex = state.tabSpaces[tabSpaceId].tabs.findIndex(
          (t) => t.tabId === tabId
        );

        if (existingIndex === -1) {
          state.tabSpaces[tabSpaceId].tabs.push({ tabId, parentTabId });
        }
      }
    },

    // Remove tab from tab space
    removeTabFromTabSpace: (state, action) => {
      const { tabSpaceId, tabId } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        state.tabSpaces[tabSpaceId].tabs = state.tabSpaces[
          tabSpaceId
        ].tabs.filter((t) => t.tabId !== tabId);
      }
    },

    // Move tab within tab space (reorder)
    reorderTabInTabSpace: (state, action) => {
      const { tabSpaceId, tabId, newIndex } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        const tabs = state.tabSpaces[tabSpaceId].tabs;
        const currentIndex = tabs.findIndex((t) => t.tabId === tabId);

        if (currentIndex !== -1 && newIndex >= 0 && newIndex < tabs.length) {
          // Remove from current position
          const [tab] = tabs.splice(currentIndex, 1);
          // Insert at new position
          tabs.splice(newIndex, 0, tab);
        }
      }
    },

    // Move tab to different tab space
    moveTabToTabSpace: (state, action) => {
      const { fromTabSpaceId, toTabSpaceId, tabId } = action.payload;

      // Remove from source tab space
      if (state.tabSpaces[fromTabSpaceId]) {
        state.tabSpaces[fromTabSpaceId].tabs = state.tabSpaces[
          fromTabSpaceId
        ].tabs.filter((t) => t.tabId !== tabId);
      }

      // Add to destination tab space
      if (state.tabSpaces[toTabSpaceId]) {
        const existingIndex = state.tabSpaces[toTabSpaceId].tabs.findIndex(
          (t) => t.tabId === tabId
        );

        if (existingIndex === -1) {
          state.tabSpaces[toTabSpaceId].tabs.push({
            tabId,
            parentTabId: null,
          });
        }
      }
    },

    // Reorder tab spaces
    reorderTabSpaces: (state, action) => {
      const { tabSpaceId, newIndex } = action.payload;
      const currentIndex = state.orderedTabSpaceIds.indexOf(tabSpaceId);

      if (
        currentIndex !== -1 &&
        newIndex >= 0 &&
        newIndex < state.orderedTabSpaceIds.length
      ) {
        // Remove from current position
        const [id] = state.orderedTabSpaceIds.splice(currentIndex, 1);
        // Insert at new position
        state.orderedTabSpaceIds.splice(newIndex, 0, id);
      }
    },

    // Set active tab space
    setActiveTabSpace: (state, action) => {
      const tabSpaceId = action.payload;
      if (state.tabSpaces[tabSpaceId] || tabSpaceId === null) {
        state.activeTabSpaceId = tabSpaceId;
      }
    },

    // Update parent-child relationship
    updateTabParentRelation: (state, action) => {
      const { tabSpaceId, tabId, parentTabId } = action.payload;
      if (state.tabSpaces[tabSpaceId]) {
        const tab = state.tabSpaces[tabSpaceId].tabs.find(
          (t) => t.tabId === tabId
        );
        if (tab) {
          tab.parentTabId = parentTabId;
        }
      }
    },

    // Reset all tab spaces
    resetTabSpaces: () => initialState,
  },
});

// Export actions
const {
  createTabSpace,
  removeTabSpace,
  updateTabSpaceName,
  updateTabSpaceColor,
  addTabToTabSpace,
  removeTabFromTabSpace,
  reorderTabInTabSpace,
  moveTabToTabSpace,
  reorderTabSpaces,
  setActiveTabSpace,
  updateTabParentRelation,
  resetTabSpaces,
} = tabSpacesSlice.actions;

// Export reducer
const tabSpacesReducer = tabSpacesSlice.reducer;

module.exports = {
  // Actions
  createTabSpace,
  removeTabSpace,
  updateTabSpaceName,
  updateTabSpaceColor,
  addTabToTabSpace,
  removeTabFromTabSpace,
  reorderTabInTabSpace,
  moveTabToTabSpace,
  reorderTabSpaces,
  setActiveTabSpace,
  updateTabParentRelation,
  resetTabSpaces,

  // Reducer
  tabSpacesReducer,
};
