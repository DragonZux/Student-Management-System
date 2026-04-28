import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Users, ArrowRight, UserPlus, BookPlus } from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';
import AdminAuditExportButton from '@/components/admin/AdminAuditExportButton';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';

export default function AdminDashboard() {
  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Bảng điều khiển Quản trị</h1>
        <p>Hệ thống đang vận hành ổn định. Dưới đây là tóm tắt tình hình hôm nay.</p>
      </header>

      <AdminStatsPanel />

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <Card title="Phím tắt Thao tác" className="scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
            <Link href="/admin/students" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
              <UserPlus size={28} />
              <span>Ghi danh sinh viên</span>
            </Link>
            <Link href="/admin/courses" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
              <BookPlus size={28} />
              <span>Thêm môn học</span>
            </Link>
            <AdminAuditExportButton
              className={styles.actionBtn} 
            />
            <Link href="/admin/teachers" className={styles.actionBtn} style={{ textDecoration: 'none' }}>
              <Users size={28} />
              <span>Quản lý giảng viên</span>
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
