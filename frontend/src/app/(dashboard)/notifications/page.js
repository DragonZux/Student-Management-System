"use client";
import Card from '@/components/ui/Card';
import { Bell, Clock, Info, CheckCircle, Trash2, CheckCheck, Loader2, BookOpen, CreditCard, ShieldCheck } from 'lucide-react';
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
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
  };

  const items = useMemo(() => {
    return (notifications || []).map((n) => {
      const title = n.title?.toLowerCase() || '';
      let category = 'system';
      if (title.includes('học phí') || title.includes('thanh toán') || title.includes('tiền')) category = 'finance';
      else if (title.includes('lớp') || title.includes('học') || title.includes('môn')) category = 'class';
      else if (title.includes('bảo mật') || title.includes('tài khoản')) category = 'security';

      return {
        ...n,
        time: formatTimeAgo(n.created_at),
        category
      };
    });
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
    try {
      await api.post(`/notifications/${id}/read`);
      refresh();
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const getCategoryConfig = (cat) => {
    switch (cat) {
      case 'finance': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: CreditCard };
      case 'class': return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', icon: BookOpen };
      case 'security': return { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', icon: ShieldCheck };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', icon: Info };
    }
  };

  return (
    <div className="notifications-container animate-in">
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        padding: '0 0.5rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: 900, 
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, var(--foreground), var(--muted-foreground))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Thông báo
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.05rem', fontWeight: 500 }}>
            {total > 0 ? `Bạn có ${items.filter(n => !n.read).length} thông báo mới chưa đọc.` : 'Luôn cập nhật những thay đổi mới nhất.'}
          </p>
        </div>

        {items.some(n => !n.read) && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="glass-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.875rem 1.5rem',
              borderRadius: '1.25rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {markingAll ? <Loader2 className="animate-spin" size={20} /> : <CheckCheck size={20} />}
            <span>Đánh dấu tất cả</span>
          </button>
        )}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {loading && items.length === 0 ? (
          <div style={{ 
            padding: '6rem 2rem', 
            textAlign: 'center', 
            background: 'var(--glass-bg)',
            borderRadius: '2rem',
            border: '1px solid var(--glass-border)'
          }}>
            <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
            <h3 style={{ fontWeight: 700 }}>Đang làm mới dữ liệu...</h3>
          </div>
        ) : null}

        <AnimatePresence mode="popLayout">
          {!loading && items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div style={{ 
                textAlign: 'center', 
                padding: '6rem 2rem',
                background: 'var(--glass-bg)',
                borderRadius: '2.5rem',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                  borderRadius: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '2rem',
                  transform: 'rotate(-10deg)'
                }}>
                  <Bell size={48} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Tất cả đã xong!</h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
                  Bạn hiện không có thông báo nào. Chúng tôi sẽ báo cho bạn khi có tin mới.
                </p>
              </div>
            </motion.div>
          ) : (
            items.map((n, idx) => {
              const notificationKey = n.id || n._id || `${n.created_at || 'notification'}-${idx}`;
              const config = getCategoryConfig(n.category);
              const CategoryIcon = config.icon;

              return (
                <motion.div
                  key={notificationKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  layout
                >
                  <div 
                    onClick={() => !n.read && markRead(n._id || n.id)}
                    style={{
                      padding: '1.5rem',
                      background: n.read ? 'var(--glass-bg)' : 'white',
                      border: '1px solid',
                      borderColor: n.read ? 'var(--glass-border)' : 'rgba(99, 102, 241, 0.2)',
                      borderRadius: '1.75rem',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start',
                      boxShadow: n.read ? 'none' : '0 12px 24px -8px rgba(99, 102, 241, 0.12)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      cursor: n.read ? 'default' : 'pointer'
                    }}
                    className={!n.read ? 'notification-card-unread' : ''}
                  >
                    {!n.read && (
                      <div style={{
                        position: 'absolute',
                        top: '1.75rem',
                        right: '1.75rem',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        boxShadow: '0 0 12px var(--primary)',
                        zIndex: 10
                      }} />
                    )}

                    <div style={{
                      padding: '1rem',
                      background: config.bg,
                      borderRadius: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: config.color,
                      flexShrink: 0
                    }}>
                      <CategoryIcon size={24} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '0.625rem' 
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            color: config.color, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em' 
                          }}>
                            {n.category === 'finance' ? 'Tài chính' : 
                             n.category === 'class' ? 'Lớp học' : 
                             n.category === 'security' ? 'Bảo mật' : 'Hệ thống'}
                          </span>
                          <h3 style={{ 
                            margin: 0,
                            fontWeight: 800, 
                            fontSize: '1.125rem', 
                            color: n.read ? 'var(--muted-foreground)' : 'var(--foreground)',
                            lineHeight: 1.3
                          }}>
                            {n.title}
                          </h3>
                        </div>
                        <span style={{
                          fontSize: '0.8125rem',
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600,
                          padding: '0.35rem 0.75rem',
                          background: 'rgba(0,0,0,0.03)',
                          borderRadius: '0.75rem'
                        }}>
                          <Clock size={14} /> {n.time}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '1rem',
                        color: n.read ? 'var(--muted-foreground)' : 'var(--muted-foreground)',
                        opacity: n.read ? 0.7 : 0.9,
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: '3rem' }}>
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

      <style jsx>{`
        .notification-card-unread:hover {
          transform: translateY(-4px);
          border-color: var(--primary) !important;
          box-shadow: 0 15px 30px -10px rgba(99, 102, 241, 0.2) !important;
        }
        .glass-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 12px 25px -5px rgba(99, 102, 241, 0.5) !important;
        }
        .glass-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

