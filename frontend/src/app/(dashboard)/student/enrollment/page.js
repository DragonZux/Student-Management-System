"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

import styles from '@/styles/modules/student/enrollment.module.css';
import { Book, User, Clock, CheckCircle } from 'lucide-react';

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
      setSuccess('Đăng ký lớp học thành công! Chào mừng bạn đến với khóa học.');
      refresh();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Đăng ký Học phần</h1>
        <p>Chọn và đăng ký các lớp học phù hợp cho lộ trình học tập của bạn.</p>
      </header>
      
      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}
      {actionError && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{actionError}</InlineMessage>}
      {success && <InlineMessage variant="success" style={{ marginBottom: '2rem' }}>{success}</InlineMessage>}

      <div className={`${styles.classList} slide-right stagger-2`}>
        {loading ? (
          <div style={{ padding: '6rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tìm kiếm các lớp học khả dụng...</p>
          </div>
        ) : availableClasses.length === 0 ? (
          <div style={{ padding: '8rem', textAlign: 'center', background: 'var(--surface-1)', borderRadius: '2rem', border: '1px dashed var(--border)' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>Hiện không có lớp học nào mở đăng ký.</p>
          </div>
        ) : availableClasses.map((cls, index) => {
          const fillPercentage = Math.min(100, (cls.current_enrollment / cls.capacity) * 100);
          return (
            <div 
              key={cls._id} 
              className={styles.classCard}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={styles.mainInfo}>
                <div className={styles.iconBox}>
                  <Book size={28} />
                </div>
                <div className={styles.details}>
                  <h3>{cls.course_code || 'N/A'} — {cls.course_title || cls.course_id || 'Môn học mới'}</h3>
                  <div className={styles.teacherInfo}>
                    <User size={16} />
                    Giảng viên: {cls.teacher_name || 'Đang cập nhật'}
                  </div>
                  <div className={styles.scheduleInfo}>
                    <Clock size={16} />
                    {(cls.schedule || []).map((s) => `${s.day} ${s.start}-${s.end}`).join(', ') || 'Chưa có lịch cụ thể'}
                  </div>
                  <div className={styles.capacityWrapper}>
                    <div className={styles.capacityBar}>
                      <div className={styles.capacityFill} style={{ width: `${fillPercentage}%` }} />
                    </div>
                    <span className={styles.capacityText}>
                      {cls.current_enrollment} / {cls.capacity} sinh viên
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleEnroll(cls._id)}
                className={styles.enrollBtn}
                disabled={cls.current_enrollment >= cls.capacity}
              >
                {cls.current_enrollment >= cls.capacity ? 'Lớp đã đầy' : 'Đăng ký ngay'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="slide-right stagger-3">
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
    </div>
  );
}
