import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberSession: boolean;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  rememberSession: false,
  token: null,
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
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    },
    initializeAuth: (state) => {
      let savedUser = localStorage.getItem('user');
      let savedToken = localStorage.getItem('token');
      if (!savedUser) {
        savedUser = sessionStorage.getItem('user');
        savedToken = sessionStorage.getItem('token');
      }
      if (savedUser && savedToken) {
        state.user = JSON.parse(savedUser);
        state.isAuthenticated = true;
        state.rememberSession = !!localStorage.getItem('user');
        state.token = savedToken;
      }
    },
  },
});

export const { loginSuccess, logout, initializeAuth } = authSlice.actions;
export default authSlice.reducer;