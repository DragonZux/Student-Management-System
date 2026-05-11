"use client";

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/components/providers/AuthProvider';
import CyberBadge from '@/components/ui/CyberBadge';
import { Zap, LogOut } from 'lucide-react';
import styles from '@/styles/modules/layout/shell.module.css';

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const role = useMemo(() => {
    if (pathname.startsWith('/teacher')) return 'teacher';
    if (pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/admin')) return 'admin';
    return user?.role || 'admin';
  }, [pathname, user?.role]);

  const firstName = user?.full_name?.split(' ').pop() || 'USER';

  const roleConfig = {
    admin: { label: 'ADMIN CONSOLE', color: '#00ff88' },
    teacher: { label: 'TEACHER PORTAL', color: '#00d4ff' },
    student: { label: 'STUDENT HUB', color: '#ff00ff' },
  };

  const config = roleConfig[role] || roleConfig.admin;

  return (
    <div className={styles.shell}>
      <Sidebar role={role} />
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          {/* System Status Line */}
          <div className={styles.statusLine}>
            <div className={styles.statusDot} />
            <span className={styles.statusText}>SYSTEM ONLINE</span>
          </div>

          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h2 className={styles.greeting}>
              {'>'}  Good morning, {firstName.toUpperCase()}
            </h2>
            <p className={styles.timestamp} id="timestamp"></p>
          </div>

          {/* Role Badge and Actions */}
          <div className={styles.actions}>
            <div className={styles.roleBadge} style={{ borderColor: config.color }}>
              <Zap size={16} color={config.color} />
              <span>{config.label}</span>
            </div>

            <button
              type="button"
              className={styles.profileButton}
              onClick={() => router.push('/profile')}
              title="Open Profile"
            >
              {(user?.full_name || 'U')[0].toUpperCase()}
            </button>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={logout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
