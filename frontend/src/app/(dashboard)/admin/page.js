"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { 
  Users, ArrowRight, UserPlus, BookPlus, 
  ShieldCheck, Zap, Database, Search, 
  LayoutGrid, GraduationCap, Globe, 
  Calendar, CreditCard, Bell
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
      {/* Premium Hero Section */}
      <motion.section className={styles.hero} variants={itemVariants}>
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="badge badge-primary bg-white/20 text-white border-white/30 px-6 py-2 mb-6"
          >
            Hệ thống đang trực tuyến
          </motion.div>
          <motion.h1 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Chào buổi sáng, Quản trị viên
          </motion.h1>
          <motion.p
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Hệ thống SMS Việt hiện đang vận hành ở trạng thái tối ưu. 
            Bạn có 4 thông báo mới và 2 yêu cầu phê duyệt đang chờ xử lý.
          </motion.p>
          <motion.div 
            className="flex gap-4 mt-10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <button className="btn-secondary bg-white text-primary font-black px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-xl">
              Báo cáo nhanh
            </button>
            <button className="btn-text text-white font-bold flex items-center gap-2 px-6">
              Xem lịch biểu <Calendar size={20} />
            </button>
          </div>
        </div>
        <motion.div 
          className="hidden xl:block"
          initial={{ scale: 0.5, opacity: 0, rotate: 20 }}
          animate={{ scale: 1, opacity: 0.2, rotate: 0 }}
          transition={{ duration: 1, type: 'spring' }}
        >
          <GraduationCap size={400} strokeWidth={0.5} />
        </motion.div>
      </motion.section>

      <AdminStatsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12">
        {/* Main Content Area */}
        <motion.div className="lg:col-span-8 space-y-10" variants={itemVariants}>
          <Card 
            title={
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <LayoutGrid size={24} />
                </div>
                <span className="text-2xl font-black">Phím tắt Thao tác</span>
              </div>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { href: '/admin/students', icon: UserPlus, label: 'Ghi danh', sub: 'Sinh viên mới' },
                { href: '/admin/teachers', icon: Users, label: 'Giảng viên', sub: 'Hồ sơ nhân sự' },
                { href: '/admin/courses', icon: BookPlus, label: 'Môn học', sub: 'Chương trình đào tạo' },
                { href: '/admin/finance', icon: CreditCard, label: 'Tài chính', sub: 'Quản lý dòng tiền' },
                { href: '/admin/audit', icon: Search, label: 'Audit Log', sub: 'Lịch sử hệ thống' },
                { href: '/admin/withdrawals', icon: ShieldCheck, label: 'Rút môn', sub: 'Duyệt yêu cầu' },
              ].map((btn, i) => (
                <Link key={btn.href} href={btn.href} style={{ textDecoration: 'none' }}>
                  <motion.div 
                    className={styles.actionBtn}
                    whileHover={{ 
                      y: -8, 
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--primary)',
                      boxShadow: 'var(--shadow-xl)' 
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="p-4 bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <btn.icon size={36} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="font-black text-lg">{btn.label}</div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mt-1">{btn.sub}</div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </Card>

          <AdminAuditPreview />
        </motion.div>
        
        {/* Sidebar Info Area */}
        <motion.div className="lg:col-span-4 space-y-10" variants={itemVariants}>
          <Card 
            title={
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Globe size={24} />
                </div>
                <span className="text-2xl font-black">Trạng thái Hạ tầng</span>
              </div>
            }
          >
            <div className={styles.statusCard}>
              {[
                { label: 'Cloud Database', sub: 'MongoDB Atlas - US-East', icon: Database, color: '#22c55e' },
                { label: 'API Edge', sub: 'FastAPI - Vercel Serverless', icon: Zap, color: '#22c55e' },
                { label: 'Security Firewall', sub: 'Cloudflare WAF Active', icon: ShieldCheck, color: 'var(--primary)' },
                { label: 'Notification Hub', sub: 'Pusher WebSocket Active', icon: Bell, color: 'var(--primary)' },
              ].map((status, i) => (
                <motion.div 
                  key={status.label}
                  className={styles.statusItem}
                  whileHover={{ x: 10, backgroundColor: 'var(--muted)' }}
                >
                  <div className={styles.statusLabel}>
                    <div className={styles.statusIndicator} style={{ background: status.color }} />
                    <div className="flex flex-col">
                      <span className="font-black text-base">{status.label}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{status.sub}</span>
                    </div>
                  </div>
                  <status.icon size={20} className="text-muted-foreground opacity-20" />
                </motion.div>
              ))}
              
              <Link href="/admin/audit" className="btn-primary w-full group" style={{ justifyContent: 'center', padding: '1.5rem', marginTop: '1rem', fontWeight: 900, borderRadius: '1.5rem', fontSize: '1.1rem' }}>
                Trung tâm Giám sát 
                <ArrowRight size={24} className="ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </Card>

          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-2xl overflow-hidden relative group p-4">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/40 transition-colors duration-700" />
              <div className="relative z-10 p-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <Zap size={24} className="text-yellow-400" />
                  </div>
                  <span className="text-xl font-black text-white">SMS Pro Plus</span>
                </div>
                <p className="text-sm opacity-70 mb-8 leading-relaxed font-medium">Bạn đang sử dụng phiên bản Quản trị Cao cấp. Mọi hoạt động đều được mã hóa đầu cuối.</p>
                <button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-indigo-500/30">
                  Nâng cấp Hệ thống
                </button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
