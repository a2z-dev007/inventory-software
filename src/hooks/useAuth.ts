import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../store';
import { loginSuccess, logout, initializeAuth } from '../store/slices/authSlice';
import { apiService } from '../services/api';
import { User } from '../types';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, rememberSession } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  const login = async (username: string, password: string, remember: boolean = false) => {
    try {
      const response = await apiService.login(username, password, remember);
      
      if (!response.success || !response.data) {
        toast.error(response.message || 'Login failed');
        throw new Error(response.message || 'Login failed');
      }
      
      const { user, token } = response.data;
      toast.success(response.message || 'Login successful');
      // Store token in localStorage/sessionStorage for persistence
      if (remember) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      
      dispatch(loginSuccess({ user, remember, token }));
      return { success: true };
    } catch (error) {
      toast.error((error as Error).message || 'Login failed');
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