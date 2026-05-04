"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CheckCircle, XCircle, Clock, RefreshCw, Search, BookOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';
import styles from '@/styles/modules/admin/withdrawals.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function AdminWithdrawalsPage() {
  const {
    data: requests,
    loading,
    error,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh
  } = usePaginatedData('/admin/withdrawal-requests', { cacheKey: 'withdrawals' });

  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [approveModal, setApproveModal] = useState({ isOpen: false, id: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null, reason: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAction = async (id, action) => {
    setActionError('');
    try {
      setActionLoading(id);
      if (action === 'approve') {
        await api.post(`/admin/withdrawal-requests/${id}/approve`);
      } else {
        const reason = rejectModal.reason.trim();
        if (reason.length < 5) {
          popupValidationError(setActionError, 'Vui lòng nhập lý do từ chối rõ ràng.');
          return;
        }
        await api.post(`/admin/withdrawal-requests/${id}/reject`, { reason });
      }
      setApproveModal({ isOpen: false, id: null });
      setRejectModal({ isOpen: false, id: null, reason: '' });
      refresh();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = useMemo(() => {
    const total = requests?.length || 0;
    const pending = requests?.filter(r => (r.status || 'pending') === 'pending')?.length || 0;
    const approved = requests?.filter(r => (r.status || 'pending') === 'approved')?.length || 0;
    const rejected = requests?.filter(r => (r.status || 'pending') === 'rejected')?.length || 0;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let filtered = requests || [];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.status || 'pending') === statusFilter);
    }
    
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.student_name || '').toLowerCase().includes(query) ||
        (r.student_email || '').toLowerCase().includes(query) ||
        (r.course_code || '').toLowerCase().includes(query) ||
        (r.course_title || '').toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requests, statusFilter, searchTerm]);

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div>
          <div className={styles.kicker}>Academic Management</div>
          <h1>Duyệt Rút Học Phần</h1>
          <p>Xử lý và phê duyệt các yêu cầu rút học phần từ sinh viên.</p>
        </div>
        <button onClick={refresh} className={styles.refreshBtn}>
          <RefreshCw size={18} /> Làm mới
        </button>
      </header>

      <div className={`${styles.statsGrid} slide-right stagger-2`}>
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Tổng yêu cầu</p>
            <h2 className={styles.statValue}>{loading ? '...' : stats.total}</h2>
          </div>
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.08)' }}>
            <BookOpen color="#6366f1" size={28} />
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Chờ xử lý</p>
            <h2 className={styles.statValue} style={{ color: '#f97316' }}>{loading ? '...' : stats.pending}</h2>
          </div>
          <div className={styles.statIcon} style={{ background: 'rgba(249, 115, 22, 0.08)' }}>
            <Clock color="#f97316" size={28} />
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Đã phê duyệt</p>
            <h2 className={styles.statValue} style={{ color: '#22c55e' }}>{loading ? '...' : stats.approved}</h2>
          </div>
          <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
            <CheckCircle color="#22c55e" size={28} />
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Đã từ chối</p>
            <h2 className={styles.statValue} style={{ color: '#ef4444' }}>{loading ? '...' : stats.rejected}</h2>
          </div>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
            <XCircle color="#ef4444" size={28} />
          </div>
        </div>
      </div>

      {(error || actionError) && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error || actionError}</InlineMessage>}

      <div className={`${styles.filterSection} slide-right stagger-3`}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.tab} ${statusFilter === 'all' ? styles.active : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`${styles.tab} ${statusFilter === 'pending' ? styles.active : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Chờ xử lý
          </button>
          <button
            className={`${styles.tab} ${statusFilter === 'approved' ? styles.active : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Đã phê duyệt
          </button>
          <button
            className={`${styles.tab} ${statusFilter === 'rejected' ? styles.active : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Đã từ chối
          </button>
        </div>
        
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            placeholder="Tìm theo sinh viên, khóa, học phần..."
          />
        </div>
      </div>

      <div className="slide-right stagger-4">
        <Card className={styles.tableSection} style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : filteredRequests.length > 0 ? (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Sinh viên</th>
                      <th>Học phần</th>
                      <th>Lý do</th>
                      <th>Ngày gửi</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => (
                      <tr key={req.enrollment_id} className={styles.tableRow}>
                        <td>
                          <div className={styles.studentName}>
                            <div className={styles.studentAvatar}>
                              {(req.student_name || 'U')[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{req.student_name}</div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                                {req.student_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={styles.courseCode}>{req.course_code}</span>
                            <span style={{ fontWeight: 600 }}>{req.course_title}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.reason || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {req.requested_at ? new Date(req.requested_at).toLocaleDateString('vi-VN') : '—'}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[`status${((req.status || 'pending').charAt(0).toUpperCase() + (req.status || 'pending').slice(1))}`]}`}>
                            {(req.status || 'pending') === 'pending' && <Clock size={14} />}
                            {(req.status || 'pending') === 'approved' && <CheckCircle size={14} />}
                            {(req.status || 'pending') === 'rejected' && <XCircle size={14} />}
                            {(req.status || 'pending') === 'pending' ? 'Chờ xử lý' : (req.status || 'pending') === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons} style={{ justifyContent: 'flex-end' }}>
                            {(req.status || 'pending') === 'pending' && (
                              <>
                                <button
                                  onClick={() => setRejectModal({ isOpen: true, id: req.enrollment_id, reason: '' })}
                                  disabled={actionLoading === req.enrollment_id}
                                  className={styles.rejectBtn}
                                  style={{ ...({ padding: '0.625rem 1rem' }), ...(!!(actionLoading === req.enrollment_id) && { opacity: 0.5 }) }}
                                  title="Từ chối yêu cầu"
                                >
                                  <XCircle size={16} /> Từ chối
                                </button>
                                <button
                                  onClick={() => setApproveModal({ isOpen: true, id: req.enrollment_id })}
                                  disabled={actionLoading === req.enrollment_id}
                                  className={styles.approveBtn}
                                  style={{ ...({ padding: '0.625rem 1rem' }), ...(!!(actionLoading === req.enrollment_id) && { opacity: 0.5 }) }}
                                  title="Phê duyệt yêu cầu"
                                >
                                  <CheckCircle size={16} /> Phê duyệt
                                </button>
                              </>
                            )}
                            {(req.status || 'pending') !== 'pending' && (
                              <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                                Đã xử lý
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                total={total}
                currentCount={filteredRequests.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                showPageSize
              />
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <CheckCircle size={32} color="var(--muted-foreground)" />
              </div>
              <p className={styles.emptyTitle}>Không có yêu cầu nào</p>
              <p className={styles.emptyText}>
                {statusFilter !== 'all' ? `Không có yêu cầu ở trạng thái "${statusFilter === 'pending' ? 'Chờ xử lý' : statusFilter === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối'}"` : 'Không có yêu cầu rút học phần nào.'}
              </p>
            </div>
          )}
        </Card>
      </div>
      <ConfirmModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, id: null })}
        onConfirm={() => handleAction(approveModal.id, 'approve')}
        title="Xác nhận phê duyệt"
        message="Bạn có chắc chắn muốn phê duyệt yêu cầu rút học phần này?"
        confirmText="Phê duyệt"
        variant="primary"
      />
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, id: null, reason: '' })}
        title="Từ chối yêu cầu rút học phần"
        maxWidth="560px"
      >
        <div className="modal-inner">
          {actionError && <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{actionError}</InlineMessage>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontWeight: 800 }}>Lý do từ chối</label>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Nhập lý do để sinh viên biết cần điều chỉnh gì..."
              style={{ minHeight: 120, resize: 'vertical', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', fontFamily: 'inherit', background: 'var(--surface-1)', color: 'var(--foreground)', fontSize: '0.9375rem' }}
            />
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })}
              style={{ padding: '0.875rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--foreground)', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleAction(rejectModal.id, 'reject')}
              style={{ padding: '0.875rem 1.5rem', borderRadius: '1rem', background: '#ef4444', color: 'white', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease', border: 'none' }}
              disabled={actionLoading === rejectModal.id}
            >
              Xác nhận từ chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
