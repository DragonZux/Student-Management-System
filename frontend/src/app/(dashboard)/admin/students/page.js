"use client";
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { UserPlus, Search, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { hasMinLength, isValidEmail, popupValidationError } from '@/lib/validation';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
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
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/users?role=student');
      setStudents(response.data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Không tải được danh sách sinh viên. Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  const departments = useMemo(() => {
    const deps = new Set(students.map(s => s.department).filter(Boolean));
    return ['all', ...Array.from(deps)];
  }, [students]);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({ full_name: '', email: '', password: '', department: '' });
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
      await fetchStudents();
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
      await fetchStudents();
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Quản lý sinh viên</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', 
          borderRadius: 'var(--radius)', 
          background: 'var(--primary)', 
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}
        onClick={openCreate}
        >
          <UserPlus size={18} />
          Thêm sinh viên
        </button>
      </div>

      {showForm ? (
        <Card className="glass" title={editing ? 'Sửa sinh viên' : 'Thêm sinh viên'}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Họ tên</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Email</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            {!editing ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mật khẩu</label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
            ) : null}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Khoa/Bộ môn</label>
              <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            <button onClick={submit} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>{editing ? 'Cập nhật' : 'Tạo mới'}</button>
          </div>
        </Card>
      ) : null}

      <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên (Tên, Email, ID)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)',
                background: 'var(--background)'
              }} 
            />
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)',
                background: 'var(--background)',
                appearance: 'none'
              }}
            >
              <option value="all">Tất cả Khoa/Bộ môn</option>
              {departments.filter(d => d !== 'all').map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#991b1b' }}>
          {error}
        </div>
      ) : (
        <>
          <Card title={`Danh sách sinh viên (${filteredStudents.length})`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Mã SV</th>
                    <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Họ tên</th>
                    <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Khoa</th>
                    <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Vai trò</th>
                    <th style={{ padding: '1rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                        Không tìm thấy sinh viên nào phù hợp.
                      </td>
                    </tr>
                  ) : paginatedStudents.map((student) => (
                    <tr key={student._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{student._id.substring(0, 8)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{student.full_name || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{student.email}</td>
                      <td style={{ padding: '1rem' }}>{student.department || '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '99px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          background: '#dcfce7',
                          color: '#166534'
                        }}>
                          {student.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => openEdit(student)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, marginRight: '0.75rem' }}>Sửa</button>
                        <button onClick={() => handleDeleteClick(student)} style={{ color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '1.5rem',
                borderTop: '1px solid var(--border)' 
              }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </Card>
        </>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, student: null })}
        onConfirm={remove}
        title="Xác nhận xóa sinh viên"
        message={`Bạn có chắc chắn muốn xóa sinh viên ${confirmModal.student?.full_name || confirmModal.student?.email}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sinh viên"
      />
    </div>
  );
}
