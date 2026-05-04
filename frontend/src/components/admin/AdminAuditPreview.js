"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { History, ArrowRight, Loader2, User, Activity, Clock } from 'lucide-react';
import styles from '@/styles/modules/admin/dashboard.module.css';

export default function AdminAuditPreview() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get('/admin/audit-logs', { params: { limit: 5 } });
        setLogs(res.data?.data || []);
      } catch (e) {
        console.error('Failed to load audit logs preview', e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary opacity-50" size={32} />
      </div>
    );
  }

  return (
    <div className={styles.auditSection}>
      <div className={styles.auditHeader}>
        <h3 className="flex items-center gap-2 font-black text-xl">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <History size={20} />
          </div>
          Hoạt động hệ thống
        </h3>
        <Link href="/admin/audit" prefetch={false} className="btn-text flex items-center gap-2 text-sm font-bold hover-lift">
          Toàn bộ nhật ký <ArrowRight size={14} />
        </Link>
      </div>

      <div className={styles.auditList}>
        <AnimatePresence>
          {logs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-12 text-muted-foreground bg-muted/30 rounded-3xl border border-dashed border-border"
            >
              Chưa có hoạt động nào được ghi nhận.
            </motion.div>
          ) : (
            logs.map((log, idx) => (
              <motion.div 
                key={log._id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 8, backgroundColor: 'var(--card)' }}
                className={styles.auditItem}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-muted rounded-xl text-muted-foreground">
                    <Activity size={18} />
                  </div>
                  <div>
                    <div className={styles.auditAction}>{log.action}</div>
                    <div className={styles.auditMeta}>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <User size={12} className="text-primary" /> {log.actor_role}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} /> {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/50 bg-muted/50 px-2 py-1 rounded-md">
                  {log.target_type || 'system'}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
