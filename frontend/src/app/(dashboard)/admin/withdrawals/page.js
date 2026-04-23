"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await api.get('/admin/withdrawal-requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error('Failed to load withdrawal requests', e);
      setError(e.response?.data?.detail || 'Không tải được danh sách yêu cầu rút học phần');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id);
      if (action === 'approve') {
        await api.post(`/admin/withdrawal-requests/${id}/approve`);
      } else {
        const reason = prompt('Nhập lý do từ chối:');
        if (reason === null) return;
        await api.post(`/admin/withdrawal-requests/${id}/reject`, { reason });
      }
      await loadRequests();
    } catch (e) {
      alert(e.response?.data?.detail || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Duyệt rút học phần</h1>
        <p style={{ fontSize: '1.1rem' }}>Phê duyệt hoặc từ chối các yêu cầu rút học phần chính thức từ sinh viên.</p>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="animate-spin-slow" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            <Clock size={32} color="var(--primary)" />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải danh sách yêu cầu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
          {requests.map((req) => (
            <Card key={req.enrollment_id} className="glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3rem', flex: 1 }}>
                  <div style={{ minWidth: '240px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Sinh viên</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                        {req.student_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{req.student_name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{req.student_email}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ minWidth: '280px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Học phần</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-primary">{req.course_code}</span>
                      <span style={{ fontWeight: 700 }}>{req.course_title}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--muted-foreground)', marginRight: '0.5rem' }}>Lý do:</span>
                      {req.reason}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Ngày gửi</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9375rem' }}>
                      <Clock size={16} />
                      {new Date(req.requested_at).toLocaleDateString('vi-VN')}
                      <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
                        {new Date(req.requested_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginLeft: '2rem' }}>
                  <button 
                    onClick={() => handleAction(req.enrollment_id, 'reject')}
                    disabled={actionLoading === req.enrollment_id}
                    className="input-hover"
                    style={{ 
                      padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid #fee2e2', 
                      background: 'rgba(225, 29, 72, 0.05)', color: '#e11d48', cursor: 'pointer', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '0.625rem', transition: 'all 0.2s ease'
                    }}
                  >
                    <XCircle size={20} /> Từ chối
                  </button>
                  <button 
                    onClick={() => handleAction(req.enrollment_id, 'approve')}
                    disabled={actionLoading === req.enrollment_id}
                    className="btn-primary"
                    style={{ 
                      padding: '0.75rem 1.5rem', borderRadius: '1rem',
                      justifyContent: 'center', gap: '0.625rem',
                      boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    <CheckCircle size={20} /> Phê duyệt
                  </button>
                </div>
              </div>
            </Card>
          ))}
          
          {requests.length === 0 && (
            <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '2rem', border: '2px dashed var(--border)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <CheckCircle size={32} color="var(--muted-foreground)" />
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Tất cả đã hoàn tất!</p>
              <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Không có yêu cầu rút học phần nào đang chờ xử lý.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
