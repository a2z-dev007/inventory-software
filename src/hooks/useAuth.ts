import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../store';
import { loginSuccess, logout, initializeAuth } from '../store/slices/authSlice';
import { apiService } from '../services/api';
import { User } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, rememberSession } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const login = async (username: string, password: string, remember: boolean = false) => {
    try {
      const userWithToken = await apiService.login(username, password);
      // Store token in localStorage/sessionStorage for persistence
      if (remember) {
        localStorage.setItem('token', userWithToken.token);
      } else {
        sessionStorage.setItem('token', userWithToken.token);
      }
      dispatch(loginSuccess({ user: userWithToken, remember, token: userWithToken.token }));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const signOut = () => {
    dispatch(logout());
  };

  const hasRole = (role: User['role']) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: User['role'][]) => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    isAuthenticated,
    rememberSession,
    login,
    logout: signOut,
    hasRole,
    hasAnyRole,
  };
};