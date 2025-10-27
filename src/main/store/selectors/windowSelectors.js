/**
 * Window Selectors with Tab Support
 * These extend the existing window selectors to work with tabs
 */

// Re-export existing window state access
const selectWindowsState = (state) => state.windows;
const selectAllWindows = (state) => state.windows.windows;
const selectFocusedWindowId = (state) => state.windows.focusedWindowId;

// Get a specific window by ID
const selectWindowById = (state, windowId) => {
  return state.windows.windows[windowId] || null;
};

// Get the focused window
const selectFocusedWindow = (state) => {
  const focusedId = state.windows.focusedWindowId;
  return focusedId ? state.windows.windows[focusedId] : null;
};

// Get all windows as an array
const selectWindowsArray = (state) => {
  return Object.values(state.windows.windows);
};

// Get focused windows (all windows that have focus)
const selectFocusedWindows = (state) => {
  return Object.values(state.windows.windows).filter((win) => win.isFocused);
};

// Get window count
const selectWindowCount = (state) => {
  return Object.keys(state.windows.windows).length;
};

// Check if a window exists
const selectWindowExists = (state, windowId) => {
  return windowId in state.windows.windows;
};

// Get windows sorted by focus (most recently focused first)
// Note: We'd need to add a 'lastFocused' timestamp to window state for this
// For now, this is a placeholder
const selectWindowsSortedByFocus = (state) => {
  return Object.values(state.windows.windows);
};

// NEW: Window selectors with tab integration

// Get active tab ID for a window (we'll add this to window state)
const selectActiveTabIdForWindow = (state, windowId) => {
  const window = state.windows.windows[windowId];
  return window?.activeTabId || null;
};

// Get tab IDs for a window (we'll add this to window state)
const selectTabIdsForWindow = (state, windowId) => {
  const window = state.windows.windows[windowId];
  return window?.tabIds || [];
};

module.exports = {
  selectWindowsState,
  selectAllWindows,
  selectFocusedWindowId,
  selectWindowById,
  selectFocusedWindow,
  selectWindowsArray,
  selectFocusedWindows,
  selectWindowCount,
  selectWindowExists,
  selectWindowsSortedByFocus,
  selectActiveTabIdForWindow,
  selectTabIdsForWindow,
};
