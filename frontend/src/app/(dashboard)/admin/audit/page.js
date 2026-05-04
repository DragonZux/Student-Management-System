"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Shield, Clock, User, AlertCircle, Activity, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import styles from '@/styles/modules/admin/audit.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function AuditLogsPage() {
  const {
    data: logs,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh
  } = usePaginatedData('/admin/audit-logs', { cacheKey: 'audit-logs', initialLimit: 50 });

  const getSeverityInfo = (action = '') => {
    const a = String(action).toLowerCase();
    if (a.includes('delete') || a.includes('withdraw') || a.includes('reject') || a.includes('remove')) {
      return { label: 'Cảnh báo', class: 'badge-warning', iconColor: '#d97706', bgColor: 'rgba(217, 119, 6, 0.1)' };
    }
    if (a.includes('password') || a.includes('security') || a.includes('error') || a.includes('fail')) {
      return { label: 'Nghiêm trọng', class: 'badge-danger', iconColor: '#e11d48', bgColor: 'rgba(225, 29, 72, 0.1)' };
    }
    return { label: 'Thông tin', class: 'badge-primary', iconColor: 'var(--primary)', bgColor: 'rgba(99, 102, 241, 0.1)' };
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Nhật ký Hệ thống</h1>
        <p>Giám sát toàn bộ hoạt động quản trị, bảo mật và sự kiện hệ thống theo thời gian thực.</p>
      </header>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2.5rem' }}>{error}</InlineMessage>}

      <Card className={`${styles.logsCard} slide-right stagger-2`} style={{ padding: 0 }}>
        <div className={styles.tableHeader}>
          <div>Sự kiện & Người thực hiện</div>
          <div>Dấu mốc Thời gian</div>
          <div className={styles.severityCol}>Mức độ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <TableSkeleton rows={12} columns={3} />
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>
              <Activity size={64} style={{ opacity: 0.1, marginBottom: '2rem', color: 'var(--primary)' }} />
              <p>Hệ thống hiện tại chưa ghi nhận hoạt động nào mới.</p>
            </div>
          ) : (
            <>
              {logs.map((log, index) => {
                const severity = getSeverityInfo(log.action);
                return (
                  <div 
                    key={`${log._id || index}`} 
                    className={styles.logRow}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className={styles.eventInfo}>
                      <div className={styles.iconWrapper} style={{ background: severity.bgColor }}>
                        <Shield size={22} color={severity.iconColor} />
                      </div>
                      <div>
                        <div className={styles.actionTitle}>{log.action}</div>
                        <div className={styles.actorMeta}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={14} />
                            <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{log.actor_id || 'Hệ thống'}</span>
                          </div>
                          <span style={{ opacity: 0.2 }}>•</span>
                          <span className={styles.actorRole}>{log.actor_role || 'Tự động'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.timeInfo}>
                      <div className={styles.dateRow}>
                        <Clock size={15} />
                        {log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '--/--/----'}
                      </div>
                      <div className={styles.timeRow}>
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </div>
                    </div>

                    <div className={styles.severityCol}>
                      <span className={`badge ${severity.class}`} style={{ 
                        padding: '0.45rem 1rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 900,
                        letterSpacing: '0.02em',
                        borderRadius: '0.75rem'
                      }}>
                        {severity.label.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div style={{ padding: '1.5rem 2rem 2.5rem' }}>
                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  currentCount={logs.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  showPageSize
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
