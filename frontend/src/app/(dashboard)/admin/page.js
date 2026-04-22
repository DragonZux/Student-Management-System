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
    <div>
      <h1>Tổng quan hệ thống</h1>
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{reportError}</InlineMessage>
      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius)' }}>
              <Users size={32} color="var(--primary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Tổng số sinh viên</p>
              <h2 style={{ margin: 0 }}>{stats?.students || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: 'var(--radius)' }}>
              <GraduationCap size={32} color="var(--secondary)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Tổng số giảng viên</p>
              <h2 style={{ margin: 0 }}>{stats?.teachers || 0}</h2>
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius)' }}>
              <Building2 size={32} color="var(--accent)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Tổng số môn học</p>
              <h2 style={{ margin: 0 }}>{stats?.courses || 0}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2">
        <Card title="Thao tác nhanh">
          <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
            <Link href="/admin/students" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Plus size={20} />
                <span>Ghi danh sinh viên</span>
              </button>
            </Link>
            <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Plus size={20} />
                <span>Thêm môn học</span>
              </button>
            </Link>
            <button 
              className={styles.actionBtn} 
              onClick={handleGenerateReport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              <span>{exporting ? 'Đang xuất...' : 'Báo cáo hệ thống'}</span>
            </button>
            <Link href="/admin/teachers" style={{ textDecoration: 'none' }}>
              <button className={styles.actionBtn}>
                <Users size={20} />
                <span>Quản lý nhân sự</span>
              </button>
            </Link>
          </div>
        </Card>
        
        <Card title="Tình trạng hệ thống">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={18} color="#166534" />
                <span>Trạng thái cơ sở dữ liệu</span>
              </div>
              <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.875rem' }}>ĐANG HOẠT ĐỘNG</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={18} color="#166534" />
                <span>Cổng API</span>
              </div>
              <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.875rem' }}>ỔN ĐỊNH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <span>Hệ thống bảo mật</span>
              </div>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>ĐANG BẬT</span>
            </div>
            <Link href="/admin/audit" style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
              Xem nhật ký gần đây →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
