"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, GraduationCap, BookOpen, Calendar, 
  ClipboardList, LogOut, LayoutDashboard,
  Building2, Wallet, Bell, FileText, UserCircle, MessageSquare, ClipboardCheck, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import styles from '@/styles/modules/layout/sidebar.module.css';

const navItems = {
  admin: [
    { name: 'Bảng điều khiển', path: '/admin', icon: LayoutDashboard },
    { name: 'Sinh viên', path: '/admin/students', icon: Users },
    { name: 'Giảng viên', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Môn học', path: '/admin/courses', icon: BookOpen },
    { name: 'Lớp học', path: '/admin/classes', icon: Building2 },
    { name: 'Khoa/Bộ môn', path: '/admin/departments', icon: ClipboardList },
    { name: 'Phòng học', path: '/admin/classrooms', icon: Calendar },
    { name: 'Kỳ thi', path: '/exams', icon: ClipboardCheck },
    { name: 'Phản hồi sinh viên', path: '/admin/feedback', icon: MessageSquare },
    { name: 'Duyệt rút học phần', path: '/admin/withdrawals', icon: LogOut },
    { name: 'Tài chính', path: '/admin/finance', icon: Wallet },
    { name: 'Nhật ký hệ thống', path: '/admin/audit', icon: FileText },
  ],
  teacher: [
    { name: 'Bảng điều khiển', path: '/teacher', icon: LayoutDashboard },
    { name: 'Điểm danh', path: '/teacher/attendance', icon: ClipboardList },
    { name: 'Bài tập', path: '/teacher/assignments', icon: BookOpen },
    { name: 'Chấm điểm', path: '/teacher/grading', icon: GraduationCap },
    { name: 'Phản hồi lớp học', path: '/teacher/feedback', icon: MessageSquare },
    { name: 'Kỳ thi', path: '/exams', icon: ClipboardCheck },
  ],
  student: [
    { name: 'Bảng điều khiển', path: '/student', icon: LayoutDashboard },
    { name: 'Đăng ký học', path: '/student/enrollment', icon: Building2 },
    { name: 'Thời khóa biểu', path: '/student/schedule', icon: Calendar },
    { name: 'Bài tập', path: '/student/assignments', icon: BookOpen },
    { name: 'Điểm số', path: '/student/grades', icon: GraduationCap },
    { name: 'Kỳ thi', path: '/exams', icon: ClipboardCheck },
    { name: 'Tài chính', path: '/student/finance', icon: Wallet },
    { name: 'Rút học phần', path: '/student/withdrawal', icon: LogOut },
    { name: 'Bảng điểm', path: '/student/transcript', icon: FileText },
    { name: 'Phản hồi', path: '/student/feedback', icon: MessageSquare },
  ]
};

export default function Sidebar({ role = 'admin' }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const items = useMemo(() => navItems[role] || [], [role]);
  const { unreadCount } = useNotifications();
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    try {
      const collapsed = localStorage.getItem('sms:sidebar:collapsed');
      if (collapsed !== null) setIsCollapsed(collapsed === '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sms:sidebar:collapsed', isCollapsed ? '1' : '0');
    } catch {}
  }, [isCollapsed]);

  return (
    <motion.aside 
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      animate={{ width: isCollapsed ? 100 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={styles.logo}>
        <div className={styles.logoLeft}>
          <motion.div 
            className={styles.iconWrapper}
            whileHover={{ rotate: 0, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap size={28} />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span 
                className={styles.logoText}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                SMS Việt
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      
      <nav className={styles.nav}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Icon size={22} />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span 
                      className={styles.label}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className={styles.activeIndicator}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/notifications" style={{ textDecoration: 'none' }}>
          <motion.div className={`${styles.navItem} ${pathname === '/notifications' ? styles.active : ''}`}>
            <Bell size={22} />
            {!isCollapsed && <span className={styles.label}>Thông báo</span>}
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={styles.notifBadge}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.div>
        </Link>
        
        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <motion.div className={`${styles.navItem} ${pathname === '/profile' ? styles.active : ''}`}>
            <UserCircle size={22} />
            {!isCollapsed && <span className={styles.label}>Hồ sơ</span>}
          </motion.div>
        </Link>

        <motion.button 
          whileHover={{ backgroundColor: '#f43f5e', color: '#fff' }}
          onClick={logout} 
          className={styles.logoutBtn}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className={styles.label}>Đăng xuất</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}
