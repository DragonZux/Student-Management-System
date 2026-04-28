"use client";
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import { UserPlus, Search, Loader2, Filter, User } from 'lucide-react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/students.module.css';
import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function StudentsPage() {
  const {
    data: students,
    total,
    loading: studentsLoading,
    error: studentsError,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    query,
    setQuery,
    refresh
  } = usePaginatedData('/admin/users?role=student', { cacheKey: 'admin_students' });

  const [realDepartments, setRealDepartments] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [keyword, setKeyword] = useState(''); // Local state for input
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', department: '' });
  
  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null });

  useEffect(() => {
    let cancelled = false;
    const fetchDepts = async () => {
      // Simple cache for departments (valid for 1 day)
      const cached = localStorage.getItem('cache_departments');
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setRealDepartments(data);
          return;
        }
      }

      try {
        setDeptsLoading(true);
        const res = await api.get('/admin/departments');
        if (!cancelled) {
          const data = res.data || [];
          setRealDepartments(data);
          localStorage.setItem('cache_departments', JSON.stringify({
            timestamp: Date.now(),
            data
          }));
        }
      } catch (err) {
        console.error('Failed to fetch depts:', err);
      } finally {
        if (!cancelled) setDeptsLoading(false);
      }
    };
    fetchDepts();
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({ 
      full_name: '', 
      email: '', 
      password: '', 
      department: realDepartments?.[0]?.name || '' 
    });
    setShowForm(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setFormError('');
    setForm({
      full_name: student.full_name || '',
      email: student.email || '',
      password: '',
      department: student.department || '',
    });
    setShowForm(true);
  };

  const submit = async () => {
    setFormError('');
    const fullName = String(form.full_name || '').trim();
    const email = String(form.email || '').trim();
    
    if (!hasMinLength(fullName, 2)) {
      popupValidationError(setFormError, 'Họ tên phải có ít nhất 2 ký tự.');
      return;
    }
    if (!isValidEmail(email)) {
      popupValidationError(setFormError, 'Email không đúng định dạng.');
      return;
    }
    if (!editing && !hasMinLength(form.password, 8)) {
      popupValidationError(setFormError, 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    
    try {
      if (editing?._id) {
        await api.patch(`/admin/users/${editing._id}`, {
          full_name: fullName,
          email,
          department: String(form.department || '').trim() || null,
        });
      } else {
        await api.post('/admin/users', {
          full_name: fullName,
          email,
          password: form.password,
          department: String(form.department || '').trim() || null,
          role: 'student',
        });
      }
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Failed to save student:', err);
      setFormError(err.response?.data?.detail || 'Lưu thông tin sinh viên thất bại.');
    }
  };

  const handleDeleteClick = (student) => {
    setConfirmModal({ isOpen: true, student });
  };

  const remove = async () => {
    const student = confirmModal.student;
    if (!student) return;
    try {
      await api.delete(`/admin/users/${student._id}`);
      setConfirmModal({ isOpen: false, student: null });
      refresh();
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const onSearchChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    setQuery(val);
  };

  // Local filtering for department (since API only filters by role/search)
  // Or we could update API to filter by department too. 
  // For now, let's keep it simple.
  const displayStudents = useMemo(() => {
    if (departmentFilter === 'all') return students;
    return students.filter(s => s.department === departmentFilter);
  }, [students, departmentFilter]);

  useEffect(() => {
    setKeyword(query || '');
  }, [query]);

  return (
    <div className={`${styles.container} animate-in`}>
      <div className={`${styles.header} slide-right stagger-1`}>
        <div className={styles.headerInfo}>
          <h1>Quản lý Sinh viên</h1>
          <p>Quản lý thông tin cá nhân, hồ sơ học tập và phân quyền sinh viên.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <UserPlus size={18} />
          Thêm sinh viên
        </button>
      </div>

      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title={editing ? 'Cập nhật thông tin' : 'Ghi danh sinh viên mới'}
        maxWidth="800px"
      >
        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label>Họ và tên</label>
            <input 
              value={form.full_name} 
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} 
              placeholder="Ví dụ: Nguyễn Văn A" 
            />
          </div>
          <div className={styles.formField}>
            <label>Địa chỉ Email</label>
            <input 
              value={form.email} 
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} 
              placeholder="student@university.edu.vn" 
            />
          </div>
          {!editing && (
            <div className={styles.formField}>
              <label>Mật khẩu khởi tạo</label>
              <input 
                type="password" 
                value={form.password} 
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} 
                placeholder="Tối thiểu 8 ký tự" 
              />
            </div>
          )}
          <div className={styles.formField}>
            <label>Khoa / Bộ môn</label>
            <select 
              value={form.department} 
              onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} 
            >
              <option value="">-- Lựa chọn Khoa --</option>
              {(realDepartments || []).map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.formActions}>
          <button 
            onClick={() => setShowForm(false)} 
            className="btn-primary" 
            style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'none' }}
          >
            Hủy bỏ
          </button>
          <button onClick={submit} className="btn-primary">
            {editing ? 'Lưu thay đổi' : 'Xác nhận tạo'}
          </button>
        </div>
      </Modal>

      <div className={`${styles.filterBar} slide-right stagger-2`}>
        <div className={styles.searchWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            className={styles.searchInput}
            type="text" 
            placeholder="Tìm kiếm theo tên, email hoặc mã số..."
            value={keyword}
            onChange={onSearchChange}
          />
        </div>
        <div className={styles.filterWrapper}>
          <Filter size={18} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Tất cả Khoa</option>
            {realDepartments.map(dep => (
              <option key={dep._id} value={dep.name}>{dep.name}</option>
            ))}
          </select>
        </div>
      </div>

      {studentsLoading ? (
        <Card title="Đang tải danh sách sinh viên...">
          <TableSkeleton rows={10} columns={5} />
        </Card>
      ) : studentsError ? (
        <Card className="glass" style={{ border: '1px solid #fecaca', background: 'rgba(244, 63, 94, 0.02)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{studentsError}</InlineMessage>
            <button onClick={refresh} className="btn-primary" style={{ margin: '0 auto' }}>Thử lại</button>
          </div>
        </Card>
      ) : (
        <Card title={`Danh sách Sinh viên (${total})`}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Mã số</th>
                  <th>Sinh viên</th>
                  <th>Khoa trực thuộc</th>
                  <th>Vai trò</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.emptyState}>
                        <Search size={48} style={{ opacity: 0.2 }} />
                        <p>Không tìm thấy sinh viên nào phù hợp với yêu cầu tìm kiếm của bạn.</p>
                      </div>
                    </td>
                  </tr>
                ) : displayStudents.map((student, index) => (
                  <tr 
                    key={student._id} 
                    className={`${styles.tableRow} table-row-hover`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <td>
                      <code className={styles.studentId}>
                        {(student._id || '').substring(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                        }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className={styles.studentName}>{student.full_name || 'N/A'}</div>
                          <div className={styles.studentEmail}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{student.department || 'Chưa phân khoa'}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                        {student.role}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => openEdit(student)} className={`${styles.actionBtn} ${styles.editBtn}`}>Sửa</button>
                        <button onClick={() => handleDeleteClick(student)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            total={total}
            currentCount={students.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            showPageSize
            className={styles.pagination}
          />
        </Card>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, student: null })}
        onConfirm={remove}
        title="Xác nhận xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa sinh viên ${confirmModal.student?.full_name || confirmModal.student?.email}? Mọi dữ liệu liên quan sẽ bị gỡ bỏ vĩnh viễn.`}
        confirmText="Xác nhận xóa"
      />

    </div>
  );
}
