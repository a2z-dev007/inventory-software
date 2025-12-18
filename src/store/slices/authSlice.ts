import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberSession: boolean;
  token: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  rememberSession: false,
  token: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; remember: boolean; token: string }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.rememberSession = action.payload.remember;
      state.token = action.payload.token;
      state.isInitialized = true;
      if (action.payload.remember) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      } else {
        sessionStorage.setItem('user', JSON.stringify(action.payload.user));
        sessionStorage.setItem('token', action.payload.token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.rememberSession = false;
      state.token = null;
      state.isInitialized = true;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    },
    initializeAuth: (state) => {
      try {
        let savedUser = localStorage.getItem('user');
        let savedToken = localStorage.getItem('token');
        let remember = true;

        if (!savedUser || !savedToken) {
          savedUser = sessionStorage.getItem('user');
          savedToken = sessionStorage.getItem('token');
          remember = false;
        }

        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser) {
            state.user = parsedUser;
            state.isAuthenticated = true;
            state.rememberSession = remember;
            state.token = savedToken;
          }
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
      } finally {
        state.isInitialized = true;
      }
    },
  },
});

export const { loginSuccess, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;