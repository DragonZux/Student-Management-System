"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Download, TrendingUp, Search, ChevronLeft, ChevronRight, DollarSign, PieChart, History, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isPositiveInteger, popupValidationError } from '@/lib/validation';
import { exportToCSV } from '@/lib/csv';
import styles from '@/styles/modules/admin/finance.module.css';

export default function AdminFinancePage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [paymentForm, setPaymentForm] = useState({ student_id: '', amount: '' });
  const [policyForm, setPolicyForm] = useState({ semester: '', cost_per_credit: '', is_active: true });
  const [editingPolicyId, setEditingPolicyId] = useState(null);

  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, policyId: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [invRes, payRes, studentRes, policyRes] = await Promise.all([
          api.get('/finance/invoices'),
          api.get('/finance/payments'),
          api.get('/admin/users', { params: { role: 'student' } }),
          api.get('/finance/policies'),
        ]);
        if (cancelled) return;
        setInvoices(invRes.data || []);
        setPayments(payRes.data || []);
        // Handle paginated response for students
        const studentData = studentRes.data?.data || studentRes.data || [];
        setStudents(studentData);
        setPolicies(policyRes.data || []);
        setError('');
      } catch (e) {
        console.error('Failed to load admin finance data', e);
        if (!cancelled) {
          setError(e.response?.data?.detail || 'Không tải được dữ liệu tài chính.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students || []) map.set(s._id || s.id, s);
    return map;
  }, [students]);

  const stats = useMemo(() => {
    const totalRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalBilled = (invoices || []).reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
    const totalPaid = (invoices || []).reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);
    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    return { totalRevenue, outstanding, collectionRate };
  }, [invoices, payments]);

  const allTransactions = useMemo(() => {
    return (payments || [])
      .map((p) => {
        const student = studentById.get(p.student_id);
        return {
          id: p._id || p.id,
          student: student?.full_name || p.student_id,
          email: student?.email || '',
          amount: Number(p.amount || 0),
          date: p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : '',
          status: 'Paid',
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, studentById]);

  const filteredTransactions = useMemo(() => {
    const q = txSearch.toLowerCase().trim();
    if (!q) return allTransactions;
    return allTransactions.filter(tx => 
      tx.student.toLowerCase().includes(q) || 
      tx.email.toLowerCase().includes(q)
    );
  }, [allTransactions, txSearch]);

  const totalTxPages = Math.ceil(filteredTransactions.length / txPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (txPage - 1) * txPerPage;
    return filteredTransactions.slice(start, start + txPerPage);
  }, [filteredTransactions, txPage]);

  const refresh = async () => {
    const [invRes, payRes, policyRes] = await Promise.all([
      api.get('/finance/invoices'),
      api.get('/finance/payments'),
      api.get('/finance/policies'),
    ]);
    setInvoices(invRes.data || []);
    setPayments(payRes.data || []);
    setPolicies(policyRes.data || []);
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
      await refresh();
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
      await refresh();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Lưu chính sách học phí thất bại.');
    }
  };

  const deletePolicy = async () => {
    if (!confirmModal.policyId) return;
    try {
      await api.delete(`/finance/policies/${confirmModal.policyId}`);
      setActionMessage('Đã xóa chính sách học phí.');
      await refresh();
    } catch (e) {
      setActionError(e.response?.data?.detail || 'Xóa chính sách học phí thất bại.');
    } finally {
      setConfirmModal({ isOpen: false, policyId: null });
    }
  };

  const exportTransactions = () => {
    exportToCSV(allTransactions, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportPolicies = () => {
    exportToCSV(policies, `tuition-policies-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <div className={styles.headerInfo}>
          <h1>Quản lý Tài chính</h1>
          <p>Giám sát nguồn thu, công nợ và thiết lập chính sách học phí.</p>
        </div>
        <div className={styles.actions}>
          <button onClick={exportTransactions} className={styles.exportBtn}>
            <Download size={18} /> Giao dịch
          </button>
          <button onClick={exportPolicies} className={styles.exportBtn}>
            <Download size={18} /> Chính sách
          </button>
        </div>
      </header>

      <div className={`${styles.statsGrid} slide-right stagger-2`}>
        <Card className="glass">
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Tổng doanh thu</p>
              <h2 className={styles.statValue}>{loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <TrendingUp color="#059669" size={24} />
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Công nợ chưa thu</p>
              <h2 className={styles.statValue} style={{ color: '#e11d48' }}>{loading ? '...' : `$${stats.outstanding.toLocaleString()}`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
              <DollarSign color="#e11d48" size={24} />
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Tỷ lệ thu hồi</p>
              <h2 className={styles.statValue}>{loading ? '...' : `${stats.collectionRate.toFixed(1)}%`}</h2>
            </div>
            <div className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <PieChart color="#2563eb" size={24} />
            </div>
          </div>
        </Card>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error || actionError}</InlineMessage>
      <InlineMessage variant="success" style={{ marginBottom: '1rem' }}>{actionMessage}</InlineMessage>

      <Card 
        title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={20} /> Lịch sử Giao dịch</div>}
        className={`${styles.tableSection} glass slide-right stagger-3`}
        style={{ padding: 0 }}
        headerExtra={
          <div className={styles.searchWrapper} style={{ width: '320px' }}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              className={styles.searchInput}
              type="text" 
              placeholder="Tìm theo tên hoặc email..."
              value={txSearch}
              onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
            />
          </div>
        }
      >
        <div className={styles.tableContainer}>
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
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>Không có dữ liệu giao dịch.</td></tr>
              ) : paginatedTransactions.map((tx, index) => (
                <tr key={tx.id} className={styles.tableRow} style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>
                    <div className={styles.studentName}>{tx.student}</div>
                    <div className={styles.studentEmail}>{tx.email}</div>
                  </td>
                  <td><span className={styles.amount}>${tx.amount.toLocaleString()}</span></td>
                  <td>{tx.date}</td>
                  <td><span className="badge badge-success">Thành công</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={styles.pageBtn} title="Tải biên lai"><Download size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalTxPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}>
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: 700 }}>Trang {txPage} / {totalTxPages}</span>
            <button className={styles.pageBtn} onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages}>
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </Card>

      <div className={styles.formsGrid}>
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={20} /> Ghi nhận Thanh toán</div>} className="glass scale-in" style={{ animationDelay: '0.5s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chọn Sinh viên</label>
              <select 
                className={styles.select}
                value={paymentForm.student_id} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, student_id: e.target.value }))}
              >
                <option value="">-- Chọn sinh viên --</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Số tiền ($)</label>
              <input 
                className={styles.input}
                type="number" min="1" value={paymentForm.amount} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} 
                placeholder="0.00"
                style={{ fontSize: '1.25rem', fontWeight: 800 }}
              />
            </div>
            <button onClick={submitPayment} className="btn-primary" style={{ padding: '1rem', width: '100%', justifyContent: 'center', fontSize: '1.1rem' }}>
              Xác nhận Thanh toán
            </button>
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} /> Chính sách Học phí</div>} className="glass scale-in" style={{ animationDelay: '0.6s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Kỳ học</label>
                <input className={styles.input} value={policyForm.semester} onChange={(e) => setPolicyForm((p) => ({ ...p, semester: e.target.value }))} placeholder="HK2-2024" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phí / Tín chỉ ($)</label>
                <input className={styles.input} type="number" min="1" value={policyForm.cost_per_credit} onChange={(e) => setPolicyForm((p) => ({ ...p, cost_per_credit: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={policyForm.is_active} onChange={(e) => setPolicyForm((p) => ({ ...p, is_active: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem' }} />
                Kích hoạt
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editingPolicyId && <button onClick={startCreatePolicy} className="btn-secondary">Hủy</button>}
                <button onClick={submitPolicy} className="btn-primary">{editingPolicyId ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {policies.map((policy) => (
                <div key={policy._id} className={styles.policyItem}>
                  <div className={styles.policyMeta}>
                    <div className={styles.policyTitle}>{policy.semester}</div>
                    <div className={styles.policyDetails}>
                      ${Number(policy.cost_per_credit).toLocaleString()} / tín chỉ • 
                      <span style={{ color: policy.is_active ? '#059669' : '#e11d48', marginLeft: '0.5rem' }}>
                        {policy.is_active ? 'Đang áp dụng' : 'Ngưng'}
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
        message="Bạn có chắc chắn muốn xóa chính sách học phí này? Hành động này có thể ảnh hưởng đến việc tính toán học phí của sinh viên."
      />
    </div>
  );
}
