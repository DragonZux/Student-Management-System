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
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Hệ thống Quản lý Sinh viên</h1>
          <p style={{ fontSize: '1.1rem' }}>Quản lý thông tin cá nhân, hồ sơ học tập và phân quyền sinh viên.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <UserPlus size={18} />
          Thêm sinh viên mới
        </button>
      </div>

      {showForm ? (
        <Card className="glass animate-in" title={editing ? 'Cập nhật thông tin sinh viên' : 'Ghi danh sinh viên mới'}>
          <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Họ và tên</label>
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Ví dụ: Nguyễn Văn A" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Địa chỉ Email</label>
              <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="student@university.edu.vn" style={{ width: '100%' }} />
            </div>
            {!editing ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu khởi tạo</label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Tối thiểu 8 ký tự" style={{ width: '100%' }} />
              </div>
            ) : null}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Khoa / Bộ môn trực thuộc</label>
              <select 
                value={form.department} 
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} 
                style={{ width: '100%' }}
              >
                <option value="">-- Lựa chọn Khoa --</option>
                {(realDepartments || []).map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
          </div>
        </Card>
      ) : null}

      <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 3, minWidth: '300px' }}>
            <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên theo tên, email hoặc mã số..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.875rem 1rem 0.875rem 3rem', 
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                fontSize: '0.95rem'
              }} 
            />
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.875rem 1rem 0.875rem 2.75rem', 
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                fontSize: '0.95rem'
              }}
            >
              <option value="all">Tất cả Khoa</option>
              {realDepartments.map(dep => (
                <option key={dep._id} value={dep.name}>{dep.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Đang truy xuất dữ liệu sinh viên...</p>
        </div>
      ) : error ? (
        <Card className="glass" style={{ border: '1px solid #fecaca', background: 'rgba(254, 202, 202, 0.05)' }}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#991b1b' }}>
            <InlineMessage variant="error">{error}</InlineMessage>
            <button onClick={fetchData} className="btn-primary" style={{ marginTop: '1.5rem', background: '#991b1b' }}>Thử lại</button>
          </div>
        </Card>
      ) : (
        <Card title={`Dữ liệu Sinh viên (${filteredStudents.length})`}>
          <div style={{ overflowX: 'auto', margin: '0 -1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã số</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thông tin Sinh viên</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Khoa trực thuộc</th>
                  <th style={{ padding: '1.25rem 1.5rem', color: 'var(--muted-foreground)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</th>
                  <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Search size={40} style={{ opacity: 0.2 }} />
                        <p>Không tìm thấy sinh viên nào phù hợp với yêu cầu.</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedStudents.map((student) => (
                  <tr key={student._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <code style={{ background: 'var(--muted)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {student._id.substring(0, 8).toUpperCase()}
                      </code>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)', marginBottom: '0.25rem' }}>{student.full_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{student.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{student.department || 'Chưa phân khoa'}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                        {student.role}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => openEdit(student)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none' }}>Sửa</button>
                        <button onClick={() => handleDeleteClick(student)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none' }}>Xóa</button>
                      </div>
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
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1.5rem',
              borderTop: '1px solid var(--border)',
              marginTop: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Hiển thị <b>{paginatedStudents.length}</b> trên <b>{filteredStudents.length}</b> sinh viên
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    opacity: currentPage === 1 ? 0.3 : 1,
                    boxShadow: 'none'
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: currentPage === i + 1 ? 'var(--primary)' : 'transparent',
                        color: currentPage === i + 1 ? 'white' : 'var(--foreground)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-primary"
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    boxShadow: 'none'
                  }}
                >
                  <ChevronRight size={20} />
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
        message={`Bạn có chắc chắn muốn xóa sinh viên ${confirmModal.student?.full_name || confirmModal.student?.email}? Mọi dữ liệu liên quan đến sinh viên này sẽ bị gỡ bỏ khỏi hệ thống.`}
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}
