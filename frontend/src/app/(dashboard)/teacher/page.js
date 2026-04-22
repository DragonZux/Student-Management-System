import Card from '@/components/ui/Card';
import { BookOpen, ClipboardList, GraduationCap, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  return (
    <div>
      <h1>Cổng giảng viên</h1>
      <div className="grid grid-cols-2" style={{ marginBottom: '2.5rem' }}>
        <Card className="glass">
          <h3 style={{ marginBottom: '1rem' }}>Lịch hôm nay</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
              <span>10:00 AM - CS101</span>
              <span style={{ fontWeight: 600 }}>Room 302</span>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
              <span>02:00 PM - CS201</span>
              <span style={{ fontWeight: 600 }}>Lab 1</span>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <h3 style={{ marginBottom: '1rem' }}>Công việc chấm điểm</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>12</div>
            <p style={{ margin: 0 }}>Các bài nộp chờ bạn xem xét.</p>
          </div>
          <button style={{ marginTop: '1rem', color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600 }}>Đi tới hàng chờ chấm bài →</button>
        </Card>
      </div>
    </div>
  );
}
