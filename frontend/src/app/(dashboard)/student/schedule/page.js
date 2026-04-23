"use client";
import Card from '@/components/ui/Card';
import { Calendar, Clock, MapPin, Download, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import styles from './Schedule.module.css';

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
    const byDay = new Map();
    const daysOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    for (const c of classes || []) {
      const slots = c.schedule || [];
      for (const s of slots) {
        const day = s.day || 'Unknown';
        const list = byDay.get(day) || [];
        list.push({
          classId: c._id,
          course: c.course_code || c.course_title || c.course_id,
          room: c.room,
          time: `${s.start} - ${s.end}`,
          type: 'Lớp học',
        });
        byDay.set(day, list);
      }
    }
    
    return daysOrder
      .filter(day => byDay.has(day))
      .map(day => ({
        day,
        classes: byDay.get(day).sort((a, b) => String(a.time).localeCompare(String(b.time))),
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
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div>
          <h1>Thời khóa biểu</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Lịch học và địa điểm phòng học hàng tuần của bạn.</p>
        </div>
        <button
          className={styles.exportBtn}
          onClick={exportSchedule}
          disabled={loading || exporting}
        >
          {exporting ? 'Đang xử lý...' : <><Download size={18} /> Xuất PDF</>}
        </button>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="animate-spin" style={{ display: 'inline-block' }}><Clock size={40} color="var(--primary)" /></div>
            <p style={{ marginTop: '1rem', color: 'var(--muted-foreground)' }}>Đang tải thời khóa biểu...</p>
          </div>
        ) : error ? (
          <Card className="glass" style={{ color: '#e11d48', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.05)', textAlign: 'center', padding: '2rem' }}>
            {error}
          </Card>
        ) : grouped.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} style={{ opacity: 0.1 }} />
            <p>Bạn chưa có lịch học nào trong hệ thống cho học kỳ này.</p>
          </div>
        ) : (
          grouped.map((day, dayIdx) => (
            <div key={day.day} className={`${styles.daySection} slide-right`} style={{ animationDelay: `${dayIdx * 0.1}s` }}>
              <h3 className={styles.dayTitle}>
                <Calendar size={20} className={styles.detailIcon} />
                {day.day}
              </h3>
              <div className={styles.grid}>
                {day.classes.map((cls, idx) => (
                  <Card key={idx} className={`${styles.classCard} glass scale-in`} style={{ animationDelay: `${(dayIdx * 0.1) + (idx * 0.05)}s` }}>
                    <div className={styles.classHeader}>
                      <div className={styles.courseCode}>{cls.course}</div>
                      <span className={styles.classType}>{cls.type}</span>
                    </div>
                    <div className={styles.classDetails}>
                      <div className={styles.detailItem}>
                        <Clock size={18} className={styles.detailIcon} />
                        <span>{cls.time}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <MapPin size={18} className={styles.detailIcon} />
                        <span>Phòng: {cls.room}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
