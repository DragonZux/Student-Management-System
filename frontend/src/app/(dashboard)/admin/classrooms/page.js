 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { MapPin, Users, Monitor } from 'lucide-react';
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

  const load = async () => {
    const res = await api.get('/admin/classrooms');
    setRooms(res.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError('');
        await load();
      } catch (e) {
        console.error('Failed to load classrooms', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách phòng học');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Cơ sở vật chất & phòng học</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={openCreate}
        >
          Thêm tài nguyên
        </button>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          {showForm ? (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{editing ? 'Sửa phòng học' : 'Tạo phòng học'}</div>
              <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mã phòng</label>
                  <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Sức chứa</label>
                  <input type="number" min="0" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tòa nhà</label>
                  <input value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Trang thiết bị (cách nhau bằng dấu phẩy)</label>
                  <input value={form.facilities} onChange={(e) => setForm((p) => ({ ...p, facilities: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
                <button onClick={submit} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Lưu</button>
              </div>
            </div>
          ) : null}

          {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{error}</InlineMessage>

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
                  <button onClick={() => openEdit(room)} style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700 }}>
                    Sửa
                  </button>
                  <button onClick={() => remove(room)} style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 800, color: '#991b1b' }}>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!loading && !error && rooms.length === 0 ? <div style={{ padding: '1rem' }}>Không có phòng học nào.</div> : null}
        </Card>
      </div>
    </div>
  );
}
