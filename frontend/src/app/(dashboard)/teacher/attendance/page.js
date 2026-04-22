 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]); // { enrollment, student, status }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = async () => {
    const res = await api.get('/teacher/my-classes');
    setClasses(res.data || []);
  };

  const loadStudents = async (classId) => {
    const res = await api.get(`/teacher/classes/${classId}/students`);
    const items = (res.data || []).map((x) => ({
      enrollment: x.enrollment,
      student: x.student,
      status: 'present',
    }));
    setStudents(items);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await loadClasses();
      } catch (e) {
        console.error('Failed to load teacher classes', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách lớp');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedClass && classes.length > 0) setSelectedClass(classes[0]._id);
  }, [classes, selectedClass]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedClass) return;
      try {
        setLoading(true);
        setError('');
        await loadStudents(selectedClass);
      } catch (e) {
        console.error('Failed to load students', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách sinh viên');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedClass]);

  const stats = useMemo(() => {
    const present = students.filter((s) => s.status === 'present').length;
    const absent = students.filter((s) => s.status === 'absent').length;
    return { present, absent, total: students.length };
  }, [students]);

  const toggle = (enrollmentId, status) => {
    setStudents((prev) =>
      (prev || []).map((s) =>
        (s.enrollment?._id === enrollmentId)
          ? { ...s, status }
          : s
      )
    );
  };

  const submitAttendanceFixed = async () => {
    if (!selectedClass) return;
    const selectedDate = new Date(`${date}T00:00:00`);
    if (!date || Number.isNaN(selectedDate.getTime())) {
      popupValidationError(setSubmitError, 'Ngày điểm danh không hợp lệ.');
      setSubmitMessage('');
      return;
    }
    if (!students.length) {
      popupValidationError(setSubmitError, 'Không có sinh viên để điểm danh.');
      setSubmitMessage('');
      return;
    }
    const records = students.map((s) => ({
      student_id: s.enrollment.student_id,
      status: s.status.toUpperCase(),
    }));
    try {
      setSubmitting(true);
      setSubmitMessage('');
      setSubmitError('');
      await api.post(`/teacher/attendance/${selectedClass}`, records, { params: { date } });
      setSubmitMessage('Đã ghi nhận điểm danh thành công.');
    } catch (e) {
      console.error('Failed to submit attendance', e);
      setSubmitError(e.response?.data?.detail || 'Gửi điểm danh thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Theo dõi điểm danh</h1>
          <p>
            Class:{' '}
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.course_code || 'Môn học'} - {c.course_title || c.course_id}</option>
              ))}
            </select>
          </p>
        </div>
        <Card className="glass" style={{ padding: '0.5rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Calendar size={18} color="var(--primary)" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 700 }} />
          </div>
        </Card>
      </div>

      {loading ? <Card className="glass">Đang tải...</Card> : null}
      <InlineMessage variant="error">{error}</InlineMessage>
      <InlineMessage variant="success">{submitMessage}</InlineMessage>
      <InlineMessage variant="error">{submitError}</InlineMessage>

      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Sinh viên có mặt</p>
              <h2 style={{ margin: 0, color: '#166534' }}>{stats.present}</h2>
            </div>
            <Users color="#166534" size={32} opacity={0.2} />
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Sinh viên vắng mặt</p>
              <h2 style={{ margin: 0, color: '#991b1b' }}>{stats.absent}</h2>
            </div>
            <XCircle color="#991b1b" size={32} opacity={0.2} />
          </div>
        </Card>
      </div>

      <Card title="Điểm danh sinh viên">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {students.map((student) => (
            <div key={student.enrollment?._id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--card)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--muted)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}>
                  {(student.student?.full_name || student.enrollment.student_id || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{student.student?.full_name || 'N/A'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mã: {(student.student?._id || student.enrollment.student_id || '').slice(0, 8)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid #dcfce7', 
                  background: student.status === 'present' ? '#dcfce7' : 'white',
                  color: '#166534',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600
                }}
                onClick={() => toggle(student.enrollment._id, 'present')}
                >
                  <CheckCircle size={16} /> Có mặt
                </button>
                <button style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid #fee2e2', 
                  background: student.status === 'absent' ? '#fee2e2' : 'white',
                  color: '#991b1b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600
                }}
                onClick={() => toggle(student.enrollment._id, 'absent')}
                >
                  <XCircle size={16} /> Vắng mặt
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ 
            padding: '0.75rem 2rem', 
            borderRadius: 'var(--radius)', 
            background: 'var(--primary)', 
            color: 'white',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={submitAttendanceFixed}
          disabled={loading || submitting || !selectedClass}
          >
            {submitting ? 'Đang gửi...' : 'Gửi điểm danh'}
          </button>
        </div>
      </Card>
    </div>
  );
}
