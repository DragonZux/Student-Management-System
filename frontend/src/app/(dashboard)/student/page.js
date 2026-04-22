import Card from '@/components/ui/Card';
import { Book, Calendar, Award, Wallet } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div>
      <h1>Bảng điều khiển sinh viên</h1>
      <div className="grid grid-cols-2" style={{ marginBottom: '2.5rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Calendar size={32} color="var(--primary)" />
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Lớp học tiếp theo</p>
              <h3 style={{ margin: 0 }}>CS101 @ 10:00 AM</h3>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Award size={32} color="var(--secondary)" />
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>GPA hiện tại</p>
              <h3 style={{ margin: 0 }}>3.73</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1">
        <Card title="Hạn nộp sắp tới">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Bài luận đạo đức AI</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>CS101</div>
              </div>
              <div style={{ color: '#991b1b', fontWeight: 600 }}>Còn 2 ngày</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
