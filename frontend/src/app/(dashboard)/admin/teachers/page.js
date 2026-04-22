 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { UserPlus, Search, Mail, Phone, BookOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) return item.msg;
        return '';
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(', ');
  }

  const message = error?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;

  if (typeof error?.message === 'string' && error.message.trim()) return error.message;

  return fallback;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: 'teacher123', department: '' });
  const [formError, setFormError] = useState('');

  const notifyFormError = (message) => {
    popupValidationError(setFormError, message);
  };

  const load = async () => {
    const res = await api.get('/admin/users?role=teacher');
    setTeachers(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load teachers', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách giảng viên');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return (teachers || []).filter((t) => {
      return (
        String(t.full_name || '').toLowerCase().includes(q) ||
        String(t.email || '').toLowerCase().includes(q) ||
        String(t.department || '').toLowerCase().includes(q)
      );
    });
  }, [teachers, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({ full_name: '', email: '', password: 'teacher123', department: '' });
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ full_name: t.full_name || '', email: t.email || '', password: '', department: t.department || '' });
    setFormError('');
    setShowForm(true);
  };

  const submit = async () => {
    setFormError('');
    const name = form.full_name.trim();
    const email = form.email.trim();
    const password = String(form.password || '');
    if (!name) {
      notifyFormError('Vui lòng nhập Họ tên giảng viên.');
      return;
    }
    if (!email) {
      notifyFormError('Vui lòng nhập Email.');
      return;
    }
    if (!isValidEmail(email)) {
      notifyFormError('Email không đúng định dạng.');
      return;
    }
    if (!editing?._id && !hasMinLength(password, 8)) {
      notifyFormError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (editing?._id && password && !hasMinLength(password, 8)) {
      notifyFormError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    try {
      if (editing?._id) {
        const payload = {
          full_name: name || null,
          email: email || null,
          department: form.department || null,
          ...(password ? { password } : {}),
        };
        await api.patch(`/admin/users/${editing._id}`, payload);
      } else {
        const payload = {
          full_name: name,
          email,
          password,
          role: 'teacher',
          department: form.department || null,
        };
        await api.post('/admin/users', payload);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to save teacher', e);
      notifyFormError(getErrorMessage(e, 'Lưu giảng viên thất bại'));
    }
  };

  const remove = async (t) => {
    if (!confirm(`Xóa giảng viên ${t.full_name || t.email}?`)) return;
    try {
      setError('');
      await api.delete(`/admin/users/${t._id}`);
      await load();
    } catch (e) {
      console.error('Failed to delete teacher', e);
      setError(e.response?.data?.detail || 'Xóa giảng viên thất bại');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Quản lý giảng viên</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
        }}
        onClick={openCreate}
        >
          <UserPlus size={18} />
          Thêm giảng viên
        </button>
      </div>

      {showForm ? (
        <Card className="glass" title={editing ? 'Sửa giảng viên' : 'Thêm giảng viên'}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Họ tên</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Khoa/Bộ môn</label>
              <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Email</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{editing ? 'Mật khẩu mới (không bắt buộc)' : 'Mật khẩu'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            <button onClick={submit} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
          </div>
        </Card>
      ) : null}

      <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm giảng viên..."
          style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
        />
      </div>

      {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-3">
        {filtered.map((teacher) => (
          <Card key={teacher._id} className="glass">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'var(--muted)', 
                margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)'
              }}>
                {(teacher.full_name || teacher.email || '?').split(' ').map(n => n[0]).join('').slice(0, 3)}
              </div>
              <h3 style={{ margin: 0 }}>{teacher.full_name || 'N/A'}</h3>
              <p style={{ fontSize: '0.875rem' }}>{teacher.department || '—'}</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--muted-foreground)" />
                <span>{teacher.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="var(--muted-foreground)" />
                <span>Vai trò: {teacher.role}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => openEdit(teacher)} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>
                Sửa
              </button>
              <button onClick={() => remove(teacher)} style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius)', border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', fontWeight: 800, color: '#991b1b' }}>
                Xóa
              </button>
            </div>
          </Card>
        ))}
        {!loading && !error && filtered.length === 0 ? <p>Không có giảng viên nào.</p> : null}
      </div>
    </div>
  );
}
