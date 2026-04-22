"use client";
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { MessageSquare, Star } from 'lucide-react';
import api from '@/lib/api';

export default function TeacherFeedbackPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadClasses() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/teacher/my-classes');
        if (!cancelled) setClasses(res.data || []);
      } catch (e) {
        console.error('Failed to load teacher classes', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách lớp');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]._id);
  }, [classes, selectedClass]);

  useEffect(() => {
    let cancelled = false;
    async function loadFeedback() {
      if (!selectedClass) return;
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/teacher/feedback/${selectedClass}`);
        if (!cancelled) setFeedback(res.data || []);
      } catch (e) {
        console.error('Failed to load class feedback', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được phản hồi của lớp');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [selectedClass]);

  const classLabel = useMemo(() => {
    const cls = classes.find((item) => item._id === selectedClass);
    if (!cls) return '';
    return `${cls.course_code || 'Course'} - ${cls.course_title || cls.course_id}`;
  }, [classes, selectedClass]);

  const averageRating = useMemo(() => {
    if (!feedback.length) return 0;
    const total = feedback.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return (total / feedback.length).toFixed(2);
  }, [feedback]);

  return (
    <div>
      <h1>Phản hồi lớp học</h1>
      <p style={{ marginBottom: '1.5rem' }}>Theo dõi đánh giá của sinh viên để cải thiện chất lượng giảng dạy.</p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Lớp học</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', minWidth: 320 }}
        >
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>{cls.course_code || 'Course'} - {cls.course_title || cls.course_id}</option>
          ))}
        </select>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <Card className="glass">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Lớp đang xem</div>
          <div style={{ fontWeight: 700, marginTop: '0.35rem' }}>{classLabel || 'Chưa chọn lớp'}</div>
        </Card>
        <Card className="glass">
          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Điểm trung bình</div>
          <div style={{ fontWeight: 700, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Star size={16} color="#eab308" fill="#eab308" /> {averageRating}
          </div>
        </Card>
      </div>

      <Card title="Danh sách phản hồi" className="glass">
        {loading ? <div>Đang tải...</div> : null}
        {!loading && feedback.length === 0 ? <div>Chưa có phản hồi nào cho lớp này.</div> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {feedback.map((item) => (
            <div key={item._id || item.id} style={{ padding: '0.9rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <MessageSquare size={16} /> {String(item.student_id || '').slice(0, 8)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem' }}>
                  <Star size={14} color="#eab308" fill="#eab308" /> {Number(item.rating || 0).toFixed(1)}
                </div>
              </div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{item.comment || 'Không có nhận xét.'}</div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
