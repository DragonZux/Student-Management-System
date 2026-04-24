"use client";
import Card from '@/components/ui/Card';
import { Award, BookOpen, TrendingUp, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import styles from '@/styles/modules/student/grades.module.css';

export default function StudentGradesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/student/my-grades');
        if (!cancelled) setData(res.data);
      } catch (e) {
        console.error('Failed to load grades', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được điểm số');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const gpa = data?.gpa ?? 0;
  const gradedCredits = data?.graded_credits ?? 0;
  const records = data?.records || [];

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
      <header style={{ marginBottom: '2.5rem' }}>
        <h1>Kết quả Học tập</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Theo dõi điểm số và tiến độ học tập cá nhân của bạn.</p>
      </header>
      
      <div className={styles.statsGrid}>
        <Card className="glass">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <TrendingUp color="var(--primary)" size={24} />
            </div>
            <div className={styles.statInfo}>
              <p>Điểm trung bình (GPA)</p>
              <h2>{loading ? '...' : gpa.toFixed(2)}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
              <BookOpen color="var(--secondary)" size={24} />
            </div>
            <div className={styles.statInfo}>
              <p>Tín chỉ tích lũy</p>
              <h2>{loading ? '...' : gradedCredits}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
              <Award color="var(--accent)" size={24} />
            </div>
            <div className={styles.statInfo}>
              <p>Xếp loại học lực</p>
              <h2>{loading ? '...' : (gpa >= 8 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : 'Trung bình')}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Chi tiết Điểm Học kỳ">
        {loading ? (
          <div className={styles.loading}>Đang tải dữ liệu điểm số...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : records.length === 0 ? (
          <div className={styles.empty}>
            <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <p>Chưa có dữ liệu điểm số cho học kỳ này.</p>
          </div>
        ) : (
          <div className={styles.gradeList}>
            {records.map((item, index) => (
              <div key={index} className={styles.gradeItem}>
                <div className={styles.courseInfo}>
                  <div className={styles.courseTitle}>{item.course_code}: {item.course_title}</div>
                  <div className={styles.courseMeta}>Số tín chỉ: {item.credits} • Giảng viên: {item.teacher_name || 'N/A'}</div>
                </div>
                <div className={styles.gradeValue}>
                  <div className={styles.gradeLetter}>
                    {item.grade == null ? '—' : gradeLetter(item.grade)}
                  </div>
                  <div className={styles.gradeNumeric}>
                    {item.grade == null ? 'Chưa nhập' : `Điểm số: ${item.grade}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
