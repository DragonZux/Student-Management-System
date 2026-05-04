"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Download, TrendingUp, Search, DollarSign, PieChart, History, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isPositiveInteger, popupValidationError } from '@/lib/validation';
import { exportToCSV } from '@/lib/csv';
import styles from '@/styles/modules/admin/finance.module.css';

import usePaginatedData from '@/hooks/usePaginatedData';
import { TableSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function AdminFinancePage() {
  const {
    data: payments,
    loading: paymentsLoading,
    error: paymentsError,
    total,
    currentPage: txPage,
    setCurrentPage: setTxPage,
    totalPages: totalTxPages,
    pageSize: txPageSize,
    setPageSize: setTxPageSize,
    refresh: refreshPayments
  } = usePaginatedData('/finance/payments', { cacheKey: 'payments', initialLimit: 10 });

  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depsLoading, setDepsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [paymentForm, setPaymentForm] = useState({ student_id: '', amount: '' });
  const [policyForm, setPolicyForm] = useState({ semester: '', cost_per_credit: '', is_active: true });
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, policyId: null });

  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadDeps() {
      try {
        setDepsLoading(true);
        const [invRes, studentRes, policyRes] = await Promise.all([
          api.get('/finance/invoices?limit=1000'),
          api.get('/admin/users?role=student&limit=1000'),
          api.get('/finance/policies'),
        ]);
        if (cancelled) return;
        setInvoices(invRes.data?.data || invRes.data || []);
        setStudents(studentRes.data?.data || studentRes.data || []);
        setPolicies(policyRes.data?.data || policyRes.data || []);
      } catch (e) {
        if (!cancelled) setError('Không tải được dữ liệu hệ thống.');
      } finally {
        if (!cancelled) setDepsLoading(false);
      }
    }
    loadDeps();
    return () => { cancelled = true; };
  }, []);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students || []) map.set(s._id || s.id, s);
    return map;
  }, [students]);

  const stats = useMemo(() => {
    // We use all invoices for stats calculation
    const totalBilled = (invoices || []).reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
    const totalPaid = (invoices || []).reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);
    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    return { totalRevenue: totalPaid, outstanding, collectionRate };
  }, [invoices]);

  const paginatedTransactions = useMemo(() => {
    return (payments || []).map((p) => {
      const student = studentById.get(p.student_id);
      return {
        id: p._id || p.id,
        student: student?.full_name || p.student_id,
        email: student?.email || '',
        amount: Number(p.amount || 0),
        date: p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : '',
        status: 'Paid',
      };
    });
  }, [payments, studentById]);

  const refreshAll = async () => {
    try {
      const [invRes, policyRes] = await Promise.all([
        api.get('/finance/invoices?limit=1000'),
        api.get('/finance/policies'),
      ]);
      setInvoices(invRes.data?.data || invRes.data || []);
      setPolicies(policyRes.data?.data || policyRes.data || []);
      refreshPayments();
    } catch (e) {
      console.error(e);
    }
  };

  const submitPayment = async () => {
    setActionMessage('');
    setActionError('');
    const amount = Number(paymentForm.amount);
    if (!paymentForm.student_id) return popupValidationError(setActionError, 'Vui lòng chọn sinh viên.');
    if (!isPositiveInteger(amount, 1)) return popupValidationError(setActionError, 'Số tiền phải là số dương.');
    try {
      await api.post(`/finance/update-payment/${paymentForm.student_id}`, null, { params: { amount } });
      setPaymentForm((prev) => ({ ...prev, amount: '' }));
      setActionMessage('Đã ghi nhận thanh toán thành công.');
      await refreshAll();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Ghi nhận thanh toán thất bại.');
    }
  };

  const startCreatePolicy = () => {
    setEditingPolicyId(null);
    setPolicyForm({ semester: '', cost_per_credit: '', is_active: true });
  };

  const startEditPolicy = (policy) => {
    setEditingPolicyId(policy._id);
    setPolicyForm({
      semester: policy.semester || '',
      cost_per_credit: String(policy.cost_per_credit || ''),
      is_active: Boolean(policy.is_active),
    });
  };

  const submitPolicy = async () => {
    setActionMessage('');
    setActionError('');
    const cost = Number(policyForm.cost_per_credit);
    if (!policyForm.semester.trim()) return popupValidationError(setActionError, 'Vui lòng nhập kỳ học.');
    if (!cost || cost <= 0) return popupValidationError(setActionError, 'Chi phí tín chỉ phải lớn hơn 0.');
    try {
      if (editingPolicyId) {
        await api.patch(`/finance/policies/${editingPolicyId}`, {
          semester: policyForm.semester,
          cost_per_credit: cost,
          is_active: Boolean(policyForm.is_active),
        });
        setActionMessage('Đã cập nhật chính sách học phí.');
      } else {
        await api.post('/finance/policies', {
          semester: policyForm.semester,
          cost_per_credit: cost,
          is_active: Boolean(policyForm.is_active),
        });
        setActionMessage('Đã tạo chính sách học phí mới.');
      }
      startCreatePolicy();
      await refreshAll();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Lưu chính sách học phí thất bại.');
    }
  };

  const deletePolicy = async () => {
    if (!confirmModal.policyId) return;
    try {
      await api.delete(`/finance/policies/${confirmModal.policyId}`);
      setActionMessage('Đã xóa chính sách học phí.');
      await refreshAll();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Xóa chính sách học phí thất bại.');
    } finally {
      setConfirmModal({ isOpen: false, policyId: null });
    }
  };

  const exportTransactions = () => {
    exportToCSV(paginatedTransactions, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div>
          <h1>Quản lý Tài chính</h1>
          <p>Giám sát nguồn thu, công nợ và thiết lập chính sách học phí.</p>
        </div>
        <div className={styles.actions}>
          <button onClick={exportTransactions} className={styles.exportBtn}>
            <Download size={18} /> Xuất Giao dịch (CSV)
          </button>
        </div>
      </header>

      <div className={`${styles.statsGrid} slide-right stagger-2`}>
        <Card>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Tổng doanh thu</p>
              <h2 className={styles.statValue}>{(depsLoading || paymentsLoading) ? '...' : `$${stats.totalRevenue.toLocaleString()}`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
              <TrendingUp color="#059669" size={28} />
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Công nợ chưa thu</p>
              <h2 className={styles.statValue} style={{ color: '#f43f5e' }}>{(depsLoading || paymentsLoading) ? '...' : `$${stats.outstanding.toLocaleString()}`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.08)' }}>
              <DollarSign color="#f43f5e" size={28} />
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Tỷ lệ thu hồi</p>
              <h2 className={styles.statValue} style={{ color: 'var(--primary)' }}>{(depsLoading || paymentsLoading) ? '...' : `${stats.collectionRate.toFixed(1)}%`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(var(--primary-rgb), 0.08)' }}>
              <PieChart color="var(--primary)" size={28} />
            </div>
          </div>
        </Card>
      </div>

      {(error || actionError || paymentsError) && <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>{error || actionError || paymentsError}</InlineMessage>}
      {actionMessage && <InlineMessage variant="success" style={{ marginBottom: '2rem' }}>{actionMessage}</InlineMessage>}

      <div className="slide-right stagger-3">
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><History size={20} /> Lịch sử Giao dịch</div>}
          className={styles.tableSection}
          style={{ padding: 0 }}
        >
          <div className={styles.tableContainer}>
            {paymentsLoading ? (
              <div style={{ padding: '2rem' }}><TableSkeleton rows={8} columns={4} /></div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Số tiền</th>
                    <th>Ngày thanh toán</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '6rem', textAlign: 'center', color: 'var(--muted-foreground)', fontWeight: 600 }}>Không có dữ liệu giao dịch trong hệ thống.</td></tr>
                  ) : paginatedTransactions.map((tx, index) => (
                    <tr key={tx.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.studentName}>{tx.student}</div>
                        <div className={styles.studentEmail}>{tx.email}</div>
                      </td>
                      <td><span className={styles.amount}>${tx.amount.toLocaleString()}</span></td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tx.date}</div>
                      </td>
                      <td><span className="badge badge-success" style={{ fontWeight: 800 }}>Thành công</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="action-icon-btn" title="Tải biên lai" style={{ background: 'var(--surface-2)', border: 'none', padding: '0.5rem', borderRadius: '0.5rem' }}><Download size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.pagination}>
            <PaginationControls
              page={txPage}
              totalPages={totalTxPages}
              total={total}
              currentCount={payments.length}
              pageSize={txPageSize}
              onPageChange={setTxPage}
              onPageSizeChange={setTxPageSize}
              showPageSize
            />
          </div>
        </Card>
      </div>

      <div className={`${styles.formsGrid} slide-right stagger-4`}>
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><DollarSign size={20} /> Ghi nhận Thanh toán</div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chọn Sinh viên mục tiêu</label>
              <select 
                className={styles.select}
                value={paymentForm.student_id} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, student_id: e.target.value }))}
                disabled={depsLoading}
              >
                <option value="">-- Chọn sinh viên --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Số tiền quyết toán ($)</label>
              <input 
                className={styles.input}
                type="number" min="1" value={paymentForm.amount} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} 
                placeholder="0.00"
                style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
            <button onClick={submitPayment} className="btn-primary" style={{ padding: '1.15rem', width: '100%', justifyContent: 'center', fontSize: '1.1rem', borderRadius: '1.25rem' }} disabled={depsLoading}>
              Xác nhận & Cập nhật số dư
            </button>
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}><Settings size={20} /> Thiết lập Học phí</div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kỳ học áp dụng</label>
                <input className={styles.input} value={policyForm.semester} onChange={(e) => setPolicyForm((p) => ({ ...p, semester: e.target.value }))} placeholder="Ví dụ: HK2-2024" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Đơn giá / Tín chỉ ($)</label>
                <input className={styles.input} type="number" min="1" value={policyForm.cost_per_credit} onChange={(e) => setPolicyForm((p) => ({ ...p, cost_per_credit: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={policyForm.is_active} onChange={(e) => setPolicyForm((p) => ({ ...p, is_active: e.target.checked }))} style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }} />
                Kích hoạt ngay chính sách này
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {editingPolicyId && <button onClick={startCreatePolicy} className="btn-secondary" style={{ fontWeight: 800 }}>Hủy</button>}
                <button onClick={submitPolicy} className="btn-primary" style={{ fontWeight: 800 }}>{editingPolicyId ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className={styles.formLabel} style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>DANH SÁCH CHÍNH SÁCH ĐÃ LƯU</label>
              {policies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--surface-1)', borderRadius: '1rem', border: '1px dashed var(--border)', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                  Chưa có chính sách học phí nào.
                </div>
              ) : policies.map((policy) => (
                <div key={policy._id} className={styles.policyItem} style={{ borderLeft: policy.is_active ? '4px solid #059669' : '4px solid var(--border)' }}>
                  <div className={styles.policyMeta}>
                    <div className={styles.policyTitle}>{policy.semester}</div>
                    <div className={styles.policyDetails}>
                      <span style={{ fontWeight: 900, color: 'var(--foreground)' }}>${Number(policy.cost_per_credit).toLocaleString()}</span> / tín chỉ • 
                      <span style={{ color: policy.is_active ? '#059669' : '#f43f5e', marginLeft: '0.5rem', fontWeight: 800 }}>
                        {policy.is_active ? 'Đang hiệu lực' : 'Đã ngưng'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.policyActions}>
                    <button onClick={() => startEditPolicy(policy)} className={styles.policyEditBtn}>Sửa</button>
                    <button onClick={() => setConfirmModal({ isOpen: true, policyId: policy._id })} className={styles.policyDeleteBtn}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, policyId: null })}
        onConfirm={deletePolicy}
        title="Xác nhận xóa chính sách"
        message="Hành động này không thể hoàn tác. Các hóa đơn cũ sẽ được giữ nguyên nhưng chính sách này sẽ biến mất khỏi hệ thống."
      />
    </div>
  );
}
