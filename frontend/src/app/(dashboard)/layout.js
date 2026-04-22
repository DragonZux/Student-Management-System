"use client";
import Sidebar from '@/components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [role, setRole] = useState('admin');
  const { user } = useAuth();

  useEffect(() => {
    // Detect role from pathname for demonstration
    if (pathname.startsWith('/admin')) setRole('admin');
    else if (pathname.startsWith('/teacher')) setRole('teacher');
    else if (pathname.startsWith('/student')) setRole('student');
  }, [pathname]);

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
