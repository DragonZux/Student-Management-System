 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { LogOut, AlertCircle, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { hasMinLength, popupValidationError } from '@/lib/validation';

export default function WithdrawalPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const load = async () => {
    const res = await api.get('/student/my-enrollments');
    setEnrollments(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load enrollments', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách đăng ký');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const withdrawable = useMemo(() => {
    return (enrollments || []).filter((e) => e.status === 'enrolled');
  }, [enrollments]);

  useEffect(() => {
    if (!selectedEnrollment && withdrawable.length > 0) setSelectedEnrollment(withdrawable[0]._id);
  }, [withdrawable, selectedEnrollment]);

  const submit = async () => {
    if (!selectedEnrollment) return;
    setSubmitMessage('');
    setSubmitError('');
    if (!hasMinLength(reason, 10)) {
      popupValidationError(setSubmitError, 'Vui lòng nhập lý do rút học phần tối thiểu 10 ký tự.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post(`/student/withdraw/${selectedEnrollment}`, {
        reason: reason.trim(),
      });
      setReason('');
      await load();
      setSubmitMessage('Đã gửi yêu cầu rút học phần thành công. Vui lòng chờ quản trị viên phê duyệt.');
    } catch (e) {
      console.error('Withdrawal failed', e);
      setSubmitError(e.response?.data?.detail || 'Rút học phần thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Yêu cầu rút học phần</h1>
        <p style={{ fontSize: '1.1rem' }}>Gửi yêu cầu chính thức để rút khỏi một học phần đã đăng ký.</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <Card className="glass" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem' }}>
                <AlertCircle color="#d97706" size={24} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#92400e' }}>Lưu ý quan trọng</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#b45309' }}>
                  Việc rút học phần có thể ảnh hưởng đến học bổng và tiến độ học tập. Vui lòng cân nhắc kỹ.
                </p>
              </div>
            </div>

            <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>
            <InlineMessage variant="success" style={{ marginBottom: '1.5rem' }}>{submitMessage}</InlineMessage>
            <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{submitError}</InlineMessage>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Học phần muốn rút</label>
                <select
                  value={selectedEnrollment}
                  onChange={(e) => setSelectedEnrollment(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '1rem' }}
                  className="input-hover"
                >
                  {withdrawable.length === 0 && <option value="">Không có học phần nào khả dụng để rút</option>}
                  {withdrawable.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.course?.code} - {e.course?.title} ({e.class_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Lý do rút học phần</label>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', minHeight: '160px', fontSize: '1rem', resize: 'vertical' }} 
                  placeholder="Vui lòng nêu lý do chi tiết..."
                  className="input-hover"
                ></textarea>
              </div>

              <button 
                className="btn-primary"
                style={{ 
                  padding: '1.125rem', background: '#e11d48', color: 'white', border: 'none', borderRadius: '1.125rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.05rem',
                  boxShadow: '0 10px 20px -5px rgba(225, 29, 72, 0.3)'
                }}
                onClick={submit}
                disabled={loading || submitting || !selectedEnrollment}
              >
                <LogOut size={20} /> {submitting ? 'Đang xử lý...' : 'Gửi yêu cầu rút học phần ngay'}
              </button>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Lịch sử yêu cầu</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrollments.filter(e => e.status === 'withdrawal_pending' || e.status === 'withdrawn').map(e => (
              <Card key={e._id} className="glass" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '0.75rem' }}>
                    <FileText size={20} color="var(--primary)" />
                  </div>
                  <span className={`badge ${e.status === 'withdrawn' ? 'badge-success' : 'badge-warning'}`}>
                    {e.status === 'withdrawn' ? 'Đã duyệt' : 'Đang chờ'}
                  </span>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800 }}>{e.course?.code}: {e.course?.title}</h4>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--muted-foreground)' }}>Lý do:</span> {e.withdrawal_reason}
                  </div>
                </div>
              </Card>
            ))}
            
            {enrollments.filter(e => e.status === 'withdrawal_pending' || e.status === 'withdrawn').length === 0 && (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
                <p style={{ color: 'var(--muted-foreground)', fontWeight: 600, margin: 0 }}>Bạn chưa có yêu cầu nào.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
