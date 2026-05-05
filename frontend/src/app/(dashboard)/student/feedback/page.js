 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Star, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError } from '@/lib/validation';

export default function FeedbackPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
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
        const [enrollRes, feedbackRes] = await Promise.all([
          api.get('/student/my-enrollments', { params: { skip: 0, limit: 1000 } }),
          api.get('/student/my-feedback')
        ]);
        if (!cancelled) {
          setEnrollments(enrollRes.data?.data || enrollRes.data || []);
          setMyFeedback(feedbackRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được dữ liệu');
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
      course: e.course,
    }));
  }, [enrollments]);

  const reviewedClassIds = useMemo(() => {
    return new Set(myFeedback.map(f => f.class_id));
  }, [myFeedback]);

  const unreviewedClasses = useMemo(() => {
    return classes.filter(c => !reviewedClassIds.has(c.classId));
  }, [classes, reviewedClassIds]);

  useEffect(() => {
    if (!selectedClass && unreviewedClasses.length > 0) {
      setSelectedClass(unreviewedClasses[0].classId);
    }
  }, [unreviewedClasses, selectedClass]);

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
      setRating(4);
      setSubmitMessage('Đã gửi phản hồi thành công.');
      
      // Reload feedback data
      const res = await api.get('/student/my-feedback');
      setMyFeedback(res.data || []);
      
      // Reset selected class
      if (unreviewedClasses.length > 1) {
        const remaining = unreviewedClasses.filter(c => c.classId !== selectedClass);
        setSelectedClass(remaining.length > 0 ? remaining[0].classId : '');
      }
    } catch (e) {
      console.error('Failed to submit feedback', e);
      setSubmitError(e.response?.data?.detail || 'Gửi phản hồi thất bại');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div>
      <h1>Phản hồi & khảo sát môn học</h1>
      <p style={{ marginBottom: '2rem' }}>Hãy giúp chúng tôi cải thiện bằng cách phản hồi về môn học và giảng viên.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? <Card className="glass">Đang tải...</Card> : null}
        <InlineMessage variant="error">{error}</InlineMessage>

        {/* Form Gửi Phản Hồi */}
        <Card title="Gửi phản hồi" className="glass">
          {unreviewedClasses.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 1rem', color: 'var(--accent)' }} />
              <p style={{ fontWeight: 600 }}>Cảm ơn bạn! Bạn đã đánh giá tất cả các lớp.</p>
            </div>
          ) : (
            <>
              <InlineMessage variant="success" style={{ marginBottom: '0.75rem' }}>{submitMessage}</InlineMessage>
              <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{submitError}</InlineMessage>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Lớp học ({unreviewedClasses.length}/{classes.length})
                  </label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {unreviewedClasses.map((c) => (
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
                  <textarea 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '80px', fontFamily: 'inherit' }} 
                    placeholder="Chia sẻ ý kiến của bạn...">
                  </textarea>
                </div>

                <button 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 'var(--radius)', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem'
                  }}
                  onClick={submit}
                  disabled={loading || !selectedClass}
                >
                  <MessageSquare size={18} /> Gửi phản hồi
                </button>
              </div>
            </>
          )}
        </Card>

        {/* Danh sách Phản Hồi Đã Gửi */}
        {myFeedback.length > 0 && (
          <Card title={`Lịch sử phản hồi (${myFeedback.length})`} className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myFeedback.map((feedback, idx) => {
                const enrollClass = classes.find(c => c.classId === feedback.class_id);
                return (
                  <div key={feedback.id || idx} style={{
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border)',
                    background: 'rgba(99, 102, 241, 0.02)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.25rem 0' }}>
                          {enrollClass?.courseLabel || feedback.class_id}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>
                          {formatDate(feedback.created_at)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={18}
                              color={star <= feedback.rating ? '#eab308' : 'var(--border)'}
                              fill={star <= feedback.rating ? '#eab308' : 'none'}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, marginLeft: '0.5rem' }}>
                          {feedback.rating}/5
                        </span>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p style={{ margin: '0.75rem 0 0 0', color: 'var(--card-foreground)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {feedback.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {!loading && !error && classes.length === 0 ? (
          <Card className="glass">
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 1rem', color: 'var(--muted)' }} />
              Chưa có lớp học nào để phản hồi.
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
