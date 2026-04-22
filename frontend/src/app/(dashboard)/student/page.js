"use client";
import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Book, Calendar, Award, Wallet, Bell } from 'lucide-react';
import api from '@/lib/api';

function formatDeadline(value) {
  if (!value) return 'Chưa có dữ liệu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';
  return date.toLocaleString();
}

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/student/dashboard-summary');
        if (!cancelled) setSummary(res.data || null);
      } catch (e) {
        console.error('Failed to load student dashboard summary', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được dữ liệu dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => ([
    {
      label: 'Lớp học tiếp theo',
      value: summary?.next_class ? `${summary.next_class.course_code || summary.next_class.course_title} @ ${summary.next_class.start || '--:--'}` : 'Chưa có lịch học',
      icon: Calendar,
      color: 'var(--primary)',
    },
    {
      label: 'GPA hiện tại',
      value: loading ? '...' : String(summary?.gpa ?? 0),
      icon: Award,
      color: 'var(--secondary)',
    },
    {
      label: 'Bài tập chưa nộp',
      value: loading ? '...' : String(summary?.pending_assignments ?? 0),
      icon: Book,
      color: '#2563eb',
    },
    {
      label: 'Số dư học phí',
      value: loading ? '...' : `$${Number(summary?.outstanding_balance || 0).toFixed(2)}`,
      icon: Wallet,
      color: '#0f766e',
    },
  ]), [loading, summary]);

  return (
    <div>
      <h1>Bảng điều khiển sinh viên</h1>
      <InlineMessage variant="error" style={{ marginTop: '1rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-2" style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="glass">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Icon size={32} color={item.color} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{item.label}</p>
                  <h3 style={{ margin: 0 }}>{item.value}</h3>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1">
        <Card title="Hạn nộp sắp tới" className="glass">
          {loading ? (
            <div>Đang tải...</div>
          ) : summary?.upcoming_deadline ? (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{summary.upcoming_deadline.title || 'Bài tập'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {summary.upcoming_deadline.course_code || summary.upcoming_deadline.course_title || 'Không rõ môn học'}
                </div>
                <div style={{ marginTop: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                  {summary.upcoming_deadline.description || 'Chưa có mô tả'}
                </div>
              </div>
              <div style={{ color: '#991b1b', fontWeight: 600, textAlign: 'right' }}>
                {formatDeadline(summary.upcoming_deadline.deadline)}
              </div>
            </div>
          ) : (
            <div>Không có bài tập nào đang chờ nộp.</div>
          )}
        </Card>

        <Card title="Tổng quan học tập" className="glass" style={{ marginTop: '1.5rem' }}>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Môn đang học</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary?.active_courses ?? 0}</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Môn đã hoàn thành</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary?.completed_courses ?? 0}</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Bell size={14} /> Thông báo chưa đọc
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary?.unread_notifications ?? 0}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
