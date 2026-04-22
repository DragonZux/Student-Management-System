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

  const toSeverity = (action = '') => {
    const a = String(action).toLowerCase();
    if (a.includes('delete') || a.includes('withdraw')) return 'Warning';
    if (a.includes('change_password') || a.includes('security')) return 'Critical';
    return 'Info';
  };

  return (
    <div>
      <h1>Nhật ký hệ thống</h1>
      <p style={{ marginBottom: '2rem' }}>Theo dõi các thao tác quản trị và sự kiện bảo mật.</p>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
          {error ? <div style={{ padding: '1rem', color: '#991b1b' }}>{error}</div> : null}
          {logs.map((log, index) => (
            <div key={`${log.id ?? 'audit'}-${log.created_at ?? 'time'}-${index}`} style={{ 
              padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              display: 'grid', gridTemplateColumns: '48px 1fr 180px 120px', alignItems: 'center', gap: '1rem'
            }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Shield size={20} color={toSeverity(log.action) === 'Critical' ? '#991b1b' : 'var(--muted-foreground)'} />
              </div>
              
              <div>
                <div style={{ fontWeight: 600 }}>{log.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  Bởi: {log.actor_id || 'n/a'} | Vai trò: {log.actor_role || 'n/a'}
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={14} /> {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {(() => {
                  const severity = toSeverity(log.action);
                  return (
                <span style={{ 
                  padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                  background: severity === 'Critical' ? '#fee2e2' : severity === 'Warning' ? '#fef9c3' : '#dcfce7',
                  color: severity === 'Critical' ? '#991b1b' : severity === 'Warning' ? '#854d0e' : '#166534'
                }}>{severity}</span>
                  );
                })()}
              </div>
            </div>
          ))}
          {!loading && !error && logs.length === 0 ? <div style={{ padding: '1rem' }}>Chưa có nhật ký nào.</div> : null}
        </div>
      </Card>
    </div>
  );
}
