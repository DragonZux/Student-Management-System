 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Building2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', faculty: '', description: '' });

  const load = async () => {
    const res = await api.get('/admin/departments');
    setDepartments(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load departments', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách bộ môn');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({ name: '', faculty: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setFormError('');
    setForm({ name: dept.name || '', faculty: dept.faculty || '', description: dept.description || '' });
    setShowForm(true);
  };

  const submit = async () => {
    setFormError('');
    const payload = { name: form.name.trim(), faculty: form.faculty || null, description: form.description || null };
    if (!payload.name) {
      popupValidationError(setFormError, 'Vui lòng nhập Tên bộ môn.');
      return;
    }
    if (payload.name.length < 2) {
      popupValidationError(setFormError, 'Tên bộ môn phải có ít nhất 2 ký tự.');
      return;
    }
    try {
      if (editing?._id) await api.patch(`/admin/departments/${editing._id}`, payload);
      else await api.post('/admin/departments', payload);
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to save department', e);
      setFormError(e.response?.data?.detail || 'Lưu bộ môn thất bại');
    }
  };

  const remove = async (dept) => {
    if (!confirm(`Xóa bộ môn "${dept.name}"?`)) return;
    try {
      setError('');
      await api.delete(`/admin/departments/${dept._id}`);
      await load();
    } catch (e) {
      console.error('Failed to delete department', e);
      setError(e.response?.data?.detail || 'Xóa bộ môn thất bại');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Bộ môn & khoa</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={openCreate}
        >
          Thêm bộ môn
        </button>
      </div>

      {showForm ? (
        <Card className="glass" title={editing ? 'Sửa bộ môn' : 'Thêm bộ môn'}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tên</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Khoa</label>
              <input value={form.faculty} onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mô tả</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
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

      <div className="grid grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.name} className="glass">
            <Building2 size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{dept.name}</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{dept.faculty ? `Khoa ${dept.faculty}` : '—'}</p>
            
            <div style={{ padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Mô tả</span>
                <span style={{ fontWeight: 600 }}>{dept.description || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Ngày tạo</span>
                <span style={{ fontWeight: 600 }}>{dept.created_at ? new Date(dept.created_at).toISOString().slice(0, 10) : '—'}</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => openEdit(dept)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>Sửa</button>
              <button onClick={() => remove(dept)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 800 }}>Xóa</button>
            </div>
          </Card>
        ))}
        {!loading && !error && departments.length === 0 ? <p>Không có bộ môn nào.</p> : null}
      </div>
    </div>
  );
}
