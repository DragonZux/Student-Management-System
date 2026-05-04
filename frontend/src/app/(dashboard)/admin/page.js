"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { 
  Users, ArrowRight, UserPlus, BookPlus, 
  ShieldCheck, Zap, Database, Search, 
  LayoutGrid, GraduationCap, Globe, 
  Calendar, CreditCard, Bell, ChevronRight, ClipboardList
} from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';
import AdminAuditPreview from '@/components/admin/AdminAuditPreview';

export default function AdminDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20 }
    }
  };

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.section className={styles.hero} variants={itemVariants}>
        <div className={styles.heroContent}>
          <div className="badge badge-primary bg-white/20 text-white border-white/30 px-5 py-2 mb-4">Hệ thống đang trực tuyến</div>
          <motion.h1 initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>Chào buổi sáng, Quản trị viên</motion.h1>
          <motion.p initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>Hệ thống SMS Việt hoạt động ổn định. Bạn có <strong>4</strong> thông báo và <strong>2</strong> yêu cầu chờ xử lý.</motion.p>

          <div className={styles.heroActions}>
            <Link href="/admin/audit" prefetch={false} className={`${styles.heroAction} ${styles.heroActionPrimary}`} style={{ textDecoration: 'none' }}>
              <Search size={18} /> Trung tâm giám sát
            </Link>
            <Link href="/calendar" prefetch={false} className={`${styles.heroAction} ${styles.heroActionSecondary}`} style={{ textDecoration: 'none' }}>
              <Calendar size={18} /> Xem lịch
            </Link>
            <Link href="/admin/students" prefetch={false} className={`${styles.heroAction} ${styles.heroActionSecondary}`} style={{ textDecoration: 'none' }}>
              <UserPlus size={18} /> Thêm sinh viên
            </Link>
          </div>
        </div>

        <div className="hidden xl:block" aria-hidden>
          <GraduationCap size={220} strokeWidth={0.6} style={{ opacity: 0.18 }} />
        </div>
      </motion.section>

      <AdminStatsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
        <motion.div className="lg:col-span-8 space-y-8" variants={itemVariants}>
          <Card title={<div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-xl text-primary"><LayoutGrid size={20} /></div><span className="text-xl font-black">Phím tắt</span></div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { href: '/admin/students', icon: UserPlus, label: 'Ghi danh', sub: 'Sinh viên mới' },
                { href: '/admin/teachers', icon: Users, label: 'Giảng viên', sub: 'Hồ sơ' },
                { href: '/admin/courses', icon: BookPlus, label: 'Môn học', sub: 'Chương trình' },
                { href: '/admin/finance', icon: CreditCard, label: 'Tài chính', sub: 'Ghi sổ' },
                { href: '/admin/audit', icon: ClipboardList, label: 'Audit', sub: 'Lịch sử' },
                { href: '/admin/withdrawals', icon: ShieldCheck, label: 'Rút môn', sub: 'Duyệt' },
              ].map((btn) => (
                <Link key={btn.href} href={btn.href} prefetch={false} style={{ textDecoration: 'none' }}>
                  <motion.div className={styles.actionBtn} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }}>
                    <div className={styles.actionMeta}>
                      <div className={styles.actionIcon}><btn.icon size={24} className="text-primary" /></div>
                      <div className={styles.actionText}>
                        <div className={styles.actionLabel}>{btn.label}</div>
                        <div className={styles.actionSub}>{btn.sub}</div>
                      </div>
                    </div>
                    <ChevronRight size={18} className={styles.actionArrow} />
                  </motion.div>
                </Link>
              ))}
            </div>
          </Card>

          <AdminAuditPreview />
        </motion.div>

        <motion.div className="lg:col-span-4 space-y-8" variants={itemVariants}>
          <Card title={<div className="flex items-center gap-3"><div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Globe size={18} /></div><span className="text-xl font-black">Hạ tầng</span></div>}>
            <div className={styles.statusCard}>
              {[{ label: 'Cloud DB', sub: 'MongoDB Atlas', icon: Database, color: '#22c55e' },{ label: 'API Edge', sub: 'FastAPI', icon: Zap, color: '#22c55e' },{ label: 'Firewall', sub: 'Cloudflare', icon: ShieldCheck, color: 'var(--primary)' },{ label: 'Notif Hub', sub: 'Pusher', icon: Bell, color: 'var(--primary)' }].map((s) => (
                <div key={s.label} className={styles.statusItem}>
                  <div className={styles.statusLabel}>
                    <div className={styles.statusIndicator} style={{ background: s.color }} />
                    <div className="flex flex-col">
                      <span className="font-black text-base">{s.label}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{s.sub}</span>
                    </div>
                  </div>
                  <s.icon size={18} className="text-muted-foreground opacity-30" />
                </div>
              ))}

              <Link href="/admin/audit" prefetch={false} className="btn-primary w-full group" style={{ justifyContent: 'center', padding: '1rem', marginTop: '1rem', fontWeight: 900, borderRadius: '12px' }}>
                Trung tâm Giám sát <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </Card>

          <Card className={styles.promoCard}>
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={styles.promoBadge}><Zap size={20} className="text-yellow-300" /></div>
                <span className="text-lg font-black text-white">SMS Pro Plus</span>
              </div>
              <p className="text-sm opacity-80 mb-4 leading-relaxed font-medium">Phiên quản trị cao cấp - mã hóa đầu cuối và hỗ trợ SLA 24/7.</p>
              <Link href="/admin/finance" prefetch={false} className={styles.promoButton} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                Nâng cấp
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
