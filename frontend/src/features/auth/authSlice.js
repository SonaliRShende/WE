// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authAPI.js';;

// Get user from localStorage (for persistence across page reloads)
const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: user ? user : null,
  loading: false,
  error: null,
  success: false,
};

// -----------------------------------------------------------------
// --- Async Thunks (Action Creators) ---
// -----------------------------------------------------------------

// Thunk for User Registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, thunkAPI) => {
    try {
      // Call the service layer function
      return await authService.register(userData);
    } catch (error) {
      // Get error message from backend response or use a default
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk for User Login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData, thunkAPI) => {
    try {
      // Call the service layer function (which saves user to localStorage)
      return await authService.login(userData);
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Thunk for User Logout (clears session)
export const logoutUser = createAsyncThunk(
    'auth/logoutUser', 
    async () => {
        // Clear the user from localStorage
        localStorage.removeItem('user');
    }
);


// -----------------------------------------------------------------
// --- Auth Slice ---
// -----------------------------------------------------------------

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // A simple action to reset state variables like error/success
    reset: (state) => {
        state.loading = false;
        state.error = null;
        state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Register Reducers ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user; // Assuming API returns the new user object
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // Error message from thunkAPI.rejectWithValue
        state.user = null;
      })
      
      // --- Login Reducers ---
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user; // Assuming API returns the logged-in user object
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
      })

      // --- Logout Reducer ---
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.success = false;
        state.error = null;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;