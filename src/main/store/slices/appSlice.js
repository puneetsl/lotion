const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  theme: 'light', // Example: 'light', 'dark', 'system'
  dictionaries: ['en-US'], // Default: array of selected dictionaries
  // Add other global app settings here
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setDictionaries: (state, action) => {
      state.dictionaries = action.payload;
    },
    // Add other app-related reducers here
  },
});

module.exports = {
  setTheme: appSlice.actions.setTheme,
  setDictionaries: appSlice.actions.setDictionaries,
  appReducer: appSlice.reducer,
};
