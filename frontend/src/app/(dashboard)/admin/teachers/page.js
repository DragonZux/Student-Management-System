"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import { UserPlus, Search, Mail, Phone, BookOpen, Trash2, Edit3, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/teachers.module.css';
import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

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
  const {
    data: teachers,
    total,
    loading: teachersLoading,
    error: teachersError,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    query: searchQuery,
    setQuery: setSearchQuery,
    refresh
  } = usePaginatedData('/admin/users?role=teacher', { cacheKey: 'admin_teachers' });

  const [departments, setDepartments] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [query, setLocalQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: 'teacher123', department: '' });
  const [formError, setFormError] = useState('');

  const notifyFormError = (message) => {
    popupValidationError(setFormError, message);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchDepts = async () => {
      const cached = localStorage.getItem('cache_departments');
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setDepartments(data);
          return;
        }
      }
      try {
        setDeptsLoading(true);
        const res = await api.get('/admin/departments');
        if (!cancelled) {
          const data = res.data || [];
          setDepartments(data);
          localStorage.setItem('cache_departments', JSON.stringify({
            timestamp: Date.now(),
            data
          }));
        }
      } catch (e) {
        console.error('Failed to load depts', e);
      } finally {
        if (!cancelled) setDeptsLoading(false);
      }
    };
    fetchDepts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setLocalQuery(searchQuery || '');
  }, [searchQuery]);

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
    if (!name) return notifyFormError('Vui lòng nhập Họ tên giảng viên.');
    if (!email) return notifyFormError('Vui lòng nhập Email.');
    if (!isValidEmail(email)) return notifyFormError('Email không đúng định dạng.');
    if (!editing?._id && !hasMinLength(password, 8)) return notifyFormError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (editing?._id && password && !hasMinLength(password, 8)) return notifyFormError('Mật khẩu mới phải có ít nhất 8 ký tự.');

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
          full_name: name, email, password, role: 'teacher',
          department: form.department || null,
        };
        await api.post('/admin/users', payload);
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      console.error('Failed to save teacher', e);
      notifyFormError(getErrorMessage(e, 'Lưu giảng viên thất bại'));
    }
  };

  const remove = async (t) => {
    if (!confirm(`Xóa giảng viên ${t.full_name || t.email}?`)) return;
    try {
      await api.delete(`/admin/users/${t._id}`);
      refresh();
    } catch (e) {
      console.error('Failed to delete teacher', e);
    }
  };

  const onSearchChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    setSearchQuery(val);
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className={`${styles.headerInfo} slide-right stagger-1`}>
          <h1>Đội ngũ Giảng viên</h1>
          <p>Hệ thống quản lý thông tin nhân sự và chuyên môn giảng dạy.</p>
        </div>
        <button className="btn-primary slide-right stagger-2" onClick={openCreate}>
          <UserPlus size={18} />
          Thêm giảng viên
        </button>
      </header>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Cập nhật hồ sơ giảng viên' : 'Đăng ký giảng viên mới'}
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{formError}</InlineMessage>
          <div className={styles.formGrid}>
            <div className="form-group">
              <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Họ và tên giảng viên</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Ví dụ: TS. Nguyễn Văn A" />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Khoa / Bộ môn công tác</label>
              <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
                <option value="">-- Lựa chọn Khoa --</option>
                {(departments || []).map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Địa chỉ Email công vụ</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="teacher@university.edu.vn" />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>{editing ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Tối thiểu 8 ký tự" />
            </div>
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
          </div>
        </div>
      </Modal>

      <div className={`${styles.searchSection} slide-right stagger-2`}>
        <div className={styles.searchWrapper}>
          <Search size={22} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={onSearchChange}
            placeholder="Tìm kiếm theo tên, email hoặc khoa chuyên môn..."
          />
        </div>
      </div>

      {teachersError && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{teachersError}</InlineMessage>}
      
      {teachersLoading ? (
        <Card>
          <div style={{ padding: '1rem' }}>
            <TableSkeleton rows={6} columns={4} />
          </div>
        </Card>
      ) : (
        <div className="slide-right stagger-3">
          <div className={styles.teacherGrid}>
            {teachers.map((teacher, index) => (
              <div key={teacher._id} className={styles.teacherCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {(teacher.full_name || teacher.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.teacherInfo}>
                    <h3 title={teacher.full_name}>{teacher.full_name || 'Giảng viên'}</h3>
                    <div className={styles.department}>{teacher.department || 'Chưa phân khoa'}</div>
                  </div>
                </div>
                
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <Mail size={18} className={styles.detailIcon} />
                    <span title={teacher.email}>{teacher.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <BookOpen size={18} className={styles.detailIcon} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>ID: {teacher._id.substring(0, 8).toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button onClick={() => openEdit(teacher)} className={styles.editBtn}>
                    <Edit3 size={18} /> Sửa
                  </button>
                  <button onClick={() => remove(teacher)} className={styles.deleteBtn}>
                    <Trash2 size={18} /> Xóa
                  </button>
                </div>
              </div>
            ))}
            {teachers.length === 0 && (
              <div className={styles.emptyState}>
                <Search size={64} style={{ opacity: 0.1, marginBottom: '1.5rem', color: 'var(--primary)' }} />
                <p>Không tìm thấy giảng viên nào phù hợp.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem' }}>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              total={total}
              currentCount={teachers.length}
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
