const { configureStore } = require('@reduxjs/toolkit');
const { appReducer } = require('./slices/appSlice');
const { windowsReducer } = require('./slices/windowsSlice');
const { tabsReducer } = require('./slices/tabsSlice');
const { tabSpacesReducer } = require('./slices/tabSpacesSlice');

// Root reducer with all slices
const rootReducer = {
  app: appReducer,
  windows: windowsReducer,
  tabs: tabsReducer,
  tabSpaces: tabSpacesReducer,
};

const store = configureStore({
  reducer: rootReducer,
  // Electron-specific middleware might be added later if needed,
  // for example, to forward actions from main to renderer or vice-versa.
});

// export default store; // Changed to CommonJS export
module.exports = store;
