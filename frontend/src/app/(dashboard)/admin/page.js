"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Users, GraduationCap, Building2, TrendingUp, Plus, FileText, Settings, Loader2, Database, ShieldCheck, Activity } from 'lucide-react';
import api from '@/lib/api';
import styles from './Dashboard.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/admin-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setExporting(true);
    setReportError('');
    try {
      // Fetching audit logs as a sample report
      const response = await api.get('/admin/audit-logs');
      const data = JSON.stringify(response.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setReportError('Không tạo được báo cáo. Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Bảng điều khiển quản trị</h1>
        <p style={{ fontSize: '1.1rem' }}>Chào mừng trở lại. Đây là tình trạng hệ thống hôm nay.</p>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{reportError}</InlineMessage>
      
      <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1rem' }}>
              <Users size={36} color="var(--primary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Sinh viên</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{stats?.students || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '1rem' }}>
              <GraduationCap size={36} color="var(--secondary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Giảng viên</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{stats?.teachers || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '1rem' }}>
              <Building2 size={36} color="var(--accent)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Môn học</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{stats?.courses || 0}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <Card title="Thao tác quản trị">
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            <Link href="/admin/students" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Plus size={24} />
                <span>Ghi danh sinh viên</span>
              </button>
            </Link>
            <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Plus size={24} />
                <span>Thêm môn học</span>
              </button>
            </Link>
            <button 
              className={styles.actionBtn} 
              onClick={handleGenerateReport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="animate-spin" size={24} /> : <FileText size={24} />}
              <span>{exporting ? 'Đang xuất...' : 'Báo cáo hệ thống'}</span>
            </button>
            <Link href="/admin/teachers" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Users size={24} />
                <span>Quản lý nhân sự</span>
              </button>
            </Link>
          </div>
        </Card>
        
        <Card title="Sức khỏe hệ thống">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={styles.statusIndicator} style={{ background: '#22c55e' }} />
                <span style={{ fontWeight: 500 }}>Cơ sở dữ liệu (MongoDB)</span>
              </div>
              <span className="badge badge-success">Ổn định</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={styles.statusIndicator} style={{ background: '#22c55e' }} />
                <span style={{ fontWeight: 500 }}>Cổng API (FastAPI)</span>
              </div>
              <span className="badge badge-success">Ổn định</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={styles.statusIndicator} style={{ background: 'var(--primary)' }} />
                <span style={{ fontWeight: 500 }}>Mã hóa & Bảo mật</span>
              </div>
              <span className="badge badge-primary">An toàn</span>
            </div>
            
            <Link href="/admin/audit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              Xem nhật ký audit đầy đủ →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
