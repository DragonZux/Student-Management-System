 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Star, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError } from '@/lib/validation';

export default function FeedbackPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/student/my-enrollments', { params: { skip: 0, limit: 1000 } });
        if (!cancelled) {
          setEnrollments(res.data?.data || res.data || []);
        }
      } catch (e) {
        console.error('Failed to load enrollments', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách đăng ký');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const classes = useMemo(() => {
    return (enrollments || []).map((e) => ({
      classId: e.class_id,
      courseLabel: e.course ? `${e.course.code}: ${e.course.title}` : e.class_id,
    }));
  }, [enrollments]);

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0].classId);
  }, [classes, selectedClass]);

  const submit = async () => {
    if (!selectedClass) return;
    setSubmitMessage('');
    setSubmitError('');
    if (!isInRange(rating, 1, 5)) {
      popupValidationError(setSubmitError, 'Điểm đánh giá phải trong khoảng 1 đến 5.');
      return;
    }
    if (String(comment || '').length > 1000) {
      popupValidationError(setSubmitError, 'Nhận xét tối đa 1000 ký tự.');
      return;
    }
    try {
      await api.post('/student/feedback', { class_id: selectedClass, rating, comment });
      setComment('');
      setSubmitMessage('Đã gửi phản hồi thành công.');
    } catch (e) {
      console.error('Failed to submit feedback', e);
      setSubmitError(e.response?.data?.detail || 'Gửi phản hồi thất bại');
    }
  };

  return (
    <div>
      <h1>Phản hồi & khảo sát môn học</h1>
      <p style={{ marginBottom: '2rem' }}>Hãy giúp chúng tôi cải thiện bằng cách phản hồi về môn học và giảng viên.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? <Card className="glass">Đang tải...</Card> : null}
        <InlineMessage variant="error">{error}</InlineMessage>

        <Card title="Gửi phản hồi" className="glass">
          <InlineMessage variant="success" style={{ marginBottom: '0.75rem' }}>{submitMessage}</InlineMessage>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{submitError}</InlineMessage>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lớp học</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>{c.courseLabel}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Mức hài lòng tổng thể</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={24}
                    color={star <= rating ? '#eab308' : 'var(--muted)'}
                    fill={star <= rating ? '#eab308' : 'none'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Nhận xét (không bắt buộc)</p>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '80px' }} placeholder="Your thoughts..."></textarea>
            </div>

            <button style={{ 
              padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', 
              borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
            onClick={submit}
            disabled={loading || !selectedClass}
            >
              <MessageSquare size={18} /> Gửi phản hồi
            </button>
          </div>
        </Card>
        {!loading && !error && classes.length === 0 ? <Card className="glass">Chưa có lớp học nào để phản hồi.</Card> : null}
      </div>
    </div>
  );
}
