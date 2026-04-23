"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Users, GraduationCap, Building2, TrendingUp, Plus, FileText, Settings, Loader2, Database, ShieldCheck, Activity, ArrowRight, UserPlus, BookPlus } from 'lucide-react';
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
      setReportError('Không tạo được báo cáo. Vui lòng kiểm tra backend.');
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
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Bảng điều khiển Quản trị</h1>
        <p>Hệ thống đang vận hành ổn định. Dưới đây là tóm tắt tình hình hôm nay.</p>
      </header>

      <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{reportError}</InlineMessage>
      
      <div className={styles.statsGrid}>
        <Card className="glass slide-right stagger-2">
          <div className={styles.statCardContent}>
            <div className={styles.statIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
              <Users size={32} color="var(--primary)" />
            </div>
            <div>
              <p className={styles.statLabel}>Sinh viên</p>
              <h2 className={styles.statValue}>{stats?.students || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass slide-right stagger-3">
          <div className={styles.statCardContent}>
            <div className={styles.statIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
              <GraduationCap size={32} color="var(--secondary)" />
            </div>
            <div>
              <p className={styles.statLabel}>Giảng viên</p>
              <h2 className={styles.statValue}>{stats?.teachers || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass slide-right stagger-4">
          <div className={styles.statCardContent}>
            <div className={styles.statIconWrapper} style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
              <Building2 size={32} color="var(--accent)" />
            </div>
            <div>
              <p className={styles.statLabel}>Môn học</p>
              <h2 className={styles.statValue}>{stats?.courses || 0}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <Card title="Phím tắt Thao tác" className="scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
            <Link href="/admin/students" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <UserPlus size={28} />
                <span>Ghi danh sinh viên</span>
              </button>
            </Link>
            <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <BookPlus size={28} />
                <span>Thêm môn học</span>
              </button>
            </Link>
            <button 
              className={styles.actionBtn} 
              onClick={handleGenerateReport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="animate-spin" size={28} /> : <FileText size={28} />}
              <span>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</span>
            </button>
            <Link href="/admin/teachers" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Users size={28} />
                <span>Quản lý giảng viên</span>
              </button>
            </Link>
          </div>
        </Card>
        
        <Card title="Trạng thái Dịch vụ" className="scale-in" style={{ animationDelay: '0.6s' }}>
          <div className={styles.statusCard}>
            <div className={styles.statusItem}>
              <div className={styles.statusLabel}>
                <div className={styles.statusIndicator} style={{ background: '#22c55e' }} />
                <span style={{ fontWeight: 600 }}>Cơ sở dữ liệu (MongoDB)</span>
              </div>
              <span className="badge badge-success">Ổn định</span>
            </div>
            <div className={styles.statusItem}>
              <div className={styles.statusLabel}>
                <div className={styles.statusIndicator} style={{ background: '#22c55e' }} />
                <span style={{ fontWeight: 600 }}>Cổng API (FastAPI)</span>
              </div>
              <span className="badge badge-success">Ổn định</span>
            </div>
            <div className={styles.statusItem}>
              <div className={styles.statusLabel}>
                <div className={styles.statusIndicator} style={{ background: 'var(--primary)' }} />
                <span style={{ fontWeight: 600 }}>Bảo mật & Mã hóa</span>
              </div>
              <span className="badge badge-primary">An toàn</span>
            </div>
            
            <Link href="/admin/audit" className="btn-primary" style={{ justifyContent: 'center', padding: '1rem', marginTop: '0.5rem', fontWeight: 700 }}>
              Xem nhật ký Audit <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
