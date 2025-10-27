/**
 * Tab Selectors
 * These provide efficient, memoized access to tab state
 */

// Basic selectors - direct state access
const selectTabsState = (state) => state.tabs;
const selectAllTabs = (state) => state.tabs.tabs;

// Get a specific tab by ID
const selectTabById = (state, tabId) => {
  return state.tabs.tabs[tabId] || null;
};

// Get all tabs as an array
const selectTabsArray = (state) => {
  return Object.values(state.tabs.tabs);
};

// Get tabs for a specific window
const selectTabsByWindowId = (state, windowId) => {
  return Object.values(state.tabs.tabs).filter(
    (tab) => tab.parentWindowId === windowId
  );
};

// Get pinned tabs for a window
const selectPinnedTabsByWindowId = (state, windowId) => {
  return Object.values(state.tabs.tabs).filter(
    (tab) => tab.parentWindowId === windowId && tab.isPinned
  );
};

// Get unpinned tabs for a window
const selectUnpinnedTabsByWindowId = (state, windowId) => {
  return Object.values(state.tabs.tabs).filter(
    (tab) => tab.parentWindowId === windowId && !tab.isPinned
  );
};

// Get loaded tabs count
const selectLoadedTabsCount = (state) => {
  return Object.values(state.tabs.tabs).filter((tab) => tab.isLoaded).length;
};

// Get total tabs count
const selectTotalTabsCount = (state) => {
  return Object.keys(state.tabs.tabs).length;
};

// Get tabs sorted by creation time (newest first)
const selectTabsSortedByCreation = (state) => {
  return Object.values(state.tabs.tabs).sort(
    (a, b) => b.createdAt - a.createdAt
  );
};

// Get tabs sorted by last used (most recently used first)
const selectTabsSortedByLastUsed = (state) => {
  return Object.values(state.tabs.tabs).sort(
    (a, b) => a.unusedSince - b.unusedSince
  );
};

// Get tabs that haven't been used in a while (for memory optimization)
const selectStaleTabIds = (state, thresholdMs = 30 * 60 * 1000) => {
  // Default: 30 minutes
  const now = Date.now();
  return Object.values(state.tabs.tabs)
    .filter((tab) => now - tab.unusedSince > thresholdMs && tab.isLoaded)
    .map((tab) => tab.tabId);
};

// Check if a tab exists
const selectTabExists = (state, tabId) => {
  return tabId in state.tabs.tabs;
};

// Get tab count for a window
const selectTabCountForWindow = (state, windowId) => {
  return Object.values(state.tabs.tabs).filter(
    (tab) => tab.parentWindowId === windowId
  ).length;
};

// Get all tabs with breadcrumbs
const selectTabsWithBreadcrumbs = (state) => {
  return Object.values(state.tabs.tabs).filter(
    (tab) => tab.breadcrumbs && tab.breadcrumbs.length > 0
  );
};

module.exports = {
  selectTabsState,
  selectAllTabs,
  selectTabById,
  selectTabsArray,
  selectTabsByWindowId,
  selectPinnedTabsByWindowId,
  selectUnpinnedTabsByWindowId,
  selectLoadedTabsCount,
  selectTotalTabsCount,
  selectTabsSortedByCreation,
  selectTabsSortedByLastUsed,
  selectStaleTabIds,
  selectTabExists,
  selectTabCountForWindow,
  selectTabsWithBreadcrumbs,
};
