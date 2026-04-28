"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { showPopup } from "@/lib/popup";

const NotificationContext = createContext(null);

function normalizeBaseUrl(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

function getWebSocketBaseUrl() {
  const configuredWsBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_WS_BASE_URL);
  if (configuredWsBase) return configuredWsBase;

  const configuredApiBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (configuredApiBase && /^https?:\/\//i.test(configuredApiBase)) {
    return configuredApiBase.replace(/^http/i, 'ws');
  }

  return 'ws://localhost:8000/api';
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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

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
      const res = await api.get("/notifications/");
      const list = Array.isArray(res.data) ? res.data : [];
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
    reload();
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

      const ws = new WebSocket(`${getWsUrl()}?token=${encodeURIComponent(nextToken)}`);
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
        } catch {
          // ignore
        }
      };
    };

    connect();

    return () => {
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
  }, []);

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

