const { createSlice } = require('@reduxjs/toolkit');

// Example initial window state structure
// const initialWindowState = {
//   id: null,
//   bounds: { x: undefined, y: undefined, width: 800, height: 600 },
//   isFocused: false,
//   isMaximized: false,
//   isMinimized: false,
//   isFullScreen: false,
//   title: 'Lotion',
//   url: null, // Current URL of the primary content
// };

const initialState = {
  windows: {}, // Store window states by windowId
  focusedWindowId: null,
};

const windowsSlice = createSlice({
  name: 'windows',
  initialState,
  reducers: {
    addWindow: (state, action) => {
      const { windowId, bounds, url, title, isFocused } = action.payload;
      state.windows[windowId] = {
        id: windowId,
        bounds: bounds || { width: 1200, height: 800 }, // Default bounds
        isFocused: isFocused || false,
        isMaximized: false,
        isMinimized: false,
        isFullScreen: false,
        title: title || 'Lotion',
        url: url || null,
        // ... other properties from initialWindowState if needed
      };
      if (isFocused || state.focusedWindowId === null) {
        state.focusedWindowId = windowId;
      }
    },
    removeWindow: (state, action) => {
      const windowIdToRemove = action.payload;
      delete state.windows[windowIdToRemove];
      if (state.focusedWindowId === windowIdToRemove) {
        // If the focused window is removed, set focus to another window or null
        const remainingWindowIds = Object.keys(state.windows);
        state.focusedWindowId = remainingWindowIds.length > 0 ? remainingWindowIds[0] : null;
      }
    },
    updateWindowBounds: (state, action) => {
      const { windowId, bounds } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].bounds = bounds;
      }
    },
    updateWindowUrl: (state, action) => {
      const { windowId, url } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].url = url;
      }
    },
    updateWindowTitle: (state, action) => {
      const { windowId, title } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].title = title;
      }
    },
    setWindowFocus: (state, action) => {
      const { windowId, focused } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].isFocused = focused;
        if (focused) {
          state.focusedWindowId = windowId;
        } else if (state.focusedWindowId === windowId) {
          // If the currently focused window loses focus, we might need to determine the new focused window.
          // For simplicity, let's set it to null. A more complex app might find the next focused window.
          state.focusedWindowId = null; 
        }
      }
    },
    setWindowMaximized: (state, action) => {
      const { windowId, maximized } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].isMaximized = maximized;
      }
    },
    setWindowMinimized: (state, action) => {
      const { windowId, minimized } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].isMinimized = minimized;
      }
    },
    setWindowFullScreen: (state, action) => {
      const { windowId, fullScreen } = action.payload;
      if (state.windows[windowId]) {
        state.windows[windowId].isFullScreen = fullScreen;
      }
    },
    // Add other window-related reducers here
  },
});

module.exports = {
  ...windowsSlice.actions,
  windowsReducer: windowsSlice.reducer,
}; 