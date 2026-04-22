 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Building2, User, Clock, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, popupValidationError } from '@/lib/validation';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const load = async () => {
    try {
      const [clsRes, courseRes, teacherRes, roomRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/courses'),
        api.get('/admin/users?role=teacher'),
        api.get('/admin/classrooms'),
      ]);
      setClasses(clsRes.data || []);
      setCourses(courseRes.data || []);
      setTeachers(teacherRes.data || []);
      setClassrooms(roomRes.data || []);
    } catch (e) {
      console.error('Failed to load data', e);
      throw e;
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được dữ liệu hệ thống');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
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
      await load();
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Lưu lớp thất bại');
    }
  };

  const remove = async (cls) => {
    if (!confirm(`Xóa lớp này?`)) return;
    try {
      await api.delete(`/admin/classes/${cls._id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || 'Xóa lớp thất bại');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Lớp học & Phân công (Cập nhật)</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={openCreate}
        >
          Tạo lớp mới
        </button>
      </div>

      {showForm ? (
        <Card className="glass" title={editing ? 'Cập nhật thông tin lớp' : 'Tạo lớp học mới'}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Môn học</label>
              <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <option value="">-- Chọn môn học --</option>
                {(courses || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Giảng viên</label>
              <select value={form.teacher_id} onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <option value="">-- Chọn giảng viên --</option>
                {(teachers || []).map((t) => (
                  <option key={t._id} value={t._id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Học kỳ</label>
              <input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Phòng học</label>
              <select 
                value={form.room} 
                onChange={(e) => {
                  const rCode = e.target.value;
                  const rObj = classrooms.find(r => r.code === rCode);
                  setForm(p => ({ ...p, room: rCode, capacity: rObj ? rObj.capacity : p.capacity }));
                }} 
                style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              >
                <option value="">-- Chọn phòng học --</option>
                {(classrooms || []).map((rm) => (
                  <option key={rm._id} value={rm.code}>{rm.code} ({rm.building} - Sức chứa: {rm.capacity})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Sức chứa</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Lịch học (VD: Monday 08:00-10:00)</label>
              <input value={form.scheduleText} onChange={(e) => setForm((p) => ({ ...p, scheduleText: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Hủy</button>
            <button onClick={submit} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Lưu lớp</button>
          </div>
        </Card>
      ) : null}

      <div style={{ marginTop: '2rem' }}>
        {loading ? <div>Đang tải dữ liệu...</div> : (
          <div className="grid grid-cols-2">
            {(classes || []).map((cls) => {
              const crs = courseById.get(cls.course_id);
              const tch = teacherById.get(cls.teacher_id);
              return (
                <Card key={cls._id} title={`${crs?.code || ''} - ${crs?.title || 'Môn học'}`} className="glass">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} /> <span style={{ fontWeight: 500 }}>{tch?.full_name || 'Chưa phân công'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} /> <span>Phòng: <strong>{cls.room}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} /> <span>{cls.schedule?.map(s => `${s.day} ${s.start}-${s.end}`).join(', ') || 'Chưa có lịch'}</span>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Sức chứa: {cls.current_enrollment}/{cls.capacity}</span>
                      <div>
                        <button onClick={() => openEdit(cls)} style={{ marginRight: '1rem', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Sửa</button>
                        <button onClick={() => remove(cls)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Xóa</button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
