 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import { MapPin, Users, Monitor, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { isInRange, matchesPattern, popupValidationError } from '@/lib/validation';

export default function ClassroomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', building: '', capacity: 0, facilities: '' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/admin/classrooms');
        if (!cancelled) {
          setRooms(res.data || []);
        }
      } catch (e) {
        console.error('Failed to load classrooms', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách phòng học');
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
    if (!matchesPattern(payload.code, /^[A-Za-z0-9_-]{2,20}$/)) {
      popupValidationError(setFormError, 'Mã phòng chỉ gồm chữ, số, dấu gạch và dài từ 2 đến 20 ký tự.');
      return;
    }
    if (payload.capacity < 0) {
      popupValidationError(setFormError, 'Sức chứa không được nhỏ hơn 0.');
      return;
    }
    if (!isInRange(payload.capacity, 0, 1000)) {
      popupValidationError(setFormError, 'Sức chứa phải trong khoảng 0 đến 1000.');
      return;
    }
    try {
      if (editing?._id) await api.patch(`/admin/classrooms/${editing._id}`, payload);
      else await api.post('/admin/classrooms', payload);
      setShowForm(false);
      await load();
    } catch (e) {
      console.error('Failed to save classroom', e);
      setFormError(e.response?.data?.detail || 'Lưu phòng học thất bại');
    }
  };
  const remove = async (room) => {
    if (!confirm(`Xóa phòng học ${room.code}?`)) return;
    try {
      setError('');
      await api.delete(`/admin/classrooms/${room._id}`);
      await load();
    } catch (e) {
      console.error('Failed to delete classroom', e);
      setError(e.response?.data?.detail || 'Xóa phòng học thất bại');
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Cơ sở vật chất & Phòng học</h1>
          <p style={{ fontSize: '1.1rem' }}>Quản lý hạ tầng giảng dạy, sức chứa phòng và trang thiết bị học tập.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Thêm phòng học mới
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Cập nhật thông tin phòng học' : 'Khai báo phòng học mới'}
        maxWidth="800px"
      >
        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mã phòng học</label>
            <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Ví dụ: A1-202" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sức chứa (Capacity)</label>
            <input type="number" min="0" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tòa nhà / Khu vực</label>
            <input value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} placeholder="Ví dụ: Tòa nhà A1" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Trang thiết bị (cách nhau bằng dấu phẩy)</label>
            <input value={form.facilities} onChange={(e) => setForm((p) => ({ ...p, facilities: e.target.value }))} placeholder="Ví dụ: Máy chiếu, Điều hòa, Bảng điện tử" style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={() => setShowForm(false)} className="btn-primary" style={{ background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }}>Hủy bỏ</button>
          <button onClick={submit} className="btn-primary">{editing ? 'Lưu thay đổi' : 'Xác nhận thêm'}</button>
        </div>
      </Modal>

      <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--muted)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Đang truy xuất dữ liệu phòng học...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {rooms.map((room) => (
              <div key={room._id || room.code} style={{ 
                padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{room.code}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{room.building || '—'}</span>
                  </div>
                  <div className="glass" style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} /> {room.capacity}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(room.facilities || []).map(item => (
                    <span key={item} style={{ 
                      padding: '0.25rem 0.5rem', background: 'var(--muted)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--muted-foreground)' 
                    }}>
                      {item}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button onClick={() => openEdit(room)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none', fontSize: '0.875rem' }}>
                    Sửa
                  </button>
                  <button onClick={() => remove(room)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', border: 'none', boxShadow: 'none', fontSize: '0.875rem' }}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            {!loading && !error && rooms.length === 0 ? <p>Không có phòng học nào được ghi nhận.</p> : null}
          </div>
        </>
      )}
    </div>
  );
}
