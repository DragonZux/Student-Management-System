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
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Quản lý Danh mục Học phần</h1>
          <p style={{ fontSize: '1.1rem' }}>Thiết lập cấu trúc môn học, tín chỉ và các điều kiện học phần tiên quyết.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Thêm học phần mới
        </button>
      </div>

      {showForm ? (
        <Card className="glass animate-in" title={editing ? 'Cập nhật nội dung học phần' : 'Khởi tạo học phần mới'}>
          <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mã học phần</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Ví dụ: CS101" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Số tín chỉ (Credits)</label>
              <input type="number" min="1" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tên học phần chi tiết</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ví dụ: Cấu trúc dữ liệu và Giải thuật" style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mã học phần tiên quyết (phân cách bằng dấu phẩy)</label>
              <input value={form.prerequisites} onChange={(e) => setForm((p) => ({ ...p, prerequisites: e.target.value }))} placeholder="Ví dụ: CS100, CS101" style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mô tả tóm tắt nội dung</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Nhập tóm tắt chương trình học..." style={{ width: '100%', minHeight: 120 }} />
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
          </div>
        </Card>
      ) : null}

      <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '2.5rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm học phần theo mã hoặc tên môn học..."
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

      <Card title={`Danh sách Học phần (${filtered.length})`}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--muted)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Đang truy xuất dữ liệu đào tạo...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <InlineMessage variant="error">{error}</InlineMessage>
            <button onClick={load} className="btn-primary" style={{ marginTop: '1.5rem' }}>Tải lại dữ liệu</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 -1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã môn</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên Học phần</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tín chỉ</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Môn tiên quyết</th>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <BookOpen size={40} style={{ opacity: 0.2 }} />
                          <p>Không có dữ liệu học phần nào được tìm thấy.</p>
                       </div>
                    </td>
                  </tr>
                ) : filtered.map((course) => (
                  <tr key={course._id || course.code} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <code style={{ background: 'var(--muted)', padding: '0.35rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {course.code}
                      </code>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--foreground)' }}>{course.title}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.25rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {course.description || 'Chưa có mô tả chi tiết học phần.'}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.875rem', minWidth: '40px', textAlign: 'center' }}>{course.credits} TC</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {(course.prerequisites && course.prerequisites.length > 0) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {course.prerequisites.map((p, i) => (
                            <span key={i} className="badge badge-primary" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: 'none', fontSize: '0.75rem' }}>{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Không có</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                         <button onClick={() => openEdit(course)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none', fontSize: '0.8125rem' }}>Sửa</button>
                         <button onClick={() => remove(course)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none', fontSize: '0.8125rem' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
