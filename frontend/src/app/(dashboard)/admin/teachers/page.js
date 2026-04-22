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
  const [departments, setDepartments] = useState([]);
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
    const [userRes, deptRes] = await Promise.all([
      api.get('/admin/users?role=teacher'),
      api.get('/admin/departments')
    ]);
    setTeachers(userRes.data || []);
    setDepartments(deptRes.data || []);
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
    setForm({ 
      full_name: '', 
      email: '', 
      password: 'teacher123', 
      department: departments?.[0]?.name || '' 
    });
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
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Quản lý Đội ngũ Giảng viên</h1>
          <p style={{ fontSize: '1.1rem' }}>Hệ thống quản lý thông tin nhân sự, chuyên môn và tài khoản giảng dạy.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <UserPlus size={18} />
          Thêm giảng viên mới
        </button>
      </div>

      {showForm ? (
        <Card className="glass animate-in" title={editing ? 'Cập nhật hồ sơ giảng viên' : 'Đăng ký giảng viên mới'}>
          <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Họ và tên giảng viên</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Ví dụ: TS. Nguyễn Văn A" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Khoa / Bộ môn công tác</label>
              <select 
                value={form.department} 
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} 
                style={{ width: '100%' }}
              >
                <option value="">-- Lựa chọn Khoa --</option>
                {(departments || []).map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Địa chỉ Email công vụ</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="teacher@university.edu.vn" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Tối thiểu 8 ký tự" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Cập nhật hồ sơ' : 'Xác nhận thêm'}</button>
          </div>
        </Card>
      ) : null}

      <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '2.5rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm giảng viên theo tên, email hoặc khoa chuyên môn..."
            style={{ 
              width: '100%', 
              padding: '0.875rem 1rem 0.875rem 3.25rem', 
              borderRadius: '1rem', 
              border: '1px solid var(--border)',
              background: 'var(--background)',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--muted)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Đang truy xuất danh sách giảng viên...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((teacher) => (
            <Card key={teacher._id} className="glass card-hover animate-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '1rem', 
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #4338ca) 100%)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 800, color: 'white',
                  boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
                }}>
                  {(teacher.full_name || teacher.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {teacher.full_name || 'Giảng viên'}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                    {teacher.department || 'Chưa phân khoa'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <Mail size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <BookOpen size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '0.125rem 0.625rem' }}>ID: {teacher._id.substring(0, 8)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => openEdit(teacher)} className="btn-primary" style={{ flex: 1, padding: '0.625rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none' }}>
                  Cập nhật
                </button>
                <button onClick={() => remove(teacher)} className="btn-primary" style={{ flex: 1, padding: '0.625rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none' }}>
                  Xóa
                </button>
              </div>
            </Card>
          ))}
          {!loading && filtered.length === 0 ? (
             <div style={{ gridColumn: '1 / -1' }}>
                <Card className="glass" style={{ textAlign: 'center', padding: '4rem' }}>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Không tìm thấy giảng viên nào phù hợp với yêu cầu tìm kiếm.</p>
                </Card>
             </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
