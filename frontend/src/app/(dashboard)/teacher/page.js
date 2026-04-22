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
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Cổng thông tin Giảng viên</h1>
        <p style={{ fontSize: '1.1rem' }}>Chào buổi sáng! Đây là tóm tắt hoạt động giảng dạy của bạn hôm nay.</p>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{error}</InlineMessage>

      <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2.5rem' }}>
        <Card title={`Lịch dạy hôm nay (${summary?.today || '---'})`} className="glass">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải lịch trình...</div>
          ) : (summary?.today_classes || []).length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              📅 Bạn không có lớp học nào trong ngày hôm nay.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {summary.today_classes.map((item) => (
                <div key={`${item.class_id}-${item.start}`} style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(99, 102, 241, 0.05)', 
                  borderRadius: '1rem', 
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: 'var(--primary)', color: 'white', borderRadius: '0.5rem' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{item.course_code || item.course_title || 'Lớp học'}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Bắt đầu: {item.start || '--:--'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-primary">Phòng {item.room || 'TBA'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Chỉ số giảng dạy" className="glass">
          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lớp học</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary?.total_classes ?? 0}</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Bài tập</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary?.total_assignments ?? 0}</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '1rem', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Chờ chấm điểm</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{summary?.pending_grading ?? 0}</div>
            </div>
            <div style={{ padding: '1.25rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '1rem', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Phản hồi mới</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534' }}>{summary?.feedback_count ?? 0}</div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Ghi điểm nhanh</button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--foreground)', justifyContent: 'center' }}>Tạo bài tập</button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem' }}>
              <ClipboardList size={28} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Tỉ lệ hoàn thành</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.completion_rate ?? 0}%</div>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '1rem' }}>
              <BookOpen size={28} color="var(--secondary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Bản ghi đã chấm</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.graded_count ?? 0}</div>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '1rem' }}>
              <MessageSquare size={28} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Lượt sinh viên</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.enrollment_count ?? 0}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
