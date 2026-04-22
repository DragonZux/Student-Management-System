"use client";
import Card from '@/components/ui/Card';
import { Bell, Clock, Info, CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatTimeAgo = (iso) => {
    const ts = iso ? new Date(iso).getTime() : 0;
    if (!ts) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/notifications/');
        if (!cancelled) setNotifications(res.data || []);
      } catch (e) {
        console.error('Failed to load notifications', e);
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    return (notifications || []).map((n) => ({
      ...n,
      id: n._id || n.id,
      time: formatTimeAgo(n.created_at),
      type: n.read ? 'success' : 'info',
    }));
  }, [notifications]);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        (prev || []).map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  return (
    <div>
      <h1>Thông báo</h1>
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <Card className="glass">Đang tải...</Card>
        ) : null}
        {!loading && items.length === 0 ? (
          <Card className="glass">Chưa có thông báo nào.</Card>
        ) : null}
        {items.map(n => (
          <div key={n.id} style={{ 
            padding: '1.25rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            display: 'flex', gap: '1rem', alignItems: 'flex-start'
          }}>
            <div style={{ 
              padding: '0.5rem', background: n.type === 'warning' ? '#fef9c3' : '#dcfce7', borderRadius: 'var(--radius)' 
            }}>
              {n.type === 'warning' ? <Info size={20} color="#854d0e" /> : <Bell size={20} color="#166534" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 700 }}>{n.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {n.time}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{n.message}</p>
              {!n.read ? (
                <button
                  onClick={() => markRead(n.id)}
                  style={{
                    marginTop: '0.75rem',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đánh dấu đã đọc
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
