"use client";
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';
import { UserPlus, Search, Loader2, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';
import styles from './Students.module.css';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [realDepartments, setRealDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', department: '' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [studentRes, deptRes] = await Promise.all([
        api.get('/admin/users?role=student'),
        api.get('/admin/departments')
      ]);
      setStudents(studentRes.data || []);
      setRealDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Không tải được danh sách dữ liệu. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

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
      await fetchData();
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
      await fetchData();
    } catch (err) {
      console.error('Failed to delete student:', err);
      setError(err.response?.data?.detail || 'Xóa sinh viên thất bại.');
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students || [];
    
    // Keyword search
    const q = keyword.trim().toLowerCase();
    if (q) {
      result = result.filter((student) => {
        return (
          String(student.full_name || '').toLowerCase().includes(q) ||
          String(student.email || '').toLowerCase().includes(q) ||
          String(student._id || '').toLowerCase().includes(q)
        );
      });
    }

    // Department filter
    if (departmentFilter !== 'all') {
      result = result.filter(s => s.department === departmentFilter);
    }

    return result;
  }, [keyword, students, departmentFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, departmentFilter]);

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
            onChange={(e) => setKeyword(e.target.value)}
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

      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p className={styles.loadingText}>Đang truy xuất dữ liệu sinh viên...</p>
        </div>
      ) : error ? (
        <Card className="glass" style={{ border: '1px solid #fecaca', background: 'rgba(244, 63, 94, 0.02)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>
            <button onClick={fetchData} className="btn-primary" style={{ margin: '0 auto' }}>Thử lại</button>
          </div>
        </Card>
      ) : (
        <Card title={`Danh sách Sinh viên (${filteredStudents.length})`}>
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
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.emptyState}>
                        <Search size={48} style={{ opacity: 0.2 }} />
                        <p>Không tìm thấy sinh viên nào phù hợp với yêu cầu tìm kiếm của bạn.</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStudents.map((student, index) => (
                  <tr 
                    key={student._id} 
                    className={`${styles.tableRow} table-row-hover`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <td>
                      <code className={styles.studentId}>
                        {student._id.substring(0, 8).toUpperCase()}
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

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Hiển thị <b>{paginatedStudents.length}</b> / <b>{filteredStudents.length}</b> sinh viên
              </div>
              <div className={styles.paginationControls}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  <ChevronLeft size={18} />
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageBtnActive : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
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
