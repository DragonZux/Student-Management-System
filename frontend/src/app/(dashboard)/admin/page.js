"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import CyberBadge from '@/components/ui/CyberBadge';
import { 
  Users, UserPlus, BookPlus, 
  ShieldCheck, Database, Search, 
  LayoutGrid, ChevronRight, ClipboardList,
  AlertCircle, Server, Lock, Bell, Zap
} from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';
import AdminAuditPreview from '@/components/admin/AdminAuditPreview';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard-stats', {
          params: { t: Date.now() },
        });
        if (!active) return;
        setStats(response.data);
      } catch (error) {
        if (active) {
          console.error('Failed to fetch dashboard stats:', error);
          setStats(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStats();
    return () => { active = false; };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
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

  const actionButtons = [
    { href: '/admin/students', icon: UserPlus, label: 'Add Student', sub: 'Enrollment' },
    { href: '/admin/teachers', icon: Users, label: 'Manage Teachers', sub: 'Staff' },
    { href: '/admin/courses', icon: BookPlus, label: 'Create Course', sub: 'Curriculum' },
    { href: '/admin/finance', icon: Zap, label: 'Finance', sub: 'Transactions' },
    { href: '/admin/audit', icon: ClipboardList, label: 'Audit Log', sub: 'History' },
    { href: '/admin/withdrawals', icon: ShieldCheck, label: 'Withdrawals', sub: 'Pending' },
  ];

  const infrastructure = [
    { label: 'Database', sub: 'MongoDB Atlas', icon: Database, status: 'online' },
    { label: 'API Server', sub: 'FastAPI', icon: Server, status: 'online' },
    { label: 'Security', sub: 'Cloudflare', icon: Lock, status: 'online' },
    { label: 'Notifications', sub: 'Real-time', icon: Bell, status: 'online' },
  ];

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section className={styles.heroSection} variants={itemVariants}>
        <CyberCard variant="terminal" title="ADMIN CONSOLE" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                color: '#00ff88'
              }}>
                System Status: OPERATIONAL
              </h2>
              <p style={{
                color: 'var(--muted-foreground)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem'
              }}>
                SMS ViệtHub running nominally. {loading ? 'Loading...' : `${stats?.unread_notifications || 0} alerts`} pending. {loading ? 'Loading...' : `${stats?.pending_withdrawals || 0} approvals`} required.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <CyberBadge variant="success" size="sm">ONLINE</CyberBadge>
                <CyberBadge variant="accent" size="sm">SECURE</CyberBadge>
                <CyberBadge variant="tertiary" size="sm">OPTIMIZED</CyberBadge>
              </div>
            </div>

            <div style={{
              fontSize: '0.75rem',
              textAlign: 'right',
              fontFamily: '"Share Tech Mono", monospace',
              color: 'var(--muted-foreground)'
            }}>
              <div>UPTIME: 99.98%</div>
              <div>USERS: {stats?.total_users || '---'}</div>
              <div>LOAD: 42%</div>
            </div>
          </div>
        </CyberCard>
      </motion.section>

      {/* Stats Panel */}
      <AdminStatsPanel initialStats={stats} initialLoading={loading} />

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <CyberCard variant="terminal" title="QUICK ACCESS">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {actionButtons.map((btn) => (
                <Link key={btn.href} href={btn.href} prefetch={false} style={{ textDecoration: 'none' }}>
                  <motion.div
                    className={styles.actionBtn}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '1.25rem',
                      background: 'var(--background)',
                      border: '1px solid #00ff88',
                      clip: 'inset(0 0 0 0)',
                      cursor: 'pointer',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 0,
                      position: 'relative'
                    }}
                    onHoverStart={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.3)';
                        e.target.style.background = 'rgba(0, 255, 136, 0.05)';
                      }
                    }}
                    onHoverEnd={(e) => {
                      if (e.target instanceof HTMLElement) {
                        e.target.style.boxShadow = '';
                        e.target.style.background = 'var(--background)';
                      }
                    }}
                  >
                    <btn.icon size={20} color="#00ff88" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#00ff88' }}>
                      {btn.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                      {btn.sub}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </CyberCard>
        </motion.div>

        {/* Infrastructure */}
        <motion.div variants={itemVariants}>
          <CyberCard variant="hud" title="INFRASTRUCTURE">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {infrastructure.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <item.icon size={18} color="#00ff88" />
                    <div>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#00ff88' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  <CyberBadge variant="success" size="sm">
                    {item.status.toUpperCase()}
                  </CyberBadge>
                </div>
              ))}
              <Link href="/admin/audit" prefetch={false} style={{ textDecoration: 'none', marginTop: '1rem' }}>
                <CyberButton size="lg" style={{ width: '100%' }}>
                  Monitoring Center
                </CyberButton>
              </Link>
            </div>
          </CyberCard>
        </motion.div>
      </div>

      {/* Audit Preview */}
      <motion.div variants={itemVariants} style={{ marginTop: '2rem' }}>
        <AdminAuditPreview />
      </motion.div>
    </motion.div>
  );
}
