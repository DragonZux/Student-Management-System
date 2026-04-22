 "use client";
import Card from '@/components/ui/Card';
import { Shield, Clock, User, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

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
    return () => {
      cancelled = true;
    };
  }, []);

  const getSeverityInfo = (action = '') => {
    const a = String(action).toLowerCase();
    if (a.includes('delete') || a.includes('withdraw') || a.includes('reject')) {
      return { label: 'Cảnh báo', class: 'badge-warning' };
    }
    if (a.includes('password') || a.includes('security') || a.includes('error')) {
      return { label: 'Nghiêm trọng', class: 'badge-danger' };
    }
    return { label: 'Thông tin', class: 'badge-primary' };
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Nhật ký hệ thống</h1>
        <p style={{ fontSize: '1.1rem' }}>Theo dõi các thao tác quản trị và sự kiện bảo mật theo thời gian thực.</p>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>

      <Card className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 180px 140px', gap: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sự kiện & Người thực hiện</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thời gian</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Mức độ</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="animate-spin-slow" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                <Activity size={32} color="var(--primary)" />
              </div>
              <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang truy xuất nhật ký...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <Shield size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Chưa có nhật ký hoạt động nào được ghi lại.</p>
            </div>
          ) : logs.map((log, index) => {
            const severity = getSeverityInfo(log.action);
            return (
              <div key={`${log.id}-${index}`} className="table-row-hover" style={{ 
                padding: '1.25rem 2rem', borderBottom: index === logs.length - 1 ? 'none' : '1px solid var(--border)',
                display: 'grid', gridTemplateColumns: '1fr 180px 140px', alignItems: 'center', gap: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: severity.class === 'badge-danger' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Shield size={20} color={severity.class === 'badge-danger' ? '#e11d48' : 'var(--primary)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.125rem' }}>{log.action}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={12} />
                      <span>{log.actor_id || 'Hệ thống'}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{log.actor_role || 'System'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} />
                    {log.created_at ? new Date(log.created_at).toLocaleDateString('vi-VN') : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', marginLeft: '1.25rem', opacity: 0.8 }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${severity.class}`}>{severity.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
