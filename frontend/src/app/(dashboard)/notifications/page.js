"use client";
import Card from '@/components/ui/Card';
import { Bell, Clock, Info, CheckCircle, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

export default function NotificationsPage() {
  const [markingAll, setMarkingAll] = useState(false);
  const {
    data: notifications,
    loading,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    refresh,
  } = usePaginatedData('/notifications/', { cacheKey: 'notifications_page', initialLimit: 10 });

  const formatTimeAgo = (iso) => {
    const ts = iso ? new Date(iso).getTime() : 0;
    if (!ts) return 'Vừa xong';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return `${diffSec} giây trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} ngày trước`;
  };

  const items = useMemo(() => {
    return (notifications || []).map((n) => ({
      ...n,
      time: formatTimeAgo(n.created_at),
      // Categorize based on keywords in title or message
      category: n.title?.toLowerCase().includes('học phí') ? 'finance' :
        n.title?.toLowerCase().includes('lớp') ? 'class' : 'system'
    }));
  }, [notifications]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await api.post('/notifications/mark-all-read');
      refresh();
    } finally {
      setMarkingAll(false);
    }
  };

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    refresh();
  };

  const getCategoryStyles = (cat) => {
    switch (cat) {
      case 'finance': return { bg: 'rgba(16, 185, 129, 0.1)', icon: '#10b981' };
      case 'class': return { bg: 'rgba(99, 102, 241, 0.1)', icon: '#6366f1' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', icon: '#64748b' };
    }
  };

  return (
    <div className="animate-in">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2.5rem'
      }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Trung tâm thông báo</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)' }}>
            Cập nhật những tin tức và thay đổi mới nhất từ hệ thống.
          </p>
        </div>

        {items.some(n => !n.read) && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '1rem',
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className="input-hover"
          >
            {markingAll ? <Loader2 className="animate-spin" size={18} /> : <CheckCheck size={18} />}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && items.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <Loader2 className="animate-spin" size={40} style={{ marginBottom: '1rem' }} />
            <p>Đang tải thông báo của bạn...</p>
          </div>
        ) : null}

        <AnimatePresence mode="popLayout">
          {!loading && items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Bell size={40} style={{ opacity: 0.2 }} />
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>Hộp thư trống</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>Tuyệt vời! Bạn đã cập nhật tất cả thông báo.</p>
              </Card>
            </motion.div>
          ) : (
            items.map((n, idx) => {
              const notificationKey = n.id || n._id || `${n.created_at || 'notification'}-${idx}`;
              const styles = getCategoryStyles(n.category);
              return (
                <motion.div
                  key={notificationKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  layout
                >
                  <div style={{
                    padding: '1.5rem',
                    background: n.read ? 'rgba(255, 255, 255, 0.4)' : 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '1.5rem',
                    display: 'flex',
                    gap: '1.25rem',
                    alignItems: 'flex-start',
                    boxShadow: n.read ? 'none' : '0 10px 25px -5px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    opacity: n.read ? 0.8 : 1
                  }}>
                    {!n.read && (
                      <div style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        boxShadow: '0 0 10px var(--primary)'
                      }} />
                    )}

                    <div style={{
                      padding: '0.75rem',
                      background: styles.bg,
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {n.read ? <CheckCircle size={22} color="#166534" /> : <Info size={22} color={styles.icon} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: n.read ? 'var(--muted-foreground)' : 'inherit' }}>
                          {n.title}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600
                        }}>
                          <Clock size={14} /> {n.time}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.9375rem',
                        color: 'var(--muted-foreground)',
                        lineHeight: 1.6
                      }}>
                        {n.message}
                      </p>

                      {!n.read && (
                        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                          <button
                            onClick={() => markRead(n.id)}
                            style={{
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.75rem',
                              padding: '0.5rem 1rem',
                              fontSize: '0.8125rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            className="input-hover"
                          >
                            <CheckCircle size={14} /> Đánh dấu đã đọc
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        total={total}
        currentCount={items.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSize
      />
    </div>
  );
}

