"use client";
import Card from '@/components/ui/Card';
import { Calendar, Clock, MapPin, Download, Search, LayoutGrid, BookOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import api from '@/lib/api';
import styles from '@/styles/modules/student/schedule.module.css';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

export default function StudentSchedulePage() {
  const [exporting, setExporting] = useState(false);
  const {
    data: classes,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePaginatedData('/student/my-schedule', { 
    cacheKey: 'student_schedule', 
    initialLimit: 6 
  });

  const grouped = useMemo(() => {
    const byDay = new Map();
    const daysOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    for (const c of classes || []) {
      const slots = c.schedule || [];
      for (const s of slots) {
        const day = s.day || 'Không xác định';
        const list = byDay.get(day) || [];
        list.push({
          classId: c._id,
          course: c.course_title || c.course_code || 'Học phần không tên',
          code: c.course_code,
          room: c.room || 'Đang cập nhật',
          time: `${s.start} - ${s.end}`,
          type: c.type || 'Lớp học',
        });
        byDay.set(day, list);
      }
    }
    
    return daysOrder
      .filter(day => byDay.has(day))
      .map(day => ({
        day,
        classes: byDay.get(day).sort((a, b) => String(a.time).localeCompare(String(b.time))),
      }));
  }, [classes]);

  const exportSchedule = async () => {
    try {
      setExporting(true);
      const response = await api.get('/student/my-schedule/export', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Thoi_khoa_bieu_${new Date().toLocaleDateString('vi-VN')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export schedule', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div>
          <h1>Thời khóa biểu</h1>
          <p>Theo dõi lịch học, địa điểm phòng học và thời gian lên lớp mỗi tuần.</p>
        </div>
        <button
          className={styles.exportBtn}
          onClick={exportSchedule}
          disabled={loading || exporting}
        >
          {exporting ? (
            <span>Đang chuẩn bị...</span>
          ) : (
            <>
              <Download size={20} strokeWidth={2.5} />
              <span>Xuất PDF</span>
            </>
          )}
        </button>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
              <Clock size={48} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Đang đồng bộ lịch học của bạn...</p>
          </div>
        ) : error ? (
          <div className="glass" style={{ 
            color: '#e11d48', 
            border: '1px solid rgba(244, 63, 94, 0.2)', 
            background: 'rgba(244, 63, 94, 0.05)', 
            textAlign: 'center', 
            padding: '3rem',
            borderRadius: '2rem'
          }}>
            <p style={{ fontWeight: 700 }}>{error}</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className={`${styles.emptyState} scale-in`}>
            <div style={{ 
              padding: '2rem', 
              background: 'var(--surface-2)', 
              borderRadius: '2.5rem',
              color: 'var(--primary)',
              marginBottom: '1rem'
            }}>
              <Calendar size={64} strokeWidth={1.5} />
            </div>
            <p>Hiện tại bạn chưa có lịch học nào được đăng ký trong học kỳ này.</p>
          </div>
        ) : (
          <div className={styles.scheduleList}>
            {grouped.map((day, dayIdx) => (
              <div key={day.day} className={`${styles.daySection} slide-right`} style={{ animationDelay: `${dayIdx * 0.1}s` }}>
                <h3 className={styles.dayTitle}>
                  <LayoutGrid size={22} className={styles.detailIcon} />
                  {day.day}
                </h3>
                <div className={styles.grid}>
                  {day.classes.map((cls, idx) => (
                    <Card 
                      key={idx} 
                      className={`${styles.classCard} glass card-hover scale-in`} 
                      style={{ animationDelay: `${(dayIdx * 0.1) + (idx * 0.05)}s` }}
                    >
                      <div className={styles.classHeader}>
                        <div className={styles.courseCode}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            {cls.code}
                          </div>
                          {cls.course}
                        </div>
                        <span className={styles.classType}>{cls.type}</span>
                      </div>
                      <div className={styles.classDetails}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailIcon} style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                            <Clock size={18} />
                          </div>
                          <span>{cls.time}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailIcon} style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                            <MapPin size={18} />
                          </div>
                          <span>Phòng: <b>{cls.room}</b></span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !error && classes.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              total={total}
              currentCount={classes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              showPageSize
            />
          </div>
        )}
      </div>
    </div>
  );
}

