"use client";
import Card from '@/components/ui/Card';
import { Award, BookOpen, TrendingUp, Search } from 'lucide-react';
import { useMemo } from 'react';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';
import styles from '@/styles/modules/student/grades.module.css';

export default function StudentGradesPage() {
  const {
    data: records,
    rawData,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePaginatedData('/student/my-grades', {
    cacheKey: 'student_grades',
    initialLimit: 8,
    responseAdapter: (result, meta) => ({
      data: result?.records || [],
      total: result?.total || 0,
      skip: result?.skip ?? meta.skip,
    }),
  });
  const summary = useMemo(() => ({
    gpa: rawData?.gpa ?? 0,
    graded_credits: rawData?.graded_credits ?? 0,
  }), [rawData]);
  const gpa = summary.gpa;
  const gradedCredits = summary.graded_credits;

  const gradeLetter = (value) => {
    const v = Number(value);
    if (Number.isNaN(v)) return '—';
    if (v >= 9) return 'A';
    if (v >= 8) return 'B+';
    if (v >= 7) return 'B';
    if (v >= 6) return 'C+';
    if (v >= 5) return 'C';
    return 'F';
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className="slide-right stagger-1" style={{ marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Kết quả Học tập</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', fontWeight: 500 }}>Theo dõi chi tiết điểm số, tiến độ và xếp loại học lực cá nhân.</p>
      </header>
      
      <div className={`${styles.statsGrid} slide-right stagger-2`}>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(var(--primary-rgb), 0.08)' }}>
              <TrendingUp color="var(--primary)" size={28} />
            </div>
            <div className={styles.statInfo}>
              <p>Điểm trung bình (GPA)</p>
              <h2>{loading ? '...' : gpa.toFixed(2)}</h2>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.08)' }}>
              <BookOpen color="#a855f7" size={28} />
            </div>
            <div className={styles.statInfo}>
              <p>Tín chỉ tích lũy</p>
              <h2>{loading ? '...' : gradedCredits}</h2>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.08)' }}>
              <Award color="#f43f5e" size={28} />
            </div>
            <div className={styles.statInfo}>
              <p>Xếp loại hiện tại</p>
              <h2 style={{ color: gpa >= 8 ? '#059669' : gpa >= 6.5 ? 'var(--primary)' : '#d97706' }}>
                {loading ? '...' : (gpa >= 8 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : 'Trung bình')}
              </h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="slide-right stagger-3">
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>Chi tiết Học phần</div>}>
          {loading ? (
            <div className={styles.loading}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <p>Đang đồng bộ dữ liệu điểm số...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : records.length === 0 ? (
            <div className={styles.empty}>
              <Search size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p>Chưa có dữ liệu điểm số chính thức trong hệ thống.</p>
            </div>
          ) : (
            <>
              <div className={styles.gradeList}>
                {records.map((item, index) => (
                  <div key={index} className={styles.gradeItem} style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className={styles.courseInfo}>
                      <div className={styles.courseTitle}>{item.course_code}: {item.course_title}</div>
                      <div className={styles.courseMeta}>
                        <span style={{ fontWeight: 800, color: 'var(--foreground)' }}>{item.credits} Tín chỉ</span> • 
                        Giảng viên: {item.teacher_name || 'Đang cập nhật'}
                      </div>
                    </div>
                    <div className={styles.gradeValue}>
                      <div className={styles.gradeNumeric}>
                        <label>Điểm số</label>
                        <span>{item.grade == null ? '—' : item.grade.toFixed(1)}</span>
                      </div>
                      <div className={styles.gradeLetter} style={{ 
                        background: (gradeLetter(item.grade) === 'A' || gradeLetter(item.grade) === 'B+') ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-2)',
                        color: (gradeLetter(item.grade) === 'A' || gradeLetter(item.grade) === 'B+') ? '#059669' : 'var(--primary)',
                        borderColor: (gradeLetter(item.grade) === 'A' || gradeLetter(item.grade) === 'B+') ? '#059669' : 'var(--border)'
                      }}>
                        {gradeLetter(item.grade)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '2rem' }}>
                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  currentCount={records.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  showPageSize
                />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
