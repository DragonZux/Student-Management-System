"use client";
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { BookOpen, ClipboardList, MessageSquare, Clock } from 'lucide-react';
import api from '@/lib/api';

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
    <div>
      <h1>Cổng giảng viên</h1>
      <InlineMessage variant="error" style={{ marginTop: '1rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-2" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <Card className="glass">
          <h3 style={{ marginBottom: '1rem' }}>Lịch hôm nay ({summary?.today || '---'})</h3>
          {loading ? (
            <div>Đang tải...</div>
          ) : (summary?.today_classes || []).length === 0 ? (
            <div>Hôm nay chưa có lớp học nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {summary.today_classes.map((item) => (
                <div key={`${item.class_id}-${item.start}`} style={{ padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.start || '--:--'} - {item.course_code || item.course_title || 'Lớp học'}</span>
                  <span style={{ fontWeight: 600 }}>{item.room || 'TBA'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass">
          <h3 style={{ marginBottom: '1rem' }}>Tổng quan giảng dạy</h3>
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Lớp đang dạy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.total_classes ?? 0}</div>
              </div>
              <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Bài tập đã tạo</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.total_assignments ?? 0}</div>
              </div>
              <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Bài nộp chờ xem</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.pending_grading ?? 0}</div>
              </div>
              <div style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Phản hồi sinh viên</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.feedback_count ?? 0}</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3">
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ClipboardList size={24} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tỉ lệ chấm điểm</div>
              <div style={{ fontWeight: 700 }}>{summary?.completion_rate ?? 0}%</div>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BookOpen size={24} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Bản ghi đã chấm</div>
              <div style={{ fontWeight: 700 }}>{summary?.graded_count ?? 0}</div>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageSquare size={24} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tổng lượt đăng ký</div>
              <div style={{ fontWeight: 700 }}>{summary?.enrollment_count ?? 0}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
