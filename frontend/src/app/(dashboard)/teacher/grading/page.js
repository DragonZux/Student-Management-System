 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError, toNumber } from '@/lib/validation';
import PaginationControls from '@/components/ui/PaginationControls';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const loadStudents = async (classId) => {
    const res = await api.get(`/teacher/classes/${classId}/students`, {
      params: { skip: (page - 1) * pageSize, limit: pageSize },
    });
    setItems(res.data?.data || res.data || []);
    setTotalItems(res.data?.total || 0);
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
          setItems(res.data?.data || res.data || []);
          setTotalItems(res.data?.total || 0);
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

import styles from '@/styles/modules/teacher/grading.module.css';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const loadStudents = async (classId) => {
    const res = await api.get(`/teacher/classes/${classId}/students`, {
      params: { skip: (page - 1) * pageSize, limit: pageSize },
    });
    setItems(res.data?.data || res.data || []);
    setTotalItems(res.data?.total || 0);
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
          setItems(res.data?.data || res.data || []);
          setTotalItems(res.data?.total || 0);
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
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div className={styles.headerTitle}>
          <h1>Chấm điểm & Phản hồi</h1>
          <p>Xem danh sách bài nộp và đánh giá năng lực học tập của sinh viên.</p>
        </div>
      </header>

      <div className={`${styles.classSelector} slide-right stagger-2`}>
        <label className={styles.selectorLabel}>Chọn lớp học mục tiêu</label>
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)} 
          className={styles.select}
        >
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.course_code || 'Course'} - {c.course_title || c.course_id}</option>
          ))}
        </select>
      </div>

      {grading && (
        <div className={styles.gradingOverlay}>
          <div className={`${styles.gradingModal} scale-in`}>
            <div className={styles.modalHeader}>
              <h2>Chấm điểm: {grading.student?.full_name || grading.enrollment?.student_id}</h2>
              <p>Hệ điểm 100 • Sinh viên mã ID: {(grading.student?._id || grading.enrollment?.student_id || '').slice(-8).toUpperCase()}</p>
            </div>
            
            <div className={styles.modalBody}>
              {formError && <InlineMessage variant="error">{formError}</InlineMessage>}
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Điểm số tổng kết</label>
                <input 
                  className={styles.input}
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)} 
                  placeholder="Ví dụ: 85"
                  style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Nhận xét từ Giảng viên</label>
                <textarea 
                  className={styles.textarea}
                  value={comments} 
                  onChange={(e) => setComments(e.target.value)} 
                  placeholder="Nhập phản hồi chi tiết cho sinh viên..."
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => setGrading(null)} 
                className="btn-secondary"
                style={{ flex: 1, padding: '1rem', borderRadius: '1rem', fontWeight: 800 }}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={submit} 
                className="btn-primary"
                style={{ flex: 2, padding: '1rem', borderRadius: '1rem', fontWeight: 900 }}
              >
                Lưu kết quả & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="slide-right stagger-3">
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><CheckCircle size={20} /> Hàng chờ chấm điểm</div>} className={styles.queueCard} style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang truy xuất dữ liệu sinh viên...</p>
            </div>
          ) : (
            <div className={styles.studentList}>
              {items.length === 0 ? (
                <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                  Không có sinh viên nào cần chấm điểm trong lớp này.
                </div>
              ) : items.map((it, index) => (
                <div 
                  key={it.enrollment?._id} 
                  className={styles.studentItem}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={styles.studentMain}>
                    <div className={styles.studentName}>{it.student?.full_name || it.enrollment?.student_id}</div>
                    <div className={styles.courseMeta}>{classLabel}</div>
                    <div className={styles.timeInfo}>
                      <Clock size={14} /> 
                      {it.enrollment?.graded_at ? `Cập nhật lúc ${new Date(it.enrollment.graded_at).toLocaleString('vi-VN')}` : 'Chưa có điểm'}
                    </div>
                  </div>

                  <div className={styles.rightMeta}>
                    <span className={styles.badge} style={{ 
                      background: it.enrollment?.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: it.enrollment?.status === 'completed' ? '#059669' : '#d97706'
                    }}>
                      {it.enrollment?.status === 'completed' ? 'Hoàn thành' : 'Đang học'} 
                      {it.enrollment?.grade != null && <span style={{ marginLeft: '0.5rem', fontWeight: 900 }}>[{it.enrollment.grade}]</span>}
                    </span>
                    
                    <button 
                      className={styles.gradeBtn}
                      onClick={() => openGrade(it)}
                    >
                      <MessageSquare size={18} /> {it.enrollment?.grade != null ? 'Sửa điểm' : 'Chấm điểm'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '1.5rem' }}>
            <PaginationControls
              page={page}
              totalPages={Math.max(1, Math.ceil(totalItems / pageSize))}
              total={totalItems}
              currentCount={items.length}
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
}
