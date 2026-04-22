"use client";
import Sidebar from '@/components/layout/Sidebar';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const role = useMemo(() => {
    if (pathname.startsWith('/teacher')) return 'teacher';
    if (pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/admin')) return 'admin';
    return user?.role || 'admin';
  }, [pathname, user?.role]);

  useEffect(() => {
    if (loading || !user?.role) return;
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      router.replace(`/${user.role}`);
      return;
    }
    if (pathname.startsWith('/teacher') && user.role !== 'teacher') {
      router.replace(`/${user.role}`);
      return;
    }
    if (pathname.startsWith('/student') && user.role !== 'student') {
      router.replace(`/${user.role}`);
    }
  }, [loading, pathname, router, user?.role]);

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <main className="main-content">
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div className="fade-in">
            <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Welcome back,</p>
            <h2 style={{ margin: 0 }}>{user?.full_name || 'User'}</h2>
          </div>
          <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
              {role.toUpperCase()} PORTAL
            </span>
          </div>
        </header>
        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
