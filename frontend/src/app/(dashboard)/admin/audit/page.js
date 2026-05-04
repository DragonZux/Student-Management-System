"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, User, Activity, Search, Filter, RefreshCw, AlertTriangle, ShieldAlert, FileClock, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import styles from '@/styles/modules/admin/audit.module.css';
import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

function getSeverityInfo(action = '') {
  const lowerAction = String(action).toLowerCase();
  if (lowerAction.includes('delete') || lowerAction.includes('withdraw') || lowerAction.includes('reject') || lowerAction.includes('remove')) {
    return { label: 'Cảnh báo', className: 'badge-warning', iconColor: '#d97706', bgColor: 'rgba(217, 119, 6, 0.1)' };
  }
  if (lowerAction.includes('password') || lowerAction.includes('security') || lowerAction.includes('error') || lowerAction.includes('fail')) {
    return { label: 'Nghiêm trọng', className: 'badge-danger', iconColor: '#e11d48', bgColor: 'rgba(225, 29, 72, 0.1)' };
  }
  return { label: 'Thông tin', className: 'badge-primary', iconColor: 'var(--primary)', bgColor: 'rgba(99, 102, 241, 0.1)' };
}

function formatDateTime(value) {
  if (!value) {
    return { date: '--/--/----', time: '--:--' };
  }
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export default function AuditLogsPage() {
  const {
    data: logs,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh,
  } = usePaginatedData('/admin/audit-logs', { cacheKey: 'audit-logs', initialLimit: 50 });

  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        const input = document.getElementById('audit-search');
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const summary = useMemo(() => {
    const normalizedLogs = logs || [];
    const todayKey = new Date().toDateString();

    return normalizedLogs.reduce((accumulator, log) => {
      const severity = getSeverityInfo(log.action);
      const createdAt = log.created_at ? new Date(log.created_at) : null;
      const isToday = createdAt ? createdAt.toDateString() === todayKey : false;

      accumulator.total += 1;
      if (severity.label === 'Thông tin') accumulator.info += 1;
      if (severity.label === 'Cảnh báo') accumulator.warning += 1;
      if (severity.label === 'Nghiêm trọng') accumulator.critical += 1;
      if (isToday) accumulator.today += 1;
      if (log.actor_role) accumulator.roles.add(log.actor_role);

      return accumulator;
    }, { total: 0, info: 0, warning: 0, critical: 0, today: 0, roles: new Set() });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (logs || []).filter((log) => {
      const severity = getSeverityInfo(log.action).label.toLowerCase();
      const role = String(log.actor_role || '').toLowerCase();
      const action = String(log.action || '').toLowerCase();
      const target = String(log.target_type || '').toLowerCase();
      const actor = String(log.actor_id || '').toLowerCase();

      const matchesQuery = !normalizedQuery || [action, target, actor, role].some((field) => field.includes(normalizedQuery));
      const matchesSeverity = severityFilter === 'all' || severity === severityFilter;
      const matchesRole = roleFilter === 'all' || role === roleFilter;

      return matchesQuery && matchesSeverity && matchesRole;
    });
  }, [logs, query, severityFilter, roleFilter]);

  const severityTabs = [
    { key: 'all', label: 'Tất cả', icon: Eye },
    { key: 'thông tin', label: 'Thông tin', icon: FileClock },
    { key: 'cảnh báo', label: 'Cảnh báo', icon: AlertTriangle },
    { key: 'nghiêm trọng', label: 'Nghiêm trọng', icon: ShieldAlert },
  ];

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set((logs || []).map((log) => String(log.actor_role || '').trim()).filter(Boolean)));
    return ['all', ...roles];
  }, [logs]);

  return (
    <div className={styles.page}>
      <motion.div className={styles.shell} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <header className={styles.hero}>
          <div>
            <div className={styles.kicker}>Audit Center</div>
            <h1 className={styles.title}>Nhật ký hệ thống</h1>
            <p className={styles.subtitle}>Giám sát toàn bộ hoạt động quản trị, bảo mật và sự kiện hệ thống theo thời gian thực.</p>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span>Tổng log</span>
                <strong>{summary.total || total || 0}</strong>
              </div>
              <div className={styles.heroStat}>
                <span>Hôm nay</span>
                <strong>{summary.today}</strong>
              </div>
              <div className={styles.heroStat}>
                <span>Cảnh báo</span>
                <strong>{summary.warning}</strong>
              </div>
              <div className={styles.heroStat}>
                <span>Nghiêm trọng</span>
                <strong>{summary.critical}</strong>
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button type="button" className={styles.refreshButton} onClick={refresh}>
              <RefreshCw size={16} /> Làm mới
            </button>
          </div>
        </header>

        {error && (
          <InlineMessage variant="error" style={{ marginBottom: '1.25rem' }}>
            {error}
          </InlineMessage>
        )}

        <Card className={styles.controlsCard} style={{ padding: 0 }}>
          <div className={styles.controlsRow}>
            <div className={styles.searchWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                id="audit-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo hành động, người thực hiện, loại đối tượng..."
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <Filter size={16} />
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={styles.select}>
                <option value="all">Tất cả vai trò</option>
                {roleOptions.slice(1).map((role) => (
                  <option key={role} value={role.toLowerCase()}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.severityTabs}>
            {severityTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabButton} ${severityFilter === tab.key ? styles.tabButtonActive : ''}`}
                onClick={() => setSeverityFilter(tab.key)}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className={styles.logsCard} style={{ padding: 0 }}>
          <div className={styles.tableHeader}>
            <div>Sự kiện & người thực hiện</div>
            <div>Thời gian</div>
            <div className={styles.severityCol}>Mức độ</div>
          </div>

          <div className={styles.tableBody}>
            {loading ? (
              <div style={{ padding: '2rem' }}>
                <TableSkeleton rows={10} columns={3} />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Activity size={40} />
                </div>
                <p>Không tìm thấy hoạt động phù hợp với bộ lọc hiện tại.</p>
                <button type="button" className={styles.emptyAction} onClick={() => { setQuery(''); setSeverityFilter('all'); setRoleFilter('all'); }}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {filteredLogs.map((log, index) => {
                  const severity = getSeverityInfo(log.action);
                  const { date, time } = formatDateTime(log.created_at);

                  return (
                    <motion.div
                      key={log._id || `${log.action}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={styles.logRow}
                    >
                      <div className={styles.eventInfo}>
                        <div className={styles.iconWrapper} style={{ background: severity.bgColor }}>
                          <Shield size={20} color={severity.iconColor} />
                        </div>
                        <div>
                          <div className={styles.actionTitle}>{log.action}</div>
                          <div className={styles.actorMeta}>
                            <span className={styles.actorChip}><User size={12} /> {log.actor_id || 'Hệ thống'}</span>
                            <span className={styles.separator}>•</span>
                            <span className={styles.actorRole}>{log.actor_role || 'Tự động'}</span>
                            {log.target_type && (
                              <>
                                <span className={styles.separator}>•</span>
                                <span className={styles.targetType}>{log.target_type}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.timeInfo}>
                        <div className={styles.dateRow}><Clock size={15} /> {date}</div>
                        <div className={styles.timeRow}>{time}</div>
                      </div>

                      <div className={styles.severityCol}>
                        <span className={`badge ${severity.className} ${styles.severityBadge}`}>
                          {severity.label.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {!loading && filteredLogs.length > 0 && (
            <div className={styles.paginationWrap}>
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                total={total}
                currentCount={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                showPageSize
              />
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
