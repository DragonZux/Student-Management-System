"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import api from '@/lib/api';
import { Users, GraduationCap, Wallet, LogOut, Loader2, TrendingUp, BookOpen } from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';

function StatCard({ label, value, loading, icon: Icon, color, bg, className, isCurrency, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="h-full"
    >
      <Card className={`${className} ${styles.statCard} h-full`}>
        <div className={styles.statCardContent}>
          <div className={styles.statIconWrapper} style={{ background: bg }}>
            <Icon size={36} color={color} />
          </div>
          <div className={styles.statMain}>
            <div className={styles.statHeaderRow}>
              <p className={styles.statLabel}>{label}</p>
              {!loading && <TrendingUp size={18} className={styles.statTrendIcon} />}
            </div>
            {loading ? (
              <Loader2 className={`${styles.statLoader} animate-spin`} size={28} color={color} />
            ) : (
              <h2 className={`${styles.statValue} ${isCurrency ? styles.currencyValue : ''}`}>
                {isCurrency 
                  ? (value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
                  : (value || 0)}
              </h2>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function AdminStatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, []);

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
        />
      </div>
    </>
  );
}
