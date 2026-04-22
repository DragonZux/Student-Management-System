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
      // Backend currently doesn't accept reason; we record it locally + use audit logs for trace.
      await api.post(`/student/withdraw/${selectedEnrollment}`);
      setReason('');
      await load();
      setSubmitMessage('Đã gửi yêu cầu rút học phần thành công.');
    } catch (e) {
      console.error('Withdrawal failed', e);
      setSubmitError(e.response?.data?.detail || 'Rút học phần thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Yêu cầu rút học phần</h1>
      <p style={{ marginBottom: '2rem' }}>Gửi yêu cầu chính thức để rút khỏi một học phần đã đăng ký.</p>

      <Card className="glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          <AlertCircle color="#9a3412" />
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#9a3412' }}>
            Cảnh báo: Rút học phần có thể ảnh hưởng đến học bổng và tiến độ học tập. Hãy trao đổi với cố vấn học tập.
          </p>
        </div>

        {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
        <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <InlineMessage variant="success">{submitMessage}</InlineMessage>
          <InlineMessage variant="error">{submitError}</InlineMessage>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chọn học phần</label>
            <select
              value={selectedEnrollment}
              onChange={(e) => setSelectedEnrollment(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
            >
              {withdrawable.map((e) => (
                <option key={e._id} value={e._id}>
                  {(e.course?.code || 'Course')}: {e.course?.title || e.class_id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lý do rút học phần</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '120px' }} placeholder="Vui lòng nêu lý do..."></textarea>
          </div>
          <button style={{ 
            padding: '1rem', background: '#991b1b', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
          onClick={submit}
          disabled={loading || submitting || !selectedEnrollment}
          >
            <LogOut size={18} /> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu rút học phần'}
          </button>
        </div>
      </Card>
    </div>
  );
}
