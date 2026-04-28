"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

export default function StudentEnrollmentPage() {
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    data: availableClasses,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    refresh,
  } = usePaginatedData('/student/available-classes', { cacheKey: 'student_available_classes', initialLimit: 6 });

  const handleEnroll = async (classId) => {
    setActionError('');
    setSuccess('');
    try {
      await api.post(`/student/enroll/${classId}`);
      setSuccess('Đăng ký lớp thành công!');
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Đăng ký thất bại.');
    }
  };

  if (loading) return <div>Đang tải lớp học khả dụng...</div>;

  return (
    <div>
      <h1>Đăng ký học phần</h1>
      <p style={{ marginBottom: '2.5rem' }}>Chọn lớp học cho học kỳ hiện tại.</p>
      
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error}</InlineMessage>
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{actionError}</InlineMessage>
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

      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        total={total}
        currentCount={availableClasses.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        showPageSize
      />
    </div>
  );
}
