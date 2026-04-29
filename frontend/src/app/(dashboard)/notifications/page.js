"use client";
import Card from '@/components/ui/Card';
import { Bell, Clock, Info, CheckCircle, Trash2, CheckCheck, Loader2, BookOpen, CreditCard, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

import styles from '@/styles/modules/notifications.module.css';

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
      case 'finance': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: CreditCard, label: 'Tài chính' };
      case 'class': return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', icon: BookOpen, label: 'Học vụ' };
      case 'security': return { bg: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', icon: ShieldCheck, label: 'Bảo mật' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', icon: Info, label: 'Hệ thống' };
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div className={styles.headerTitle}>
          <h1>Thông báo</h1>
          <p>
            {total > 0 ? (
              <>Bạn có <span className={styles.highlight}>{items.filter(n => !n.read).length}</span> tin nhắn mới chưa xem.</>
            ) : 'Trung tâm cập nhật và tin tức hệ thống của bạn.'}
          </p>
        </div>

        {items.some(n => !n.read) && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className={styles.markAllBtn}
          >
            {markingAll ? <Loader2 className="animate-spin" size={22} /> : <CheckCheck size={22} />}
            Đánh dấu tất cả
          </button>
        )}
      </header>

      <div className={styles.list}>
        {loading && items.length === 0 ? (
          <div className={styles.loadingState}>
            <div className="spinner" />
            <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang cập nhật luồng thông báo...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={`${styles.emptyState} scale-in`}>
            <div className={styles.emptyIconWrapper}>
              <Bell size={64} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem' }}>Hộp thư trống</h2>
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 500, maxWidth: '300px' }}>
              Tuyệt vời! Bạn đã xem hết tất cả thông báo. Hãy quay lại sau nhé.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((n, idx) => {
              const config = getCategoryConfig(n.category);
              const CategoryIcon = config.icon;

              return (
                <motion.div
                  key={n._id || n.id || idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  layout
                >
                  <div 
                    onClick={() => !n.read && markRead(n._id || n.id)}
                    className={`${styles.card} ${!n.read ? styles.unread : styles.read}`}
                  >
                    {!n.read && <div className={styles.unreadDot} />}

                    <div className={styles.categoryIcon} style={{ backgroundColor: config.bg, color: config.color }}>
                      <CategoryIcon size={26} />
                    </div>

                    <div className={styles.content}>
                      <div className={styles.cardHeader}>
                        <div className={styles.meta}>
                          <span className={styles.tag} style={{ color: config.color }}>{config.label}</span>
                          <h3 className={styles.title}>{n.title}</h3>
                        </div>
                        <span className={styles.time}>
                          <Clock size={16} /> {n.time}
                        </span>
                      </div>
                      <p className={styles.message}>{n.message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className={`${styles.pagination} slide-right`}>
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
    </div>
  );
}

