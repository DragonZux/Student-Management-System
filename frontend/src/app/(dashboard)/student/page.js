import Link from 'next/link';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book, Calendar, Award, Wallet, ArrowRight, Zap, Bell, CheckCircle2, Layout, GraduationCap, FileText } from 'lucide-react';
import { serverApiFetch } from '@/lib/serverApi';
import styles from '@/styles/modules/student/dashboard.module.css';

function formatDeadline(value) {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định';
  return date.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadStudentSummary() {
  try {
    const response = await serverApiFetch('/student/dashboard-summary', { next: { revalidate: 30 } });
    return {
      summary: response,
      error: '',
    };
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return {
      summary: null,
      error: error?.message || 'Không tải được dữ liệu bảng điều khiển',
    };
  }
}

export default async function StudentDashboard() {
  const { summary, error } = await loadStudentSummary();
  
  const stats = [
    {
      label: 'Lớp học kế tiếp',
      value: summary?.next_class ? `${summary.next_class.course_code || summary.next_class.course_title}` : 'Không có lịch',
      subValue: summary?.next_class?.start ? `@ ${summary.next_class.start}` : '',
      icon: Calendar,
      bg: 'rgba(99, 102, 241, 0.1)',
      color: 'var(--primary)',
    },
    {
      label: 'Điểm trung bình (GPA)',
      value: summary ? Number(summary?.gpa ?? 0).toFixed(2) : '0.00',
      subValue: 'Dựa trên học kỳ này',
      icon: Award,
      bg: 'rgba(168, 85, 247, 0.1)',
      color: 'var(--secondary)',
    },
    {
      label: 'Bài tập chờ nộp',
      value: summary ? `${summary?.pending_assignments ?? 0} bài tập` : '0 bài tập',
      subValue: 'Cần hoàn thành sớm',
      icon: Book,
      bg: 'rgba(37, 99, 235, 0.1)',
      color: '#2563eb',
    },
    {
      label: 'Số dư học phí',
      value: summary ? `$${Number(summary?.outstanding_balance || 0).toLocaleString()}` : '$0',
      subValue: 'Tổng dư nợ hiện tại',
      icon: Wallet,
      bg: 'rgba(16, 185, 129, 0.1)',
      color: 'var(--accent)',
    },
  ];

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Bảng điều khiển</h1>
        <p>Chào mừng bạn trở lại! Hãy xem qua tiến độ học tập của bạn hôm nay.</p>
      </header>

      {error && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error}</InlineMessage>}

      <div className={styles.statsGrid}>
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${styles.statCard} slide-right`} style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
              <div className={styles.iconWrapper} style={{ background: item.bg, color: item.color }}>
                <Icon size={28} strokeWidth={2} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>{item.label}</span>
                <h3 className={styles.statValue}>{item.value}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600, marginTop: '0.25rem' }}>
                  {item.subValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.mainGrid}>
        <div className="slide-right stagger-2">
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>Tiến độ Bài tập</div>}>
            <div style={{ padding: '0.5rem' }}>
              {!summary ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)', background: 'var(--surface-1)', borderRadius: '2.5rem' }}>
                  <p style={{ fontWeight: 600 }}>{error || 'Đang đồng bộ dữ liệu...'}</p>
                </div>
              ) : summary?.upcoming_deadline ? (
                <div className={styles.deadlineCard}>
                  <div className={styles.deadlineInfo}>
                    <div className={styles.courseBadge}>
                      {summary.upcoming_deadline.course_code}
                    </div>
                    <h3 className={styles.deadlineTitle}>{summary.upcoming_deadline.title}</h3>
                    <p className={styles.deadlineDesc}>
                      {summary.upcoming_deadline.description || 'Hoàn thành và nộp bài đúng hạn để đạt kết quả tốt nhất.'}
                    </p>
                  </div>
                  <div className={styles.deadlineDate}>
                    <div className={styles.dateLabel}>Hạn nộp cuối cùng</div>
                    <div className={styles.dateValue}>
                      {formatDeadline(summary.upcoming_deadline.deadline)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--muted-foreground)', background: 'var(--surface-1)', borderRadius: '2.5rem', border: '2px dashed var(--border)' }}>
                  <CheckCircle2 size={64} style={{ opacity: 0.1, marginBottom: '1.5rem', color: 'var(--accent)' }} />
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>Tất cả đã hoàn tất!</p>
                  <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>Bạn không có bài tập nào sắp đến hạn trong tuần này.</p>
                </div>
              )}
            </div>
          </Card>

          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Thao tác nhanh</h3>
            <div className={styles.actionGrid}>
              <Link href="/student/enrollment" className={styles.actionLink} style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                <Layout size={24} />
                <span>Đăng ký học</span>
              </Link>
              <Link href="/student/schedule" className={styles.actionLink} style={{ background: 'var(--surface-1)', color: 'var(--foreground)' }}>
                <Calendar size={24} color="var(--primary)" />
                <span>Lịch học</span>
              </Link>
              <Link href="/exams" className={styles.actionLink} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white', border: 'none' }}>
                <Zap size={24} />
                <span>Làm bài thi</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="slide-right stagger-3">
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>Tóm tắt Học thuật</div>}>
            <div className={styles.overviewList}>
              <div className={styles.overviewItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.75rem' }}>
                    <Book size={20} color="#16a34a" />
                  </div>
                  <span className={styles.overviewLabel} style={{ color: '#166534' }}>Môn học đang học</span>
                </div>
                <span className={styles.overviewValue}>{summary?.active_courses ?? 0}</span>
                <Link href="/student/assignments" className={styles.quickLink} style={{ color: '#16a34a' }}>
                  Chi tiết <ArrowRight size={14} />
                </Link>
              </div>
              
              <div className={styles.overviewItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '0.75rem' }}>
                    <GraduationCap size={20} color="var(--primary)" />
                  </div>
                  <span className={styles.overviewLabel} style={{ color: 'var(--primary)' }}>Đã hoàn thành</span>
                </div>
                <span className={styles.overviewValue}>{summary?.completed_courses ?? 0}</span>
                <Link href="/student/transcript" className={styles.quickLink} style={{ color: 'var(--primary)' }}>
                  Xem bảng điểm <ArrowRight size={14} />
                </Link>
              </div>

              <div className={styles.overviewItem} style={{ border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '0.75rem' }}>
                      <Bell size={20} color="#f43f5e" />
                    </div>
                    <span className={styles.overviewLabel} style={{ color: '#f43f5e' }}>Thông báo mới</span>
                  </div>
                  {summary?.unread_notifications > 0 && <span className="badge badge-danger">Mới</span>}
                </div>
                <span className={styles.overviewValue} style={{ color: '#f43f5e' }}>{summary?.unread_notifications ?? 0}</span>
                <Link href="/notifications" className={styles.quickLink} style={{ color: '#f43f5e' }}>
                  Kiểm tra ngay <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

