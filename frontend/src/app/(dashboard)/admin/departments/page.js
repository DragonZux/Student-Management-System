"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Building2, Plus, Loader2, ArrowRight, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/departments.module.css';
import useClientPagination from '@/hooks/useClientPagination';
import PaginationControls from '@/components/ui/PaginationControls';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', faculty: '', description: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, dept: null });

  const {
    data: pagedDepartments,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(departments, { initialPageSize: 8 });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/admin/departments');
        if (!cancelled) {
          setDepartments(res.data || []);
        }
      } catch (e) {
        console.error('Failed to load departments', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách bộ môn');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
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

  const handleDeleteClick = (dept) => {
    setConfirmModal({ isOpen: true, dept });
  };

  const remove = async () => {
    const dept = confirmModal.dept;
    if (!dept) return;
    try {
      await api.delete(`/admin/departments/${dept._id}`);
      setConfirmModal({ isOpen: false, dept: null });
      await load();
    } catch (e) {
      console.error('Failed to delete department', e);
      setError(e.response?.data?.detail || 'Xóa bộ môn thất bại');
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div>
          <h1>Cơ cấu Tổ chức</h1>
          <p>Quản lý hệ thống Khoa, Bộ môn và các đơn vị chuyên môn trong nhà trường.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Thêm bộ môn mới
        </button>
      </header>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Cập nhật Bộ môn' : 'Thêm Bộ môn mới'}
        maxWidth="600px"
      >
        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
        <div className={styles.formContent}>
          <div className={styles.formField}>
            <label>Tên Bộ môn / Khoa</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ví dụ: Khoa Công nghệ Thông tin" />
          </div>
          <div className={styles.formField}>
            <label>Trực thuộc Khoa (Tùy chọn)</label>
            <input value={form.faculty} onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))} placeholder="Ví dụ: Công nghệ" />
          </div>
          <div className={styles.formField}>
            <label>Mô tả nhiệm vụ / Chuyên môn</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Nhập tóm tắt chức năng và nhiệm vụ..." style={{ minHeight: '120px' }} />
          </div>
        </div>
        <div className={styles.formActions}>
          <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: 'none' }}>Hủy bỏ</button>
          <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
        </div>
      </Modal>

      <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải danh sách đơn vị...</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {pagedDepartments.map((dept, index) => (
              <Card 
                key={dept._id} 
                className={`${styles.deptCard} glass`} 
                style={{ animationDelay: `${index * 0.05}s` }}
                footer={
                <div className={styles.cardFooter}>
                  <button onClick={() => openEdit(dept)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none', fontSize: '0.875rem' }}>Sửa</button>
                  <button onClick={() => handleDeleteClick(dept)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none', fontSize: '0.875rem' }}>Xóa</button>
                </div>
              }>
                <div className={styles.deptHeader}>
                  <div className={styles.iconWrapper}>
                    <Building2 size={26} />
                  </div>
                  <div>
                    <h3 className={styles.deptName}>{dept.name}</h3>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                      {dept.faculty ? `KHOA ${dept.faculty.toUpperCase()}` : 'ĐƠN VỊ ĐỘC LẬP'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.deptMeta}>
                  <div className={styles.description}>
                    {dept.description || 'Chưa có thông tin mô tả chi tiết cho đơn vị này.'}
                  </div>
                  <div className={styles.dateInfo}>
                    <span>Thành lập</span>
                    <span>{dept.created_at ? new Date(dept.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                  </div>
                </div>
              </Card>
            ))}
            {departments.length === 0 && (
               <div className={styles.emptyState}>
                 <Building2 size={64} style={{ opacity: 0.1 }} />
                 <p>Hệ thống chưa ghi nhận đơn vị đào tạo nào.</p>
               </div>
            )}
          </div>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            total={total}
            currentCount={pagedDepartments.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            showPageSize
          />
        </>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, dept: null })}
        onConfirm={remove}
        title="Xóa bộ môn / khoa"
        message={`Bạn có chắc chắn muốn xóa "${confirmModal.dept?.name}"? Các tài khoản trực thuộc đơn vị này sẽ bị ảnh hưởng.`}
      />
    </div>
  );
}
