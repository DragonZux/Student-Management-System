 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { BookOpen, Plus, Search, Layers } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isInRange, matchesPattern, popupValidationError } from '@/lib/validation';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', credits: 3, description: '', prerequisites: '' });
  const [formError, setFormError] = useState('');

  const load = async () => {
    const res = await api.get('/admin/courses');
    setCourses(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load courses', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách môn học');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return (courses || []).filter((c) => {
      return (
        String(c.code || '').toLowerCase().includes(q) ||
        String(c.title || '').toLowerCase().includes(q)
      );
    });
  }, [courses, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', title: '', credits: 3, description: '', prerequisites: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setForm({
      code: course.code || '',
      title: course.title || '',
      credits: course.credits ?? 3,
      description: course.description || '',
      prerequisites: (course.prerequisites || []).join(','),
    });
    setFormError('');
    setShowForm(true);
  };

  const submit = async () => {
    setFormError('');
    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      credits: Number(form.credits),
      description: form.description || null,
      prerequisites: form.prerequisites
        ? form.prerequisites.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    const missing = [];
    if (!payload.code) missing.push('Mã môn');
    if (!payload.title) missing.push('Tên môn');
    if (!payload.credits || payload.credits <= 0) missing.push('Số tín chỉ hợp lệ');
    if (missing.length > 0) {
      popupValidationError(setFormError, `Vui lòng nhập: ${missing.join(', ')}.`);
      return;
    }
    if (!matchesPattern(payload.code, /^[A-Za-z0-9_-]{2,20}$/)) {
      popupValidationError(setFormError, 'Mã môn chỉ gồm chữ, số, dấu gạch và dài từ 2 đến 20 ký tự.');
      return;
    }
    if (payload.title.length < 3) {
      popupValidationError(setFormError, 'Tên môn phải có ít nhất 3 ký tự.');
      return;
    }
    if (!isInRange(payload.credits, 1, 10)) {
      popupValidationError(setFormError, 'Số tín chỉ phải trong khoảng 1 đến 10.');
      return;
    }
    try {
      if (editing?._id) {
        await api.patch(`/admin/courses/${editing._id}`, payload);
      } else {
        await api.post('/admin/courses', payload);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to save course', e);
      setFormError(e.response?.data?.detail || 'Lưu môn học thất bại');
    }
  };

  const remove = async (course) => {
    if (!confirm(`Xóa môn học ${course.code}?`)) return;
    try {
      setError('');
      await api.delete(`/admin/courses/${course._id}`);
      await load();
    } catch (e) {
      console.error('Failed to delete course', e);
      setError(e.response?.data?.detail || 'Xóa môn học thất bại');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Môn học & tiên quyết</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
        }}
        onClick={openCreate}
        >
          <Plus size={18} />
          Thêm môn học
        </button>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã / tên..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                }}
              />
            </div>
          </div>

          {showForm ? (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editing ? 'Sửa môn học' : 'Tạo môn học'}</div>
              <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mã môn</label>
                  <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Số tín chỉ</label>
                  <input type="number" min="1" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tên môn</label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Môn tiên quyết (cách nhau bằng dấu phẩy)</label>
                  <input value={form.prerequisites} onChange={(e) => setForm((p) => ({ ...p, prerequisites: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mô tả</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', minHeight: 80 }} />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button onClick={submit} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
              </div>
            </div>
          ) : null}

          {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Code</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Tên môn</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Credits</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Môn tiên quyết</th>
                <th style={{ padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => (
                <tr key={course._id || course.code} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{course.code}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{course.title}</td>
                  <td style={{ padding: '1rem' }}>{course.credits}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', background: 'var(--muted)', borderRadius: '4px', fontSize: '0.75rem' 
                    }}>
                      {(course.prerequisites && course.prerequisites.length > 0) ? course.prerequisites.join(', ') : 'Không có'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => openEdit(course)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, marginRight: '0.75rem' }}>Sửa</button>
                    <button onClick={() => remove(course)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && filtered.length === 0 ? <div style={{ padding: '1rem' }}>Không tìm thấy môn học nào.</div> : null}
        </Card>
      </div>
    </div>
  );
}
