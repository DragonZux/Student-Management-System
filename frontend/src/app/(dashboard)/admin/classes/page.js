 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [clsRes, courseRes, teacherRes, roomRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/courses'),
          api.get('/admin/users?role=teacher'),
          api.get('/admin/classrooms'),
        ]);
        if (!cancelled) {
          setClasses(clsRes.data || []);
          setCourses(courseRes.data || []);
          setTeachers(teacherRes.data || []);
          setClassrooms(roomRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load data', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được dữ liệu hệ thống');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Lớp học & Phân công Giảng dạy</h1>
          <p style={{ fontSize: '1.1rem' }}>Quản lý kế hoạch giảng dạy, sắp xếp phòng học và điều phối giảng viên.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Thiết lập lớp mới
        </button>
      </div>

      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title={editing ? 'Điều chỉnh thông tin lớp học' : 'Thiết lập lớp học mới'}
        maxWidth="800px"
      >
        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Học phần / Môn học</label>
            <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} style={{ width: '100%' }}>
              <option value="">-- Lựa chọn môn học --</option>
              {(courses || []).map((c) => (
                <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Giảng viên phụ trách</label>
            <select value={form.teacher_id} onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))} style={{ width: '100%' }}>
              <option value="">-- Lựa chọn giảng viên --</option>
              {(teachers || []).map((t) => (
                <option key={t._id} value={t._id}>{t.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Học kỳ (Semester)</label>
            <input value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Ví dụ: 2026-Spring" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phòng học dự kiến</label>
            <select 
              value={form.room} 
              onChange={(e) => {
                const rCode = e.target.value;
                const rObj = classrooms.find(r => r.code === rCode);
                setForm(p => ({ ...p, room: rCode, capacity: rObj ? rObj.capacity : p.capacity }));
              }} 
              style={{ width: '100%' }}
            >
              <option value="">-- Lựa chọn phòng học --</option>
              {(classrooms || []).map((rm) => (
                <option key={rm._id} value={rm.code}>{rm.code} (Tòa: {rm.building} - Max: {rm.capacity})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sức chứa tối đa (Capacity)</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} style={{ width: '100%' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lịch học chi tiết (Ví dụ: Monday 08:00-10:00; Wednesday 13:00-15:00)</label>
            <input value={form.scheduleText} onChange={(e) => setForm((p) => ({ ...p, scheduleText: e.target.value }))} placeholder="Nhập lịch học theo định dạng 'Thứ Thời Gian'" style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Hủy bỏ</button>
          <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận tạo'}</button>
        </div>
      </Modal>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--muted)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Đang đồng bộ dữ liệu lớp học...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {(classes || []).map((cls) => {
            const crs = courseById.get(cls.course_id);
            const tch = teacherById.get(cls.teacher_id);
            const enrollmentPercentage = Math.min(100, Math.round((cls.current_enrollment / cls.capacity) * 100)) || 0;
            
            return (
              <Card key={cls._id} title={`${crs?.code || 'CRS'}`} className="glass card-hover animate-in" footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                   <button onClick={() => openEdit(cls)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none', fontSize: '0.875rem' }}>Sửa</button>
                   <button onClick={() => remove(cls)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none', fontSize: '0.875rem' }}>Xóa</button>
                </div>
              }>
                <div style={{ marginBottom: '1.25rem' }}>
                   <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, lineHeight: '1.2' }}>{crs?.title || 'Môn học mới'}</h3>
                   <span className="badge badge-primary">{cls.semester}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <User size={16} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{tch?.full_name || 'Chưa chỉ định giảng viên'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                      <MapPin size={16} />
                    </div>
                    <span>Phòng học: <strong style={{ color: 'var(--foreground)' }}>{cls.room || 'TBA'}</strong></span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.9375rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginTop: '2px' }}>
                      <Clock size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                       {cls.schedule?.length ? cls.schedule.map((s, idx) => (
                         <div key={idx} style={{ marginBottom: '0.25rem' }}>{s.day}: <strong>{s.start}-{s.end}</strong></div>
                       )) : <span style={{ color: 'var(--muted-foreground)' }}>Chưa có lịch học</span>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>TỶ LỆ GHI DANH</span>
                      <span style={{ color: 'var(--primary)' }}>{cls.current_enrollment} / {cls.capacity}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${enrollmentPercentage}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
