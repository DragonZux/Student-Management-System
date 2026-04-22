"use client";
import { useEffect, useState } from 'react';
import { getPopupEventName, showPopup } from '@/lib/popup';

export default function PopupHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const eventName = getPopupEventName();

    const onPopup = (event) => {
      const detail = event?.detail;
      if (!detail?.id || !detail?.message) return;
      setItems((prev) => [...prev, detail]);
      const duration = Number(detail.durationMs || 3500);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== detail.id));
      }, duration);
    };

    const onWindowError = (event) => {
      const message = event?.error?.message || event?.message;
      if (message) showPopup(message, { type: 'error' });
    };

    const onUnhandledRejection = (event) => {
      const reason = event?.reason;
      const message = typeof reason === 'string' ? reason : reason?.message;
      if (message) showPopup(message, { type: 'error' });
    };

    window.addEventListener(eventName, onPopup);
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener(eventName, onPopup);
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            minWidth: '280px',
            maxWidth: '420px',
            background: item.type === 'success' ? '#166534' : '#991b1b',
            color: '#fff',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
