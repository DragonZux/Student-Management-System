import { MapPin, Users, Monitor, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { isInRange, matchesPattern, popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/classrooms.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function ClassroomsPage() {
  const {
    data: rooms,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh
  } = usePaginatedData('/admin/classrooms', { cacheKey: 'classrooms' });

  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', building: '', capacity: 0, facilities: '' });

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({ code: '', building: '', capacity: 0, facilities: '' });
    setShowForm(true);
  };
  const openEdit = (room) => {
    setEditing(room);
    setFormError('');
    setForm({
      code: room.code || '',
      building: room.building || '',
      capacity: room.capacity ?? 0,
      facilities: (room.facilities || []).join(','),
    });
    setShowForm(true);
  };
  const submit = async () => {
    setFormError('');
    const payload = {
      code: form.code.trim(),
      building: form.building || null,
      capacity: Number(form.capacity || 0),
      facilities: form.facilities ? form.facilities.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    if (!payload.code) {
      popupValidationError(setFormError, 'Vui lòng nhập Mã phòng.');
      return;
    }
    try {
      if (editing?._id) await api.patch(`/admin/classrooms/${editing._id}`, payload);
      else await api.post('/admin/classrooms', payload);
      setShowForm(false);
      refresh();
    } catch (e) {
      setFormError(e.response?.data?.detail || 'Lưu phòng học thất bại');
    }
  };
  const remove = async (room) => {
    if (!confirm(`Xóa phòng học ${room.code}?`)) return;
    try {
      await api.delete(`/admin/classrooms/${room._id}`);
      refresh();
    } catch (e) {
      alert(e.response?.data?.detail || 'Xóa phòng học thất bại');
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Cơ sở vật chất & Phòng học</h1>
          <p>Quản lý hạ tầng giảng dạy, sức chứa phòng và trang thiết bị học tập.</p>
        </div>
        <button className="btn-primary slide-right stagger-2" onClick={openCreate}>
          <Plus size={18} />
          Thêm phòng học mới
        </button>
      </header>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Cập nhật thông tin phòng học' : 'Khai báo phòng học mới'}
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{formError}</InlineMessage>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Mã phòng học</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Ví dụ: A1-202" />
            </div>
            <div className={styles.formField}>
              <label>Sức chứa (Capacity)</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label>Tòa nhà / Khu vực</label>
              <input value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} placeholder="Ví dụ: Tòa nhà A1" />
            </div>
            <div className={styles.formField}>
              <label>Trang thiết bị (cách nhau bằng dấu phẩy)</label>
              <input value={form.facilities} onChange={(e) => setForm((p) => ({ ...p, facilities: e.target.value }))} placeholder="Ví dụ: Máy chiếu, Điều hòa, Bảng điện tử" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
          </div>
        </div>
      </Modal>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}

      {loading ? (
        <Card>
          <div style={{ padding: '1rem' }}>
            <TableSkeleton rows={8} columns={4} />
          </div>
        </Card>
      ) : (
        <div className="slide-right stagger-3">
          <div className={styles.roomGrid}>
            {rooms.map((room) => (
              <div key={room._id || room.code} className={styles.roomCard}>
                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.buildingName}>{room.building || 'KHU VỰC CHƯA XÁC ĐỊNH'}</span>
                    <h3 className={styles.roomCode}>{room.code}</h3>
                  </div>
                  <div className={styles.capacityBadge}>
                    <Users size={16} /> 
                    <span>{room.capacity}</span>
                  </div>
                </div>

                <div className={styles.facilityList}>
                  {(room.facilities || []).length > 0 ? (room.facilities || []).map(item => (
                    <span key={item} className={styles.facilityBadge}>
                      {item}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Không có thiết bị đặc biệt</span>
                  )}
                </div>

                <div className={styles.actions}>
                  <button onClick={() => openEdit(room)} className="action-icon-btn" style={{ flex: 1, background: 'rgba(var(--primary-rgb), 0.08)', color: 'var(--primary)', border: 'none', padding: '0.65rem', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>Sửa</button>
                  <button onClick={() => remove(room)} className="action-icon-btn" style={{ flex: 1, background: 'rgba(244, 63, 94, 0.08)', color: '#f43f5e', border: 'none', padding: '0.65rem', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>

          {!loading && rooms.length === 0 && (
            <div className="error-state glass" style={{ textAlign: 'center', padding: '6rem', borderRadius: '2rem', marginTop: '2rem' }}>
              <MapPin size={64} style={{ opacity: 0.1, color: 'var(--primary)', marginBottom: '1.5rem' }} />
              <p style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Không tìm thấy phòng học nào trong hệ thống.</p>
            </div>
          )}

          <div style={{ marginTop: '3.5rem' }}>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              total={total}
              currentCount={rooms.length}
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
