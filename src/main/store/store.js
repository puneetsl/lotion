const { configureStore } = require('@reduxjs/toolkit');
const { appReducer } = require('./slices/appSlice');
const { windowsReducer } = require('./slices/windowsSlice');

// We will add more reducers here as they are created (e.g., tabsReducer)
const rootReducer = {
  app: appReducer,
  windows: windowsReducer,
  // tabs: tabsReducer, // Placeholder for when tabsSlice is created
};

const store = configureStore({
  reducer: rootReducer,
  // Electron-specific middleware might be added later if needed,
  // for example, to forward actions from main to renderer or vice-versa.
});

// export default store; // Changed to CommonJS export
module.exports = store; 