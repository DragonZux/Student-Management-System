"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { clearAuthCookies, getAuthTokenFromBrowser, getUserFromBrowserStorage, syncAuthCookies } from '@/lib/authCookies';
import { showPopup } from '@/lib/popup';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIntervalRef = useRef(null);
  const wsRef = useRef(null);

  // WebSocket Connection for Real-time Notifications
  const connectNotifications = useCallback((token) => {
    if (!token) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    if (wsRef.current) wsRef.current.close();
    
    // Use env var or construct from current location/localhost
    const envWsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;
    let wsUrl;
    
    if (envWsUrl) {
      wsUrl = `${envWsUrl.replace(/\/$/, '').replace('localhost', '127.0.0.1')}/notifications/ws?token=${token}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Fallback to 127.0.0.1 instead of localhost to avoid IPv6 issues on some systems
      const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? '127.0.0.1:8000' 
        : `${window.location.hostname}:8000`;
      wsUrl = `${protocol}//${host}/api/notifications/ws?token=${token}`;
    }
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔔 Notification WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification' && payload.data) {
            const { title, message } = payload.data;
            showPopup(`${title}: ${message}`, { type: 'success', durationMs: 5000 });
            // Dispatch a global event so other components can react
            window.dispatchEvent(new CustomEvent('notification-received', { detail: payload.data }));
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = (event) => {
        if (event.code !== 1000 && event.code !== 1001) {
          console.warn(`WebSocket closed (code: ${event.code}). Reconnecting in 5s...`);
          setTimeout(() => {
            const currentToken = localStorage.getItem('token');
            if (currentToken && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
              connectNotifications(currentToken);
            }
          }, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error. URL:', wsUrl);
      };
    } catch (e) {
      console.error('Failed to create WebSocket instance', e);
    }
  }, []);

  // Function to refresh token silently
  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      syncAuthCookies(access_token, user?.role);
      // Update WS if needed (though existing might still work until it checks JTI)
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }, [user?.role]);

  // Setup auto-refresh interval
  const setupRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    refreshIntervalRef.current = setInterval(() => {
      if (localStorage.getItem('token')) {
        refreshToken();
      }
    }, 25 * 60 * 1000);
  }, [refreshToken]);

  useEffect(() => {
    const storedUser = getUserFromBrowserStorage();
    const token = getAuthTokenFromBrowser();

    if (storedUser && token) {
      setUser(storedUser);
      syncAuthCookies(token, storedUser?.role);
      setupRefreshInterval();
      connectNotifications(token);
    } else if (token) {
      api.get('/auth/me')
        .then((response) => {
          const nextUser = response.data;
          localStorage.setItem('user', JSON.stringify(nextUser));
          setUser(nextUser);
          syncAuthCookies(token, nextUser?.role);
          setupRefreshInterval();
          connectNotifications(token);
        })
        .catch(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          clearAuthCookies();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [setupRefreshInterval, connectNotifications]);

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

      const userResponse = await api.get('/auth/me');
      const userData = userResponse.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      syncAuthCookies(access_token, userData.role);

      setupRefreshInterval();
      connectNotifications(access_token);

      if (userData.role === 'admin') router.push('/admin');
      else if (userData.role === 'teacher') router.push('/teacher');
      else router.push('/student');

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  }, [router, setupRefreshInterval, connectNotifications]);

  const logout = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthCookies();
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
