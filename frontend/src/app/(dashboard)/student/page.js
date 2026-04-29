import Link from 'next/link';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book, Calendar, Award, Wallet, ArrowRight, Zap, Bell } from 'lucide-react';
import { serverApiFetch } from '@/lib/serverApi';
import styles from '@/styles/modules/student/dashboard.module.css';

function formatDeadline(value) {
  if (!value) return 'Chưa có dữ liệu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';
  return date.toLocaleString('vi-VN');
}

async function loadStudentSummary() {
  try {
    return {
      summary: await serverApiFetch('/student/dashboard-summary', { next: { revalidate: 30 } }),
      error: '',
    };
  } catch (error) {
    return {
      summary: null,
      error: error.message || 'Không tải được dữ liệu dashboard',
    };
  }
}

export default async function StudentDashboard() {
  const { summary, error } = await loadStudentSummary();
  const loading = !summary;
  
  const stats = [
    {
      label: 'Lớp học tiếp theo',
      value: summary?.next_class ? `${summary.next_class.course_code || summary.next_class.course_title} @ ${summary.next_class.start || '--:--'}` : 'Chưa có lịch học',
      icon: Calendar,
      bg: 'rgba(99, 102, 241, 0.1)',
      color: 'var(--primary)',
    },
    {
      label: 'GPA hiện tại',
      value: loading ? '...' : String(summary?.gpa ?? 0),
      icon: Award,
      bg: 'rgba(168, 85, 247, 0.1)',
      color: 'var(--secondary)',
    },
    {
      label: 'Bài tập chưa nộp',
      value: loading ? '...' : String(summary?.pending_assignments ?? 0),
      icon: Book,
      bg: 'rgba(37, 99, 235, 0.1)',
      color: '#2563eb',
    },
    {
      label: 'Số dư học phí',
      value: loading ? '...' : `$${Number(summary?.outstanding_balance || 0).toFixed(2)}`,
      icon: Wallet,
      bg: 'rgba(15, 118, 110, 0.1)',
      color: '#0f766e',
    },
  ];

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Bảng điều khiển sinh viên</h1>
        <p>Chào mừng bạn trở lại. Chúc bạn có một ngày học tập hiệu quả!</p>
      </header>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}

      <div className={styles.statsGrid}>
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${styles.statCard} slide-right`} style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
              <div className={styles.iconWrapper} style={{ background: item.bg, color: item.color }}>
                <Icon size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{item.label}</span>
                <h3 className={styles.statValue}>{item.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        <div className="slide-right stagger-2">
          <Card title="Hạn nộp bài tập sắp tới">
            <div style={{ padding: '0.5rem' }}>
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                  <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải dữ liệu...</p>
                </div>
              ) : summary?.upcoming_deadline ? (
                <div className={styles.deadlineCard}>
                  <div className={styles.deadlineInfo}>
                    <div className={styles.courseBadge}>
                      {summary.upcoming_deadline.course_code || summary.upcoming_deadline.course_title || 'Môn học'}
                    </div>
                    <h3 className={styles.deadlineTitle}>{summary.upcoming_deadline.title || 'Bài tập'}</h3>
                    <p className={styles.deadlineDesc}>
                      {summary.upcoming_deadline.description || 'Chưa có mô tả chi tiết cho bài tập này.'}
                    </p>
                  </div>
                  <div className={styles.deadlineDate}>
                    <div className={styles.dateLabel}>Hạn chót</div>
                    <div className={styles.dateValue}>
                      {formatDeadline(summary.upcoming_deadline.deadline)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)', background: 'var(--surface-1)', borderRadius: '1.5rem' }}>
                  <Zap size={48} style={{ opacity: 0.1, marginBottom: '1.5rem', color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 600 }}>🎉 Tuyệt vời! Bạn không có bài tập nào sắp đến hạn.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="Thao tác nhanh" style={{ marginTop: '2.5rem' }}>
            <div className={styles.actionGrid}>
              <Link href="/student/enrollment" className={styles.actionLink} style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                Đăng ký học
              </Link>
              <Link href="/student/schedule" className={styles.actionLink} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                Xem lịch học
              </Link>
              <Link href="/exams" className={styles.actionLink} style={{ background: 'var(--primary)', color: 'white' }}>
                Làm bài thi
              </Link>
            </div>
          </Card>
        </div>

        <div className="slide-right stagger-3">
          <Card title="Tổng quan học lực">
            <div className={styles.overviewList}>
              <div className={styles.overviewItem} style={{ background: 'rgba(34, 197, 94, 0.04)', borderColor: 'rgba(34, 197, 94, 0.1)' }}>
                <span className={styles.overviewLabel} style={{ color: '#166534' }}>Môn học đang tham gia</span>
                <span className={styles.overviewValue} style={{ color: '#166534' }}>{summary?.active_courses ?? 0}</span>
              </div>
              
              <div className={styles.overviewItem} style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                <span className={styles.overviewLabel} style={{ color: 'var(--primary)' }}>Môn học đã hoàn thành</span>
                <span className={styles.overviewValue} style={{ color: 'var(--primary)' }}>{summary?.completed_courses ?? 0}</span>
              </div>

              <div className={styles.overviewItem} style={{ background: 'rgba(244, 63, 94, 0.04)', borderColor: 'rgba(244, 63, 94, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={styles.overviewLabel} style={{ color: '#f43f5e' }}>Thông báo mới</span>
                  {summary?.unread_notifications > 0 && <span className="badge badge-danger">Mới</span>}
                </div>
                <span className={styles.overviewValue} style={{ color: '#f43f5e' }}>{summary?.unread_notifications ?? 0}</span>
                <Link href="/notifications" style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  Xem tất cả <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
