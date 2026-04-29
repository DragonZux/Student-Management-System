"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/courses.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function CoursesPage() {
  const {
    data: courses,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    query,
    setQuery,
    pageSize,
    setPageSize,
    refresh
  } = usePaginatedData('/admin/courses', { cacheKey: 'courses' });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', credits: 3, description: '', prerequisites: '' });
  const [formError, setFormError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, course: null });

  const normalizedCourses = useMemo(
    () =>
      (courses || []).map((course, index) => ({
        ...course,
        _rowKey: course._id || course.code || `${course.title || 'course'}-${index}`,
      })),
    [courses]
  );

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

    if (!payload.code || !payload.title || !payload.credits) {
      popupValidationError(setFormError, 'Vui lòng nhập đầy đủ Mã, Tên và Tín chỉ.');
      return;
    }
    
    try {
      if (editing?._id) {
        await api.patch(`/admin/courses/${editing._id}`, payload);
      } else {
        await api.post('/admin/courses', payload);
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Lưu môn học thất bại');
    }
  };

  const handleDeleteClick = (course) => {
    setConfirmModal({ isOpen: true, course });
  };

  const remove = async () => {
    const course = confirmModal.course;
    if (!course) return;
    try {
      await api.delete(`/admin/courses/${course._id}`);
      setConfirmModal({ isOpen: false, course: null });
      refresh();
    } catch (e) {
      alert(e.response?.data?.detail || 'Xóa môn học thất bại');
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Danh mục Học phần</h1>
          <p>Thiết lập cấu trúc chương trình đào tạo và học phần tiên quyết.</p>
        </div>
        <button className="btn-primary slide-right stagger-2" onClick={openCreate}>
          <Plus size={18} />
          Thêm học phần mới
        </button>
      </header>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Cập nhật Học phần' : 'Khởi tạo Học phần'}
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{formError}</InlineMessage>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Mã học phần</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Ví dụ: CS101" />
            </div>
            <div className={styles.formField}>
              <label>Số tín chỉ</label>
              <input type="number" min="1" max="10" value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))} />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label>Tên học phần chi tiết</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ví dụ: Cấu trúc dữ liệu và Giải thuật" />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label>Học phần tiên quyết (phân cách bằng dấu phẩy)</label>
              <input value={form.prerequisites} onChange={(e) => setForm((p) => ({ ...p, prerequisites: e.target.value }))} placeholder="Ví dụ: CS100, MATH101" />
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label>Mô tả tóm tắt nội dung</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Nhập tóm tắt chương trình học..." style={{ minHeight: 120 }} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận tạo'}</button>
          </div>
        </div>
      </Modal>

      <div className={`${styles.searchBar} slide-right stagger-2`}>
        <div className={styles.searchWrapper}>
          <Search size={22} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm học phần theo mã hoặc tên môn học..."
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <div style={{ padding: '1rem' }}>
            <TableSkeleton rows={8} columns={5} />
          </div>
        </Card>
      ) : error ? (
        <div className="error-state glass" style={{ textAlign: 'center', padding: '4rem', borderRadius: '2rem' }}>
          <InlineMessage variant="error">{error}</InlineMessage>
          <button onClick={refresh} className="btn-primary" style={{ marginTop: '2rem', margin: '2rem auto 0' }}>Tải lại dữ liệu</button>
        </div>
      ) : (
        <Card noPadding className="slide-right stagger-3">
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên Học phần</th>
                  <th>Tín chỉ</th>
                  <th>Tiên quyết</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {normalizedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.emptyState}>
                        <BookOpen size={64} style={{ opacity: 0.2, color: 'var(--primary)' }} />
                        <p>Không tìm thấy học phần nào phù hợp.</p>
                      </div>
                    </td>
                  </tr>
                ) : normalizedCourses.map((course, index) => (
                  <tr key={course._rowKey} className={styles.tableRow}>
                    <td>
                      <code className={styles.courseCode}>{course.code}</code>
                    </td>
                    <td>
                      <div className={styles.courseTitle}>{course.title}</div>
                      <div className={styles.courseDesc}>{course.description || 'Chưa có mô tả.'}</div>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem' }}>{course.credits} TC</span>
                    </td>
                    <td>
                      {(course.prerequisites && course.prerequisites.length > 0) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {course.prerequisites.map((p, i) => (
                            <span key={i} className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}>{p}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => openEdit(course)} className="action-icon-btn" style={{ background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Sửa</button>
                        <button onClick={() => handleDeleteClick(course)} className="action-icon-btn" style={{ background: 'rgba(244, 63, 94, 0.08)', color: '#f43f5e', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '1.5rem 2rem' }}>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              total={total}
              currentCount={normalizedCourses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              showPageSize
            />
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, course: null })}
        onConfirm={remove}
        title="Xác nhận xóa học phần"
        message={`Bạn có chắc chắn muốn xóa môn học ${confirmModal.course?.code}? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
}
