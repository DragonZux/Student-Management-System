"use client";

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from '@/styles/modules/layout/shell.module.css';

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const role = useMemo(() => {
    if (pathname.startsWith('/teacher')) return 'teacher';
    if (pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/admin')) return 'admin';
    return user?.role || 'admin';
  }, [pathname, user?.role]);

  const firstName = user?.full_name?.split(' ').pop() || 'Thành viên';

  return (
    <NotificationProvider>
      <div className={styles.shell}>
        <Sidebar role={role} />
        <main className={styles.main}>
          <header className={`${styles.header} animate-in`}>
            <div className={styles.welcomeSection}>
              <div className={styles.statusIndicator}>
                <div className={styles.dot}></div>
                <span className={styles.statusText}>Hệ thống đang trực tuyến</span>
              </div>
              <h2 className={styles.greeting}>Chào buổi sáng, {firstName}</h2>
            </div>

            <div className={styles.actions}>
              <div className={styles.roleBadge}>
                <div className={styles.roleDot}></div>
                <span className={styles.roleText}>
                  CỔNG {role.toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                className={styles.profileButton}
                onClick={() => router.push('/profile')}
                aria-label="Mở hồ sơ cá nhân"
              >
                {(user?.full_name || 'U')[0].toUpperCase()}
              </button>
            </div>
          </header>
          <div className="content-area animate-in" style={{ animationDelay: '0.1s' }}>
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}
