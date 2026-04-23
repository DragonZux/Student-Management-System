"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Shield, Clock, User, AlertCircle, Activity, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import styles from './Audit.module.css';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/admin/audit-logs');
        if (!cancelled) setLogs(res.data || []);
      } catch (e) {
        console.error('Failed to load audit logs', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được nhật ký hệ thống');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

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
        <p>Giám sát toàn bộ hoạt động quản trị và sự kiện bảo mật thời gian thực.</p>
      </header>

      <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>

      <Card className={`${styles.logsCard} glass slide-right stagger-2`} style={{ padding: 0 }}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCol}>Sự kiện & Người thực hiện</div>
          <div className={styles.headerCol}>Thời gian</div>
          <div className={`${styles.headerCol} ${styles.severityCol}`}>Mức độ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} size={40} />
              <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang truy xuất nhật ký...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>
              <Shield size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p>Chưa có nhật ký hoạt động nào được ghi lại.</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const severity = getSeverityInfo(log.action);
              return (
                <div 
                  key={`${log.id}-${index}`} 
                  className={styles.logRow}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <div className={styles.eventInfo}>
                    <div className={styles.iconWrapper} style={{ background: severity.bgColor }}>
                      <Shield size={20} color={severity.iconColor} />
                    </div>
                    <div>
                      <div className={styles.actionTitle}>{log.action}</div>
                      <div className={styles.actorMeta}>
                        <User size={14} />
                        <span>{log.actor_id || 'System'}</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span className={styles.actorRole}>{log.actor_role || 'Auto'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.timeInfo}>
                    <div className={styles.dateRow}>
                      <Clock size={14} />
                      {log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN') : '--/--/----'}
                    </div>
                    <div className={styles.timeRow}>
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </div>
                  </div>

                  <div className={styles.severityCol}>
                    <span className={`badge ${severity.class}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      {severity.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
