"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function StudentEnrollmentPage() {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/student/available-classes');
        if (!cancelled) setAvailableClasses(response.data || []);
      } catch (err) {
        if (!cancelled) {
          setAvailableClasses([]);
          setError(err.response?.data?.detail || 'Không tải được danh sách lớp khả dụng.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchClasses();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnroll = async (classId) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/student/enroll/${classId}`);
      setSuccess('Đăng ký lớp thành công!');
      setAvailableClasses((prev) => prev.filter((c) => c._id !== classId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại.');
    }
  };

  if (loading) return <div>Đang tải lớp học khả dụng...</div>;

  return (
    <div>
      <h1>Đăng ký học phần</h1>
      <p style={{ marginBottom: '2.5rem' }}>Chọn lớp học cho học kỳ hiện tại.</p>
      
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error}</InlineMessage>
      <InlineMessage variant="success" style={{ marginBottom: '1rem' }}>{success}</InlineMessage>

      <div className="grid grid-cols-1" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {availableClasses.map((cls) => (
          <Card key={cls._id} className="glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <Book color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Môn học: {cls.course_code || cls.course_title || cls.course_id || '—'}</h3>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    Giảng viên: {cls.teacher_name || cls.teacher_id || '—'} | Phòng: {cls.room || '—'}
                  </p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Lịch học: {(cls.schedule || []).map((s) => `${s.day || 'N/A'} ${s.start || '--:--'}-${s.end || '--:--'}`).join(', ') || 'Chưa cập nhật'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Đã đăng ký: {cls.current_enrollment} / {cls.capacity}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleEnroll(cls._id)}
                className="glass" style={{ 
                padding: '0.75rem 2rem', borderRadius: 'var(--radius)', 
                background: 'var(--primary)', 
                color: 'white',
                border: 'none', cursor: 'pointer',
                fontWeight: 600
              }}>
                Đăng ký ngay
              </button>
            </div>
          </Card>
        ))}
        {availableClasses.length === 0 && <p>Không có lớp học nào khả dụng.</p>}
      </div>
    </div>
  );
}
