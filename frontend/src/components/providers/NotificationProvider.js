"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { showPopup } from "@/lib/popup";
import { useAuth } from "@/components/providers/AuthProvider";

const NotificationContext = createContext(null);

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

function getWebSocketBaseUrl() {
  const configuredWsBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_WS_BASE_URL);
  if (configuredWsBase && !configuredWsBase.includes('backend')) return configuredWsBase;

  const configuredApiBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL);
  if (configuredApiBase && /^https?:\/\//i.test(configuredApiBase) && !configuredApiBase.includes('backend')) {
    return configuredApiBase.replace(/^http/i, 'ws');
  }

  if (typeof window !== 'undefined') {
    // If on localhost, hit the backend directly on port 8000 to bypass Next.js proxy (which doesn't support WS rewrites)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:8000/api';
    }
    // Fallback for ngrok or other external access
    const wsBase = window.location.origin.replace(/^http/i, 'ws') + '/api';
    console.log('[WS] Client Base URL:', wsBase);
    return wsBase;
  }

  return 'ws://backend:8000/api';
}

function normalizeNotification(raw) {
  if (!raw) return null;
  const id = raw._id || raw.id;
  if (!id) return null;
  return {
    id,
    title: raw.title || "Thông báo hệ thống",
    message: raw.message || "",
    created_at: raw.created_at || new Date().toISOString(),
    read: Boolean(raw.read),
  };
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const idleReloadRef = useRef(null);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const reload = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/notifications', { params: { skip: 0, limit: 10 } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const normalized = list.map(normalizeNotification).filter(Boolean);
      setNotifications(normalized);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    // optimistic
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      // revert if failed
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post("/notifications/mark-all-read");
    } catch (e) {
      console.error("Failed to mark all as read", e);
      // Optional: reload if failed to ensure sync
      reload();
    }
  }, [reload]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const scheduleReload = () => {
      if ('requestIdleCallback' in window) {
        idleReloadRef.current = window.requestIdleCallback(() => {
          reload();
        }, { timeout: 1500 });
        return;
      }

      idleReloadRef.current = window.setTimeout(() => {
        reload();
      }, 300);
    };

    scheduleReload();

    return () => {
      if (idleReloadRef.current && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleReloadRef.current);
      } else if (idleReloadRef.current) {
        window.clearTimeout(idleReloadRef.current);
      }
    };
  }, [reload]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return undefined;

    const getWsUrl = () => {
      return `${getWebSocketBaseUrl()}/notifications/ws`;
    };

    const playNotifySound = () => {
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        audio.volume = 0.5;
        audio.play();
      } catch (e) {
        // ignore audio errors
      }
    };

    const connect = () => {
      const nextToken = localStorage.getItem("token");
      if (!nextToken) return;

      const fullUrl = `${getWsUrl()}?token=${encodeURIComponent(nextToken)}`;
      console.log('[WS] Connecting to:', fullUrl);
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected successfully');
        reconnectAttemptRef.current = 0;
        if (reconnectTimerRef.current) {
          window.clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = window.setInterval(() => {
          try {
            ws.send("ping");
          } catch {
            // ignore
          }
        }, 25000);
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };

      ws.onclose = (event) => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        wsRef.current = null;

        // 1008: policy violation (server closes when token/jti invalid)
        if (event?.code === 1008) {
          showPopup("Phiên đăng nhập không hợp lệ hoặc đã bị đăng nhập ở nơi khác. Vui lòng đăng nhập lại.", {
            type: "error",
            durationMs: 4500,
          });
          return;
        }

        const attempt = (reconnectAttemptRef.current || 0) + 1;
        reconnectAttemptRef.current = attempt;
        const delayMs = Math.min(30000, 1000 * Math.pow(2, Math.min(5, attempt))); // 1s..30s
        reconnectTimerRef.current = window.setTimeout(connect, delayMs);
      };

      ws.onmessage = (event) => {
        console.log('[WS] Received message:', event.data);
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== "notification" || !payload.data) return;
          const incoming = normalizeNotification({
            _id: payload.data.id,
            title: payload.data.title,
            message: payload.data.message,
            created_at: payload.data.created_at,
            read: false,
          });
          if (!incoming) return;

          setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });

          // Play sound
          playNotifySound();

          // Alert/popup ngay khi có thông báo mới
          const popupText = incoming.message ? `${incoming.title}: ${incoming.message}` : incoming.title;
          showPopup(popupText, { type: "success", durationMs: 4500 });

          // Dispatch global event so other components (like NotificationsPage) can refresh
          window.dispatchEvent(new CustomEvent('notification-received', { detail: incoming }));
        } catch (e) {
          console.error('[WS] Error processing message:', e);
        }
      };
    };

    let bootTimer = null;
    let removeVisibilityListener = null;

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisible);
          removeVisibilityListener = null;
          connect();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      removeVisibilityListener = () => document.removeEventListener('visibilitychange', onVisible);
    } else {
      bootTimer = window.setTimeout(() => {
        connect();
      }, 800);
    }

    return () => {
      if (removeVisibilityListener) {
        removeVisibilityListener();
      }
      if (bootTimer) {
        window.clearTimeout(bootTimer);
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (pingTimerRef.current) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [user?._id]); // Re-connect if user changes (login/logout)

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      reload,
      markRead,
      markAllRead,
    }),
    [notifications, unreadCount, loading, reload, markRead, markAllRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}

