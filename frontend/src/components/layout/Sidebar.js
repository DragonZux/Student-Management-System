"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { 
  Users, GraduationCap, BookOpen, Calendar, 
  ClipboardList, LogOut, LayoutDashboard,
  Building2, Wallet, Bell, FileText, UserCircle, MessageSquare, ClipboardCheck, Menu, PanelLeftClose, PanelLeftOpen
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
    // restore preference
    try {
      const collapsed = localStorage.getItem('sms:sidebar:collapsed');
      if (collapsed !== null) setIsCollapsed(collapsed === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sms:sidebar:collapsed', isCollapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isCollapsed]);

  const sidebarClassName = useMemo(() => {
    const base = [styles.sidebar];
    if (isCollapsed) base.push(styles.collapsed);
    return base.join(' ');
  }, [isCollapsed]);

  return (
    <aside className={sidebarClassName} aria-label="Main Navigation">
      <div className={styles.logo}>
        <div className={styles.logoLeft}>
          <div className={styles.iconWrapper}>
            <GraduationCap size={28} />
          </div>
          <span className={styles.logoText}>SMS Việt</span>
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          aria-label={isCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
          onClick={() => {
            setIsCollapsed((v) => !v);
          }}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      
      <nav className={styles.nav}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''} slide-right`}
              style={{ animationDelay: `${index * 0.03}s` }}
              title={isCollapsed ? item.name : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className={styles.label}>{item.name}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link 
          href="/notifications" 
          className={`${styles.navItem} ${pathname === '/notifications' ? styles.active : ''}`}
          title={isCollapsed ? 'Thông báo' : undefined}
          aria-label={`Thông báo ${unreadCount > 0 ? `(${unreadCount} chưa đọc)` : ''}`}
        >
          <Bell size={20} />
          <span className={styles.label}>Thông báo</span>
          {unreadCount > 0 ? (
            <span className={styles.notifBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          ) : null}
        </Link>
        <Link 
          href="/profile" 
          className={`${styles.navItem} ${pathname === '/profile' ? styles.active : ''}`}
          title={isCollapsed ? 'Hồ sơ' : undefined}
          aria-label="Hồ sơ người dùng"
        >
          <UserCircle size={20} />
          <span className={styles.label}>Hồ sơ</span>
        </Link>
        <button 
          onClick={logout} 
          className={styles.logoutBtn}
          aria-label="Đăng xuất"
        >
          <LogOut size={20} />
          <span className={styles.label}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
