const { createSlice } = require('@reduxjs/toolkit');

const initialState = {
  theme: 'light', // Example: 'light', 'dark', 'system'
  // Add other global app settings here
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    // Add other app-related reducers here
  },
});

module.exports = {
  setTheme: appSlice.actions.setTheme,
  appReducer: appSlice.reducer,
}; 