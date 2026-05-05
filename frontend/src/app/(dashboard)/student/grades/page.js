"use client";
import Card from '@/components/ui/Card';
import { Award, BookOpen, TrendingUp, Search, Star, FileText } from 'lucide-react';
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

  const getGradeInfo = (value) => {
    const v = Number(value);
    if (Number.isNaN(v)) return { letter: '—', color: 'var(--muted-foreground)', bg: 'var(--surface-2)' };
    if (v >= 9) return { letter: 'A', color: '#059669', bg: 'rgba(16, 185, 129, 0.1)' };
    if (v >= 8) return { letter: 'B+', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)' };
    if (v >= 7) return { letter: 'B', color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' };
    if (v >= 6) return { letter: 'C+', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)' };
    if (v >= 5) return { letter: 'C', color: '#d97706', bg: 'rgba(245, 158, 11, 0.05)' };
    return { letter: 'F', color: '#e11d48', bg: 'rgba(244, 63, 94, 0.1)' };
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Kết quả Học tập</h1>
        <p>Theo dõi chi tiết điểm số, tiến độ học tập và xếp loại học lực cá nhân qua từng học kỳ.</p>
      </header>
      
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} slide-right stagger-2`}>
          <div className={styles.statIcon} style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
            <TrendingUp size={32} strokeWidth={2.5} />
          </div>
          <div className={styles.statInfo}>
            <p>Điểm trung bình (GPA)</p>
            <h2>{loading ? '...' : gpa.toFixed(2)}</h2>
          </div>
        </div>

        <div className={`${styles.statCard} slide-right stagger-2`} style={{ animationDelay: '0.3s' }}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Star size={32} strokeWidth={2.5} />
          </div>
          <div className={styles.statInfo}>
            <p>Tín chỉ tích lũy</p>
            <h2>{loading ? '...' : gradedCredits}</h2>
          </div>
        </div>

        <div className={`${styles.statCard} slide-right stagger-2`} style={{ animationDelay: '0.4s' }}>
          <div className={styles.statIcon} style={{ 
            background: gpa >= 8 ? 'rgba(16, 185, 129, 0.1)' : gpa >= 6.5 ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: gpa >= 8 ? '#059669' : gpa >= 6.5 ? 'var(--primary)' : '#d97706'
          }}>
            <Award size={32} strokeWidth={2.5} />
          </div>
          <div className={styles.statInfo}>
            <p>Xếp loại học lực</p>
            <h2 style={{ color: gpa >= 8 ? '#059669' : gpa >= 6.5 ? 'var(--primary)' : '#d97706' }}>
              {loading ? '...' : (gpa >= 8 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : 'Trung bình')}
            </h2>
          </div>
        </div>
      </div>

      <div className="slide-right stagger-3">
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><BookOpen size={20} color="var(--primary)" /> Chi tiết Học phần</div>}>
          <div style={{ padding: '0.5rem' }}>
            {loading ? (
              <div className={styles.loading}>
                <div className="animate-spin" style={{ marginBottom: '1.5rem' }}>
                  <TrendingUp size={48} color="var(--primary)" />
                </div>
                <p>Đang tổng hợp dữ liệu học tập...</p>
              </div>
            ) : error ? (
              <div className={styles.error}>
                <p>{error}</p>
              </div>
            ) : records.length === 0 ? (
              <div className={styles.empty}>
                <Search size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p>Chưa có dữ liệu điểm số chính thức trong hệ thống.</p>
              </div>
            ) : (
              <>
                <div className={styles.gradeList}>
                  {records.map((item, index) => {
                    const gradeInfo = getGradeInfo(item.grade);
                    return (
                      <div key={index} className={styles.gradeItem} style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className={styles.courseInfo}>
                          <div className={styles.courseTitle}>{item.course_code}: {item.course_title}</div>
                          <div className={styles.courseMeta}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.35rem 0.75rem', borderRadius: '0.75rem' }}>
                              <FileText size={14} />
                              <span>{item.credits} Tín chỉ</span>
                            </div>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>Giảng viên: <b>{item.teacher_name || 'Đang cập nhật'}</b></span>
                          </div>
                        </div>
                        <div className={styles.gradeValue}>
                          <div className={styles.gradeNumeric}>
                            <label>Điểm số</label>
                            <span>{item.grade == null ? '—' : item.grade.toFixed(1)}</span>
                          </div>
                          <div className={styles.gradeLetter} style={{ 
                            backgroundColor: gradeInfo.bg,
                            color: gradeInfo.color,
                            borderColor: gradeInfo.color
                          }}>
                            {gradeInfo.letter}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ marginTop: '3rem' }}>
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
          </div>
        </Card>
      </div>
    </div>
  );
}

