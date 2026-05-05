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
  if (configuredWsBase && !configuredWsBase.includes('backend')) {
    return configuredWsBase.replace('localhost', '127.0.0.1');
  }

  const configuredApiBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL);
  if (configuredApiBase && /^https?:\/\//i.test(configuredApiBase) && !configuredApiBase.includes('backend')) {
    return configuredApiBase.replace(/^http/i, 'ws').replace('localhost', '127.0.0.1');
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `ws://127.0.0.1:8000/api`;
    }
    const wsBase = window.location.origin.replace(/^http/i, 'ws') + '/api';
    return wsBase.replace('localhost', '127.0.0.1');
  }

  return 'ws://127.0.0.1:8000/api';
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
  const processedIdsRef = useRef(new Set());

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch (e) {
      console.error('Failed to fetch unread count', e);
    }
  }, []);

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
      normalized.forEach(n => processedIdsRef.current.add(n.id));
      await fetchUnreadCount();
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount]);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.post("/notifications/mark-all-read");
    } catch (e) {
      console.error("Failed to mark all as read", e);
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
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently ignore autoplay blocks
          });
        }
      } catch (e) {
        // ignore audio errors
      }
    };

    const connect = () => {
      const nextToken = localStorage.getItem("token");
      if (!nextToken) return;

      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const fullUrl = `${getWsUrl()}?token=${encodeURIComponent(nextToken)}`;
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
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

      ws.onclose = (event) => {
        if (pingTimerRef.current) {
          window.clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        wsRef.current = null;

        if (event?.code === 1008) {
          showPopup("Phiên đăng nhập không hợp lệ hoặc đã bị đăng nhập ở nơi khác. Vui lòng đăng nhập lại.", {
            type: "error",
            durationMs: 4500,
          });
          return;
        }

        const attempt = (reconnectAttemptRef.current || 0) + 1;
        reconnectAttemptRef.current = attempt;
        const delayMs = Math.min(30000, 1000 * Math.pow(2, Math.min(5, attempt)));
        reconnectTimerRef.current = window.setTimeout(connect, delayMs);
      };

      ws.onmessage = (event) => {
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

          if (processedIdsRef.current.has(incoming.id)) return;
          processedIdsRef.current.add(incoming.id);

          setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
          setUnreadCount(c => c + 1);

          playNotifySound();
          const popupText = incoming.message ? `${incoming.title}: ${incoming.message}` : incoming.title;
          showPopup(popupText, { type: "success", durationMs: 4500 });
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
      if (removeVisibilityListener) removeVisibilityListener();
      if (bootTimer) window.clearTimeout(bootTimer);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) window.clearInterval(pingTimerRef.current);
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [user?._id]);

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
