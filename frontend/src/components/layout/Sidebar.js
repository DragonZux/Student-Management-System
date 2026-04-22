"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  Users, GraduationCap, BookOpen, Calendar, 
  ClipboardList, Settings, LogOut, LayoutDashboard,
  Building2, Wallet, Bell, FileText, UserCircle, MessageSquare, ClipboardCheck
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = {
  admin: [
    { name: 'Bảng điều khiển', path: '/admin', icon: LayoutDashboard },
    { name: 'Sinh viên', path: '/admin/students', icon: Users },
    { name: 'Giảng viên', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Môn học', path: '/admin/courses', icon: BookOpen },
    { name: 'Lớp học', path: '/admin/classes', icon: Building2 },
    { name: 'Kỳ thi', path: '/exams', icon: ClipboardCheck },
    { name: 'Tài chính', path: '/admin/finance', icon: Wallet },
    { name: 'Nhật ký hệ thống', path: '/admin/audit', icon: FileText },
  ],
  teacher: [
    { name: 'Bảng điều khiển', path: '/teacher', icon: LayoutDashboard },
    { name: 'Điểm danh', path: '/teacher/attendance', icon: ClipboardList },
    { name: 'Bài tập', path: '/teacher/assignments', icon: BookOpen },
    { name: 'Chấm điểm', path: '/teacher/grading', icon: GraduationCap },
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
  const items = navItems[role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <GraduationCap size={32} color="var(--primary)" />
        <span className={styles.logoText}>SMS Việt</span>
      </div>
      
      <nav className={styles.nav}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/notifications" className={styles.navItem}>
          <Bell size={20} />
          <span>Thông báo</span>
        </Link>
        <Link href="/profile" className={styles.navItem}>
          <UserCircle size={20} />
          <span>Hồ sơ</span>
        </Link>
        <button onClick={logout} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
