"use client";

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import api from '@/lib/api';
import { Users, GraduationCap, Wallet, LogOut, Loader2, TrendingUp, BookOpen, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/modules/admin/dashboard.module.css';

function CountUp({ value, isCurrency }) {
  const springValue = useSpring(0, { stiffness: 60, damping: 20 });
  const displayValue = useTransform(springValue, (latest) => {
    if (isCurrency) {
      return Math.floor(latest).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }
    return Math.floor(latest).toLocaleString('vi-VN');
  });

  useEffect(() => {
    springValue.set(value || 0);
  }, [value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
}

function StatCard({ label, value, loading, icon: Icon, color, bg, className, isCurrency, delay, href }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Link href={href || '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card className={`${className} ${styles.statCard} h-full`}>
          <div className={styles.statCardContent}>
            <div className={styles.statIconWrapper} style={{ background: bg }}>
              <Icon size={36} color={color} />
            </div>
            <div className={styles.statMain}>
              <div className={styles.statHeaderRow}>
                <p className={styles.statLabel}>{label}</p>
                {!loading && (
                  <div className={styles.statLinkIcon}>
                    <ArrowUpRight size={18} />
                  </div>
                )}
              </div>
              {loading ? (
                <Loader2 className={`${styles.statLoader} animate-spin`} size={28} color={color} />
              ) : (
                <h2 className={`${styles.statValue} ${isCurrency ? styles.currencyValue : ''}`}>
                  <CountUp value={value} isCurrency={isCurrency} />
                </h2>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function AdminStatsPanel({ initialStats, initialLoading }) {
  const [stats, setStats] = useState(initialStats || null);
  const [loading, setLoading] = useState(initialLoading !== undefined ? initialLoading : true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If stats are provided from parent, sync them
    if (initialStats !== undefined) {
      setStats(initialStats);
      setLoading(initialLoading);
      return;
    }

    let active = true;

    async function loadStats() {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/admin/dashboard-stats', {
          params: { t: Date.now() },
        });

        if (!active) return;
        setStats(response.data || null);
      } catch (nextError) {
        if (!active) return;
        setError(nextError?.response?.data?.detail || 'Không tải được số liệu mới nhất từ database.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [initialStats, initialLoading]);

  return (
    <>
      {error && (
        <InlineMessage variant="warning" style={{ marginBottom: '1.5rem' }}>
          {error}
        </InlineMessage>
      )}

      <div className={styles.statsGrid}>
        <StatCard
          label="Sinh viên"
          value={stats?.student}
          loading={loading}
          icon={Users}
          color="var(--primary)"
          bg="rgba(99, 102, 241, 0.12)"
          className="glass"
          delay={0.1}
          href="/admin/students"
        />
        <StatCard
          label="Giảng viên"
          value={stats?.teacher}
          loading={loading}
          icon={GraduationCap}
          color="var(--secondary)"
          bg="rgba(168, 85, 247, 0.12)"
          className="glass"
          delay={0.2}
          href="/admin/teachers"
        />
        <StatCard
          label="Môn học"
          value={stats?.courses}
          loading={loading}
          icon={BookOpen}
          color="#f59e0b"
          bg="rgba(245, 158, 11, 0.12)"
          className="glass"
          delay={0.3}
          href="/admin/courses"
        />
        <StatCard
          label="Tổng doanh thu"
          value={stats?.total_revenue}
          loading={loading}
          icon={Wallet}
          color="var(--accent)"
          bg="rgba(16, 185, 129, 0.12)"
          className="glass"
          isCurrency={true}
          delay={0.4}
          href="/admin/finance"
        />
        <StatCard
          label="Yêu cầu rút môn"
          value={stats?.pending_withdrawals}
          loading={loading}
          icon={LogOut}
          color="#f43f5e"
          bg="rgba(244, 63, 94, 0.12)"
          className="glass"
          delay={0.5}
          href="/admin/withdrawals"
        />
      </div>
    </>
  );
}
