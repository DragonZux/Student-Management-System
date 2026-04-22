 "use client";
import Card from '@/components/ui/Card';
import { Award, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

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
    <div>
      <h1>My Academic Performance</h1>
      
      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius)' }}>
              <TrendingUp color="var(--primary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Current GPA</p>
              <h2 style={{ margin: 0 }}>{loading ? '...' : gpa}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius)' }}>
              <BookOpen color="var(--secondary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Credits Completed</p>
              <h2 style={{ margin: 0 }}>{loading ? '...' : gradedCredits}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius)' }}>
              <Award color="var(--accent)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Rank in Class</p>
              <h2 style={{ margin: 0 }}>—</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Điểm học kỳ hiện tại">
        {loading ? <div style={{ padding: '1rem' }}>Đang tải...</div> : null}
        {error ? <div style={{ padding: '1rem', color: '#991b1b' }}>{error}</div> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius)',
              background: 'var(--muted)',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.course_code}: {item.course_title}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Số tín chỉ: {item.credits}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {item.grade == null ? '—' : gradeLetter(item.grade)}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                  {item.grade == null ? '' : `Điểm: ${item.grade}`}
                </div>
              </div>
            </div>
          ))}
          {!loading && !error && records.length === 0 ? <div style={{ padding: '1rem' }}>Chưa có điểm nào.</div> : null}
        </div>
      </Card>
    </div>
  );
}
