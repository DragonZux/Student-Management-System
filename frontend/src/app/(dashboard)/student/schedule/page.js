 "use client";
import Card from '@/components/ui/Card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

export default function StudentSchedulePage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/student/my-schedule');
        if (!cancelled) setClasses(res.data || []);
      } catch (e) {
        console.error('Failed to load schedule', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được thời khóa biểu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    // Expand by day based on class.schedule slots
    const byDay = new Map();
    for (const c of classes || []) {
      const slots = c.schedule || [];
      for (const s of slots) {
        const day = s.day || 'Unknown';
        const list = byDay.get(day) || [];
        list.push({
          classId: c._id,
          course: c.course_code || c.course_title || c.course_id,
          room: c.room,
          time: `${s.start}-${s.end}`,
          type: 'Lớp học',
        });
        byDay.set(day, list);
      }
    }
    return Array.from(byDay.entries()).map(([day, items]) => ({
      day,
      classes: items.sort((a, b) => String(a.time).localeCompare(String(b.time))),
    }));
  }, [classes]);

  const exportSchedule = async () => {
    try {
      setExporting(true);
      const response = await api.get('/student/my-schedule/export', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-schedule.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export schedule', e);
      setError(e.response?.data?.detail || 'Không thể xuất thời khóa biểu');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Thời khóa biểu hàng tuần</h1>
        <button
          className="glass"
          onClick={exportSchedule}
          disabled={loading || exporting}
          style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: loading || exporting ? 'not-allowed' : 'pointer' }}
        >
          {exporting ? 'Đang xuất...' : 'Xuất PDF'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? <Card className="glass">Đang tải...</Card> : null}
        {error ? <Card className="glass" style={{ color: '#991b1b' }}>{error}</Card> : null}
        {grouped.map((day) => (
          <div key={day.day}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--primary)" />
              {day.day}
            </h3>
            <div className="grid grid-cols-2">
              {day.classes.map((cls, idx) => (
                <Card key={idx} className="glass">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{cls.course}</div>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--muted)', borderRadius: '4px' }}>{cls.type}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                      <Clock size={16} /> {cls.time}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                      <MapPin size={16} /> {cls.room}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {!loading && !error && grouped.length === 0 ? <Card className="glass">Chưa có lớp học nào.</Card> : null}
      </div>
    </div>
  );
}
