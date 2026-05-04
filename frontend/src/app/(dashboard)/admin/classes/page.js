 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import { Building2, User, Clock, MapPin, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/classes.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function ClassesPage() {
  const {
    data: classes,
    loading: classesLoading,
    error: classesError,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh
  } = usePaginatedData('/admin/classes', { cacheKey: 'classes' });

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [depsLoading, setDepsLoading] = useState(true);
  const [depsError, setDepsError] = useState('');

  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    course_id: '',
    teacher_id: '',
    semester: '2026-Spring',
    room: '',
    capacity: 30,
    scheduleText: 'Monday 08:00-10:00',
  });

  useEffect(() => {
    let cancelled = false;
    const loadDeps = async () => {
      try {
        setDepsLoading(true);
        const [courseRes, teacherRes, roomRes] = await Promise.all([
          api.get('/admin/courses', { params: { skip: 0, limit: 1000 } }),
          api.get('/admin/users?role=teacher', { params: { skip: 0, limit: 1000 } }),
          api.get('/admin/classrooms', { params: { skip: 0, limit: 1000 } }),
        ]);
        if (!cancelled) {
          setCourses(courseRes.data?.data || courseRes.data || []);
          const teacherData = teacherRes.data?.data || teacherRes.data || [];
          setTeachers(teacherData);
          setClassrooms(roomRes.data?.data || roomRes.data || []);
        }
      } catch (e) {
        if (!cancelled) setDepsError('Không tải được dữ liệu hệ thống');
      } finally {
        if (!cancelled) setDepsLoading(false);
      }
    };
    loadDeps();
    return () => { cancelled = true; };
  }, []);

  const courseById = useMemo(() => {
    const map = new Map();
    for (const c of courses || []) map.set(c._id, c);
    return map;
  }, [courses]);
  const teacherById = useMemo(() => {
    const map = new Map();
    for (const t of teachers || []) map.set(t._id, t);
    return map;
  }, [teachers]);

  const normalizeSchedule = (text) => {
    const items = String(text || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((chunk) => {
        const match = chunk.match(/^(.*)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
        if (!match) return null;
        const dayPart = match[1].trim();
        const start = match[2];
        const end = match[3];
        if (!dayPart || !start || !end) return null;
        return { day: dayPart, start, end };
      })
      .filter(Boolean);
    return items;
  };

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({
      course_id: courses?.[0]?._id || '',
      teacher_id: teachers?.[0]?._id || '',
      semester: '2026-Spring',
      room: classrooms?.[0]?.code || '',
      capacity: classrooms?.[0]?.capacity || 30,
      scheduleText: 'Monday 08:00-10:00',
    });
    setShowForm(true);
  };
  const openEdit = (cls) => {
    setEditing(cls);
    setFormError('');
    setForm({
      course_id: cls.course_id || '',
      teacher_id: cls.teacher_id || '',
      semester: cls.semester || '2026-Spring',
      room: cls.room || '',
      capacity: cls.capacity ?? 30,
      scheduleText: (cls.schedule || []).map((s) => `${s.day} ${s.start}-${s.end}`).join('; '),
    });
    setShowForm(true);
  };

  const submit = async () => {
    setFormError('');
    const payload = {
      course_id: form.course_id,
      teacher_id: form.teacher_id,
      semester: form.semester,
      room: form.room,
      capacity: Number(form.capacity),
      schedule: normalizeSchedule(form.scheduleText),
    };
    if (!payload.course_id || !payload.teacher_id || !payload.room || !payload.semester) {
      popupValidationError(setFormError, 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    try {
      if (editing?._id) await api.patch(`/admin/classes/${editing._id}`, payload);
      else await api.post('/admin/classes', payload);
      setShowForm(false);
      refresh();
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Lưu lớp thất bại');
    }
  };

  const remove = async (cls) => {
    if (!confirm(`Xóa lớp này?`)) return;
    try {
      await api.delete(`/admin/classes/${cls._id}`);
      refresh();
    } catch (e) {
      alert(e.response?.data?.detail || 'Xóa lớp thất bại');
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Lớp học & Phân công</h1>
          <p>Quản lý kế hoạch giảng dạy, sắp xếp phòng học và điều phối giảng viên.</p>
        </div>
        <button className="btn-primary slide-right stagger-2" onClick={openCreate} disabled={depsLoading}>
          <Plus size={18} />
          Thiết lập lớp mới
        </button>
      </header>

      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title={editing ? 'Điều chỉnh thông tin lớp học' : 'Thiết lập lớp học mới'}
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{formError}</InlineMessage>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Học phần / Môn học</label>
              <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))}>
                <option value="">-- Lựa chọn môn học --</option>
                {(courses || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Giảng viên phụ trách</label>
              <select value={form.teacher_id} onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))}>
                <option value="">-- Lựa chọn giảng viên --</option>
                {(teachers || []).map((t) => (
                  <option key={t._id} value={t._id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Học kỳ (Semester)</label>
              <input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Ví dụ: 2026-Spring" />
            </div>
            <div className={styles.formField}>
              <label>Phòng học dự kiến</label>
              <select 
                value={form.room} 
                onChange={(e) => {
                  const rCode = e.target.value;
                  const rObj = classrooms.find(r => r.code === rCode);
                  setForm(p => ({ ...p, room: rCode, capacity: rObj ? rObj.capacity : p.capacity }));
                }} 
              >
                <option value="">-- Lựa chọn phòng học --</option>
                {(classrooms || []).map((rm) => (
                  <option key={rm._id} value={rm.code}>{rm.code} (Tòa: {rm.building} - Max: {rm.capacity})</option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Sức chứa tối đa (Capacity)</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label>Lịch học chi tiết (Ví dụ: Monday 08:00-10:00; Wednesday 13:00-15:00)</label>
              <input value={form.scheduleText} onChange={(e) => setForm((p) => ({ ...p, scheduleText: e.target.value }))} placeholder="Nhập lịch học theo định dạng 'Thứ Thời Gian'" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận tạo'}</button>
          </div>
        </div>
      </Modal>

      {(classesLoading || depsLoading) ? (
        <Card>
          <div style={{ padding: '1rem' }}>
            <TableSkeleton rows={8} columns={4} />
          </div>
        </Card>
      ) : (classesError || depsError) ? (
        <div className="error-state glass" style={{ textAlign: 'center', padding: '4rem', borderRadius: '2rem' }}>
          <InlineMessage variant="error">{classesError || depsError}</InlineMessage>
        </div>
      ) : (
        <div className="slide-right stagger-3">
          <div className={styles.classGrid}>
            {classes.map((cls) => {
              const crs = courseById.get(cls.course_id);
              const tch = teacherById.get(cls.teacher_id);
              const enrollmentPercentage = Math.min(100, Math.round((cls.current_enrollment / cls.capacity) * 100)) || 0;
              
              return (
                <div key={cls._id} className={styles.classCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.courseCode}>{crs?.code || 'CRS'}</div>
                    <h3 className={styles.courseTitle}>{crs?.title || 'Môn học mới'}</h3>
                    <div className="badge badge-primary" style={{ marginTop: '0.75rem' }}>{cls.semester}</div>
                  </div>
                  
                  <div className={styles.infoList}>
                    <div className={styles.infoItem}>
                      <div className={styles.iconWrapper} style={{ background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)' }}>
                        <User size={18} />
                      </div>
                      <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Giảng viên</span>
                        <strong>{tch?.full_name || 'Chưa chỉ định'}</strong>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <div className={styles.iconWrapper} style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
                        <MapPin size={18} />
                      </div>
                      <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Phòng học</span>
                        <strong>{cls.room || 'TBA'}</strong>
                      </div>
                    </div>
                    
                    <div className={styles.infoItem}>
                      <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                        <Clock size={18} />
                      </div>
                      <div className={styles.infoText}>
                        <span className={styles.infoLabel}>Lịch học</span>
                        <div>
                          {cls.schedule?.length ? cls.schedule.map((s, idx) => (
                            <div key={idx} style={{ marginBottom: '0.125rem' }}>{s.day}: <strong>{s.start}-{s.end}</strong></div>
                          )) : <span style={{ color: 'var(--muted-foreground)' }}>Chưa có lịch</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.statsSection}>
                    <div className={styles.statsHeader}>
                      <span className={styles.statsLabel}>TỶ LỆ GHI DANH</span>
                      <span className={styles.statsValue}>{cls.current_enrollment} / {cls.capacity}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${enrollmentPercentage}%` }} />
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button onClick={() => openEdit(cls)} className="action-icon-btn" style={{ flex: 1, background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)', border: 'none', padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Sửa</button>
                    <button onClick={() => remove(cls)} className="action-icon-btn" style={{ flex: 1, background: 'rgba(244, 63, 94, 0.08)', color: '#f43f5e', border: 'none', padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Xóa</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '3.5rem' }}>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              total={total}
              currentCount={classes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              showPageSize
            />
          </div>
        </div>
      )}
    </div>
  );
}
