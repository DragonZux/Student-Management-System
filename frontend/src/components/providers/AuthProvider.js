"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef(null);

  // Function to refresh token silently
  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // If refresh fails, the interceptor will handle the 401 and redirect to login
      return false;
    }
  }, []);

  // Setup auto-refresh interval
  const setupRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    
    // Refresh token every 25 minutes (Token expires in 30 mins)
    refreshIntervalRef.current = setInterval(() => {
      if (localStorage.getItem('token')) {
        refreshToken();
      }
    }, 25 * 60 * 1000); 
  }, [refreshToken]);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setupRefreshInterval();
        
        // Also verify the token is still valid by calling /me
        api.get('/auth/me').catch(() => {
           // If /me fails, it means token is already expired
           // The interceptor in api.js will handle redirect
        });
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [setupRefreshInterval]);

  const login = useCallback(async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);

      // Fetch user info
      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      setupRefreshInterval();

      // Redirect based on role
      if (userData.role === 'admin') router.push('/admin');
      else if (userData.role === 'teacher') router.push('/teacher');
      else router.push('/student');

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  }, [router, setupRefreshInterval]);

  const logout = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const authContextValue = useMemo(
    () => ({ user, loading, login, logout, refreshToken }),
    [user, loading, login, logout, refreshToken]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
