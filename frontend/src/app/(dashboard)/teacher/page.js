"use client";
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { BookOpen, ClipboardList, MessageSquare, Clock, Calendar, Zap, FileText } from 'lucide-react';
import api from '@/lib/api';
import styles from '@/styles/modules/teacher/dashboard.module.css';

export default function TeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/teacher/dashboard-summary');
        if (!cancelled) setSummary(res.data || null);
      } catch (e) {
        console.error('Failed to load teacher dashboard summary', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được dữ liệu dashboard giảng viên');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Cổng thông tin Giảng viên</h1>
        <p>Chào buổi sáng! Đây là tóm tắt hoạt động giảng dạy của bạn hôm nay.</p>
      </header>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}

      <div className={styles.mainGrid}>
        <Card title={`Lịch dạy hôm nay (${summary?.today || '---'})`} className="slide-right stagger-2">
          <div style={{ padding: '0.5rem' }}>
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải lịch trình...</p>
              </div>
            ) : (summary?.today_classes || []).length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted-foreground)', background: 'var(--surface-1)', borderRadius: '1.5rem' }}>
                <Calendar size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p style={{ fontWeight: 600 }}>Bạn không có lớp học nào trong ngày hôm nay.</p>
              </div>
            ) : (
              <div className={styles.scheduleList}>
                {summary.today_classes.map((item) => (
                  <div key={`${item.class_id}-${item.start}`} className={styles.scheduleItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.iconBox}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className={styles.courseCode}>{item.course_code || item.course_title || 'Lớp học'}</div>
                        <div className={styles.startTime}>Bắt đầu: {item.start || '--:--'}</div>
                      </div>
                    </div>
                    <div>
                      <span className="badge badge-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 800 }}>Phòng {item.room || 'TBA'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card title="Chỉ số giảng dạy" className="slide-right stagger-2">
          <div style={{ padding: '0.5rem' }}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Lớp học</span>
                <span className={styles.statValue}>{summary?.total_classes ?? 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Bài tập</span>
                <span className={styles.statValue}>{summary?.total_assignments ?? 0}</span>
              </div>
              <div className={styles.statItem} style={{ background: 'rgba(244, 63, 94, 0.04)', borderColor: 'rgba(244, 63, 94, 0.1)' }}>
                <span className={styles.statLabel} style={{ color: '#f43f5e' }}>Chờ chấm điểm</span>
                <span className={styles.statValue} style={{ color: '#f43f5e' }}>{summary?.pending_grading ?? 0}</span>
              </div>
              <div className={styles.statItem} style={{ background: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.1)' }}>
                <span className={styles.statLabel} style={{ color: '#166534' }}>Phản hồi mới</span>
                <span className={styles.statValue} style={{ color: '#166534' }}>{summary?.feedback_count ?? 0}</span>
              </div>
            </div>
            
            <div className={styles.actionArea}>
              <button className="btn-primary" style={{ flex: 1, padding: '1.25rem', borderRadius: '1.25rem' }}>
                <Zap size={18} /> Ghi điểm nhanh
              </button>
              <button className="btn-primary" style={{ flex: 1, background: 'var(--foreground)', padding: '1.25rem', borderRadius: '1.25rem' }}>
                <FileText size={18} /> Tạo bài tập
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.quickStats}>
        <div className={`${styles.quickStatCard} slide-right stagger-3`}>
          <div className={styles.quickIconBox} style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
            <ClipboardList size={32} />
          </div>
          <div className={styles.quickInfo}>
            <span className={styles.quickLabel}>Tỉ lệ hoàn thành</span>
            <span className={styles.quickValue}>{summary?.completion_rate ?? 0}%</span>
          </div>
        </div>
        
        <div className={`${styles.quickStatCard} slide-right stagger-3`}>
          <div className={styles.quickIconBox} style={{ background: 'rgba(var(--secondary-rgb), 0.1)', color: 'var(--secondary)' }}>
            <BookOpen size={32} />
          </div>
          <div className={styles.quickInfo}>
            <span className={styles.quickLabel}>Bản ghi đã chấm</span>
            <span className={styles.quickValue}>{summary?.graded_count ?? 0}</span>
          </div>
        </div>
        
        <div className={`${styles.quickStatCard} slide-right stagger-3`}>
          <div className={styles.quickIconBox} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
            <MessageSquare size={32} />
          </div>
          <div className={styles.quickInfo}>
            <span className={styles.quickLabel}>Lượt sinh viên</span>
            <span className={styles.quickValue}>{summary?.enrollment_count ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
    </div>
  );
}
