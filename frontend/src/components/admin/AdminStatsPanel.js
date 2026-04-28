"use client";

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import api from '@/lib/api';
import { Users, GraduationCap, Building2, Loader2 } from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';

function StatCard({ label, value, loading, icon: Icon, color, bg, className }) {
  return (
    <Card className={className}>
      <div className={styles.statCardContent}>
        <div className={styles.statIconWrapper} style={{ background: bg }}>
          <Icon size={32} color={color} />
        </div>
        <div>
          <p className={styles.statLabel}>{label}</p>
          {loading ? (
            <Loader2 className="animate-spin" size={24} color={color} />
          ) : (
            <h2 className={styles.statValue}>{value || 0}</h2>
          )}
        </div>
      </div>
    </Card>
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
      <InlineMessage variant="warning" style={{ marginBottom: '1.5rem' }}>
        {error}
      </InlineMessage>

      <div className={styles.statsGrid}>
        <StatCard
          label="Sinh viên"
          value={stats?.student}
          loading={loading}
          icon={Users}
          color="var(--primary)"
          bg="rgba(99, 102, 241, 0.1)"
          className="glass slide-right stagger-2"
        />
        <StatCard
          label="Giảng viên"
          value={stats?.teacher}
          loading={loading}
          icon={GraduationCap}
          color="var(--secondary)"
          bg="rgba(168, 85, 247, 0.1)"
          className="glass slide-right stagger-3"
        />
        <StatCard
          label="Môn học"
          value={stats?.courses}
          loading={loading}
          icon={Building2}
          color="var(--accent)"
          bg="rgba(244, 63, 94, 0.1)"
          className="glass slide-right stagger-4"
        />
      </div>
    </>
  );
}
