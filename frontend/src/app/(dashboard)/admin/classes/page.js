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
    const [clsRes, courseRes, teacherRes] = await Promise.all([
      api.get('/admin/classes'),
      api.get('/admin/courses'),
      api.get('/admin/users?role=teacher'),
    ]);
    setClasses(clsRes.data || []);
    setCourses(courseRes.data || []);
    setTeachers(teacherRes.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load classes', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách lớp');
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
    // Accept: "Monday 08:00-10:00; Thu 2 08:00-10:00"
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
      room: '',
      capacity: 30,
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
    const missing = [];
    if (!payload.course_id) missing.push('Môn học');
    if (!payload.teacher_id) missing.push('Giảng viên');
    if (!String(payload.semester || '').trim()) missing.push('Học kỳ');
    if (!String(payload.room || '').trim()) missing.push('Phòng học');
    if (missing.length > 0) {
      popupValidationError(setFormError, `Vui lòng nhập: ${missing.join(', ')}.`);
      return;
    }
    if (!payload.schedule || payload.schedule.length === 0) {
      popupValidationError(setFormError, 'Vui lòng nhập lịch học hợp lệ, ví dụ: Monday 08:00-10:00.');
      return;
    }
    if (String(payload.semester).trim().length < 4) {
      popupValidationError(setFormError, 'Học kỳ cần ít nhất 4 ký tự, ví dụ: 2026-Spring.');
      return;
    }
    if (!payload.capacity || payload.capacity <= 0) {
      popupValidationError(setFormError, 'Sức chứa phải là số lớn hơn 0.');
      return;
    }
    if (!isInRange(payload.capacity, 1, 1000)) {
      popupValidationError(setFormError, 'Sức chứa phải trong khoảng 1 đến 1000.');
      return;
    }
    try {
      if (editing?._id) await api.patch(`/admin/classes/${editing._id}`, payload);
      else await api.post('/admin/classes', payload);
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to save class', e);
      setFormError(e.response?.data?.detail || 'Lưu lớp thất bại');
    }
  };

  const remove = async (cls) => {
    if (!confirm(`Delete class ${cls._id}?`)) return;
    try {
      setError('');
      await api.delete(`/admin/classes/${cls._id}`);
      await load();
    } catch (e) {
      console.error('Failed to delete class', e);
      setError(e.response?.data?.detail || 'Xóa lớp thất bại');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Lớp học & phân công giảng viên</h1>
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
        <Card className="glass" title={editing ? 'Sửa lớp' : 'Tạo lớp'}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Môn học</label>
              <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {(courses || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Giảng viên</label>
              <select value={form.teacher_id} onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {(teachers || []).map((t) => (
                  <option key={t._id} value={t._id}>{t.full_name} ({t.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Học kỳ</label>
              <input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Phòng học</label>
              <input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Sức chứa</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{'Lịch học (ví dụ: "Thứ 2 08:00-10:00; Thứ 4 08:00-10:00")'}</label>
              <input value={form.scheduleText} onChange={(e) => setForm((p) => ({ ...p, scheduleText: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            <button onClick={submit} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
          </div>
        </Card>
      ) : null}

      {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
      <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-2">
        {(classes || []).map((cls) => {
          const crs = courseById.get(cls.course_id);
          const tch = teacherById.get(cls.teacher_id);
          const title = `${crs?.code || 'Môn học'} - ${crs?.title || cls.course_id}`;
          const schedule = (cls.schedule || []).map((s) => `${s.day} ${s.start}-${s.end}`).join(', ');
          const capacity = `${cls.current_enrollment ?? 0}/${cls.capacity ?? 0}`;
          return (
          <Card key={cls._id} title={title} className="glass">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Giảng viên</div>
                  <div style={{ fontWeight: 600 }}>{tch?.full_name || cls.teacher_id}</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <MapPin size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Địa điểm</div>
                    <div style={{ fontWeight: 600 }}>{cls.room}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Lịch học</div>
                    <div style={{ fontWeight: 600 }}>{schedule || '—'}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Sức chứa: <strong>{capacity}</strong></span>
                <div>
                  <button onClick={() => openEdit(cls)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, marginRight: '0.75rem' }}>Sửa</button>
                  <button onClick={() => remove(cls)} style={{ color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Xóa</button>
                </div>
              </div>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
