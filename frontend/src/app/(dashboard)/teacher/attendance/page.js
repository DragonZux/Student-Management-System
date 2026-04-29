 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';
import PaginationControls from '@/components/ui/PaginationControls';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

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
        console.error('Failed to load teacher classes', e);
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
    setPage(1);
  }, [selectedClass]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedClass) return;
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/teacher/classes/${selectedClass}/students`, {
          params: { skip: (page - 1) * pageSize, limit: pageSize },
        });
        if (!cancelled) {
          const payload = res.data?.data || res.data || [];
          const items = payload.map((x) => ({
            enrollment: x.enrollment,
            student: x.student,
            status: 'present',
          }));
          setStudents(items);
          setTotalStudents(res.data?.total || payload.length);
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
  }, [selectedClass, page, pageSize]);

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
import styles from '@/styles/modules/teacher/attendance.module.css';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

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
        console.error('Failed to load teacher classes', e);
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
    setPage(1);
  }, [selectedClass]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedClass) return;
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/teacher/classes/${selectedClass}/students`, {
          params: { skip: (page - 1) * pageSize, limit: pageSize },
        });
        if (!cancelled) {
          const payload = res.data?.data || res.data || [];
          const items = payload.map((x) => ({
            enrollment: x.enrollment,
            student: x.student,
            status: 'present',
          }));
          setStudents(items);
          setTotalStudents(res.data?.total || payload.length);
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
  }, [selectedClass, page, pageSize]);

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
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div className={styles.headerTitle}>
          <h1>Điểm danh Lớp học</h1>
          <p>
            Đang xem lớp: 
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              className={styles.classSelect}
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.course_code || 'Môn học'} - {c.course_title || c.course_id}</option>
              ))}
            </select>
          </p>
        </div>
        <div className={styles.datePickerCard}>
          <Calendar size={20} color="var(--primary)" />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className={styles.dateInput} 
          />
        </div>
      </header>

      <div className={`${styles.statsRow} slide-right stagger-2`}>
        <Card>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Sinh viên có mặt</p>
              <h2 className={styles.statValue} style={{ color: '#059669' }}>{stats.present}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
              <CheckCircle color="#059669" size={32} />
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Sinh viên vắng mặt</p>
              <h2 className={styles.statValue} style={{ color: '#f43f5e' }}>{stats.absent}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.08)' }}>
              <XCircle color="#f43f5e" size={32} />
            </div>
          </div>
        </Card>
      </div>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}
      {submitMessage && <InlineMessage variant="success" style={{ marginBottom: '2rem' }}>{submitMessage}</InlineMessage>}
      {submitError && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{submitError}</InlineMessage>}

      <div className="slide-right stagger-3">
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><Users size={20} /> Danh sách Sinh viên</div>}
        >
          <div className={styles.studentList}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải danh sách sinh viên...</p>
              </div>
            ) : students.length === 0 ? (
              <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                Không tìm thấy sinh viên nào trong lớp này.
              </div>
            ) : students.map((student, index) => (
              <div 
                key={student.enrollment?._id} 
                className={styles.studentRow}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.studentInfo}>
                  <div className={styles.avatar}>
                    {(student.student?.full_name || '??').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={styles.studentDetails}>
                    <h4>{student.student?.full_name || 'N/A'}</h4>
                    <span>ID: {(student.student?._id || student.enrollment.student_id || '').slice(-8).toUpperCase()}</span>
                  </div>
                </div>
                <div className={styles.statusActions}>
                  <button 
                    className={`${styles.statusBtn} ${student.status === 'present' ? styles.btnPresentActive : styles.btnPresent}`}
                    onClick={() => toggle(student.enrollment._id, 'present')}
                  >
                    <CheckCircle size={18} /> Có mặt
                  </button>
                  <button 
                    className={`${styles.statusBtn} ${student.status === 'absent' ? styles.btnAbsentActive : styles.btnAbsent}`}
                    onClick={() => toggle(student.enrollment._id, 'absent')}
                  >
                    <XCircle size={18} /> Vắng mặt
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footerActions}>
            <button 
              className={styles.submitBtn}
              onClick={submitAttendanceFixed}
              disabled={loading || submitting || !selectedClass || students.length === 0}
            >
              {submitting ? 'Đang gửi dữ liệu...' : 'Xác nhận Điểm danh'}
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <PaginationControls
              page={page}
              totalPages={Math.max(1, Math.ceil(totalStudents / pageSize))}
              total={totalStudents}
              currentCount={students.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              showPageSize
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
    </div>
  );
}
