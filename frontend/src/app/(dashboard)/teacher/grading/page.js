 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError, toNumber } from '@/lib/validation';

export default function TeacherGradingPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [items, setItems] = useState([]); // { enrollment, student }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grading, setGrading] = useState(null); // enrollment item
  const [grade, setGrade] = useState('');
  const [comments, setComments] = useState('');
  const [formError, setFormError] = useState('');

  const loadStudents = async (classId) => {
    const res = await api.get(`/teacher/classes/${classId}/students`);
    setItems(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/teacher/my-classes');
        if (!cancelled) {
          setClasses(res.data || []);
        }
      } catch (e) {
        console.error('Failed to load classes', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách lớp');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]._id);
  }, [classes, selectedClass]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedClass) return;
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/teacher/classes/${selectedClass}/students`);
        if (!cancelled) {
          setItems(res.data || []);
        }
      } catch (e) {
        console.error('Failed to load students', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách sinh viên');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedClass]);

  const openGrade = (it) => {
    setGrading(it);
    setFormError('');
    setGrade(it?.enrollment?.grade ?? '');
    setComments(it?.enrollment?.teacher_comments ?? '');
  };

  const submit = async () => {
    if (!grading?.enrollment?._id) return;
    setFormError('');
    const g = toNumber(grade);
    if (g === null) {
      popupValidationError(setFormError, 'Điểm không hợp lệ.');
      return;
    }
    if (!isInRange(g, 0, 100)) {
      popupValidationError(setFormError, 'Điểm phải trong khoảng 0 đến 100.');
      return;
    }
    try {
      await api.post(`/teacher/grade/${grading.enrollment._id}`, null, {
        params: { grade: g, comments: comments || '' },
      });
      setGrading(null);
      await loadStudents(selectedClass);
    } catch (e) {
      console.error('Failed to grade', e);
      setFormError(e.response?.data?.detail || 'Chấm điểm thất bại');
    }
  };

  const classLabel = useMemo(() => {
    const c = classes.find((x) => x._id === selectedClass);
    return c ? `${c.course_code || 'Course'} - ${c.course_title || c.course_id}` : '';
  }, [classes, selectedClass]);

  return (
    <div>
      <h1>Hàng chờ chấm điểm & phản hồi</h1>
      <p style={{ marginBottom: '2rem' }}>Xem bài nộp của sinh viên và đưa ra phản hồi cụ thể.</p>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>Lớp học</label>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', minWidth: 320 }}>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.course_code || 'Course'} - {c.course_title || c.course_id}</option>
          ))}
        </select>
      </div>

      {grading ? (
        <Card title={`Grade: ${grading.student?.full_name || grading.enrollment?.student_id}`} className="glass" footer={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setGrading(null)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>
              Hủy
            </button>
            <button onClick={submit} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 800 }}>
              Lưu điểm
            </button>
          </div>
        }>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Điểm</label>
              <input value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Nhận xét</label>
              <input value={comments} onChange={(e) => setComments(e.target.value)} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
        </Card>
      ) : null}

      <Card title="Chờ xem xét">
        {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
        <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((it) => (
            <div key={it.enrollment?._id} style={{ 
              padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{it.student?.full_name || it.enrollment?.student_id}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{classLabel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
                  <Clock size={12} /> {it.enrollment?.graded_at ? `đã chấm lúc ${new Date(it.enrollment.graded_at).toLocaleString()}` : 'chưa chấm'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                  background: it.enrollment?.status === 'completed' ? '#dcfce7' : '#fef9c3',
                  color: it.enrollment?.status === 'completed' ? '#166534' : '#854d0e'
                }}>{it.enrollment?.status || 'enrolled'} {it.enrollment?.grade != null ? `(${it.enrollment.grade})` : ''}</span>
                
                <button className="glass" style={{ 
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary)',
                  color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
                onClick={() => openGrade(it)}
                >
                  <MessageSquare size={16} /> Chấm điểm
                </button>
              </div>
            </div>
          ))}
          {!loading && !error && items.length === 0 ? <div style={{ padding: '1rem' }}>Không có dữ liệu đăng ký.</div> : null}
        </div>
      </Card>
    </div>
  );
}
