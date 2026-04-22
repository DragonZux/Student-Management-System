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
        <header className="animate-in" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '3rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hệ thống đang trực tuyến</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Chào buổi sáng, {user?.full_name?.split(' ').pop() || 'Thành viên'} 👋</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="glass" style={{ padding: '0.625rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
               <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
               <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '0.02em' }}>
                 CỔNG {role.toUpperCase()}
               </span>
            </div>
            
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '1rem', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.125rem',
              boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
            }}>
              {(user?.full_name || 'U')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
