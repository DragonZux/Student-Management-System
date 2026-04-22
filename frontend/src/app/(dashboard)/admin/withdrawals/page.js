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
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Duyệt rút học phần</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Phê duyệt hoặc từ chối các yêu cầu rút học phần từ sinh viên.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải danh sách yêu cầu...</div>
      ) : (
        <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
          {requests.map((req) => (
            <Card key={req.enrollment_id} className="glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <User size={16} color="var(--primary)" /> {req.student_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{req.student_email}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <BookOpen size={16} color="var(--primary)" /> {req.course_code}: {req.course_title}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Lý do: <span style={{ fontWeight: 400 }}>{req.reason}</span></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Clock size={16} /> {new Date(req.requested_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => handleAction(req.enrollment_id, 'reject')}
                    disabled={actionLoading === req.enrollment_id}
                    style={{ 
                      padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #fee2e2', 
                      background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    <XCircle size={18} /> Từ chối
                  </button>
                  <button 
                    onClick={() => handleAction(req.enrollment_id, 'approve')}
                    disabled={actionLoading === req.enrollment_id}
                    style={{ 
                      padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', 
                      background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={18} /> Phê duyệt
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {requests.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
              <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Không có yêu cầu rút học phần nào đang chờ xử lý.</p>
            </div>
          )}
        </div>
      )}
      <InlineMessage variant="error">{error}</InlineMessage>
    </div>
  );
}
