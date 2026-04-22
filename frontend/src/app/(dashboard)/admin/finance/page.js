"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Download, TrendingUp, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { isPositiveInteger, popupValidationError } from '@/lib/validation';
import { exportToCSV } from '@/lib/csv';

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

  // Search & Filter state for Transactions
  const [txSearch, setTxSearch] = useState('');
  const [txPage, setTxPage] = useState(1);
  const txPerPage = 10;

  // Confirmation Modal state
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
        setStudents(studentRes.data || []);
        setPolicies(policyRes.data || []);
        setError('');
      } catch (e) {
        console.error('Failed to load admin finance data', e);
        if (!cancelled) {
          setInvoices([]);
          setPayments([]);
          setStudents([]);
          setPolicies([]);
          setError(e.response?.data?.detail || 'Không tải được dữ liệu tài chính.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
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
    return {
      totalRevenue,
      outstanding,
      collectionRate,
    };
  }, [invoices, payments]);

  useEffect(() => {
    if (!paymentForm.student_id && students.length > 0) {
      setPaymentForm((prev) => ({ ...prev, student_id: students[0]._id }));
    }
  }, [paymentForm.student_id, students]);

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
      tx.email.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q)
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
    if (!paymentForm.student_id) {
      popupValidationError(setActionError, 'Vui lòng chọn sinh viên.');
      return;
    }
    if (!isPositiveInteger(amount, 1)) {
      popupValidationError(setActionError, 'Số tiền phải là số dương.');
      return;
    }
    try {
      await api.post(`/finance/update-payment/${paymentForm.student_id}`, null, {
        params: { amount },
      });
      setPaymentForm((prev) => ({ ...prev, amount: '' }));
      setActionMessage('Đã ghi nhận thanh toán thành công.');
      await refresh();
    } catch (e) {
      console.error('Failed to update payment', e);
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
    const semester = String(policyForm.semester || '').trim();
    const cost = Number(policyForm.cost_per_credit);
    if (!semester) {
      popupValidationError(setActionError, 'Vui lòng nhập kỳ học.');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      popupValidationError(setActionError, 'Chi phí tín chỉ phải lớn hơn 0.');
      return;
    }
    try {
      if (editingPolicyId) {
        await api.patch(`/finance/policies/${editingPolicyId}`, {
          semester,
          cost_per_credit: cost,
          is_active: Boolean(policyForm.is_active),
        });
        setActionMessage('Đã cập nhật chính sách học phí.');
      } else {
        await api.post('/finance/policies', {
          semester,
          cost_per_credit: cost,
          is_active: Boolean(policyForm.is_active),
        });
        setActionMessage('Đã tạo chính sách học phí mới.');
      }
      startCreatePolicy();
      await refresh();
    } catch (e) {
      console.error('Failed to save fee policy', e);
      setActionError(e.response?.data?.detail || 'Lưu chính sách học phí thất bại.');
    }
  };

  const handleDeletePolicyClick = (policyId) => {
    setConfirmModal({ isOpen: true, policyId });
  };

  const deletePolicy = async () => {
    const policyId = confirmModal.policyId;
    if (!policyId) return;
    try {
      await api.delete(`/finance/policies/${policyId}`);
      setActionMessage('Đã xóa chính sách học phí.');
      await refresh();
    } catch (e) {
      console.error('Failed to delete policy', e);
      setActionError(e.response?.data?.detail || 'Xóa chính sách học phí thất bại.');
    }
  };

  const exportTransactions = () => {
    const data = filteredTransactions.map(tx => ({
      ID: tx.id,
      Student: tx.student,
      Email: tx.email,
      Amount: tx.amount,
      Date: tx.date,
      Status: tx.status
    }));
    exportToCSV(data, 'transactions', ['ID', 'Student', 'Email', 'Amount', 'Date', 'Status']);
  };

  const exportPolicies = () => {
    const data = policies.map(p => ({
      ID: p._id,
      Semester: p.semester,
      CostPerCredit: p.cost_per_credit,
      Active: p.is_active ? 'Yes' : 'No'
    }));
    exportToCSV(data, 'policies', ['ID', 'Semester', 'CostPerCredit', 'Active']);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Quản lý học phí & phí</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={exportTransactions}
            className="glass"
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Download size={16} /> Export Transactions
          </button>
          <button 
            onClick={exportPolicies}
            className="glass"
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <Download size={16} /> Export Policies
          </button>
        </div>
      </div>

      <InlineMessage variant="error" style={{ marginTop: '0.75rem' }}>{error}</InlineMessage>
      <InlineMessage variant="success" style={{ marginTop: '0.75rem' }}>{actionMessage}</InlineMessage>
      <InlineMessage variant="error" style={{ marginTop: '0.75rem' }}>{actionError}</InlineMessage>

      <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Tổng doanh thu</p>
              <h2 style={{ margin: 0 }}>{loading ? '...' : `$${stats.totalRevenue.toFixed(2)}`}</h2>
            </div>
            <TrendingUp color="#166534" />
          </div>
        </Card>
        <Card className="glass">
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Công nợ chưa thu</p>
          <h2 style={{ margin: 0, color: '#991b1b' }}>{loading ? '...' : `$${stats.outstanding.toFixed(2)}`}</h2>
        </Card>
        <Card className="glass">
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Tỷ lệ thu hồi</p>
          <h2 style={{ margin: 0 }}>{loading ? '...' : `${stats.collectionRate.toFixed(1)}%`}</h2>
        </Card>
      </div>

      <Card 
        title={`Giao dịch tài chính (${filteredTransactions.length})`}
        headerExtra={
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Tìm giao dịch..."
              value={txSearch}
              onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }} 
            />
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Sinh viên</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Số tiền</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Ngày</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)' }}>Trạng thái</th>
                <th style={{ padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={{ padding: '1rem' }} colSpan={5}>Đang tải...</td>
                </tr>
              ) : null}
              {!loading && paginatedTransactions.length === 0 ? (
                <tr>
                  <td style={{ padding: '1rem' }} colSpan={5}>Không tìm thấy giao dịch nào.</td>
                </tr>
              ) : null}
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{tx.student}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{tx.email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>${tx.amount.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>{tx.date}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                      background: tx.status === 'Paid' ? '#dcfce7' : '#fef9c3',
                      color: tx.status === 'Paid' ? '#166534' : '#854d0e'
                    }}>{tx.status === 'Paid' ? 'Đã thanh toán' : tx.status}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Download size={16} style={{ cursor: 'pointer', color: 'var(--muted-foreground)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalTxPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: txPage === 1 ? 'not-allowed' : 'pointer', opacity: txPage === 1 ? 0.5 : 1 }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Trang {txPage} / {totalTxPages}</span>
            <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: txPage === totalTxPages ? 'not-allowed' : 'pointer', opacity: txPage === totalTxPages ? 0.5 : 1 }}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2" style={{ marginTop: '2rem' }}>
        <Card title="Ghi nhận thanh toán thủ công" className="glass">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Sinh viên</label>
              <select value={paymentForm.student_id} onChange={(e) => setPaymentForm((p) => ({ ...p, student_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.full_name || s.email} ({s.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Số tiền</label>
              <input type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <button onClick={submitPayment} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Ghi nhận</button>
          </div>
        </Card>

        <Card title="Chính sách học phí" className="glass">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Kỳ học</label>
              <input value={policyForm.semester} onChange={(e) => setPolicyForm((p) => ({ ...p, semester: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Chi phí / tín chỉ</label>
              <input type="number" min="1" value={policyForm.cost_per_credit} onChange={(e) => setPolicyForm((p) => ({ ...p, cost_per_credit: e.target.value }))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={policyForm.is_active} onChange={(e) => setPolicyForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Active
            </label>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
            <button onClick={submitPolicy} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
              {editingPolicyId ? 'Cập nhật policy' : 'Tạo policy'}
            </button>
            {editingPolicyId ? (
              <button onClick={startCreatePolicy} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
                Hủy sửa
              </button>
            ) : null}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {policies.map((policy) => (
              <div key={policy._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{policy.semester}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>${Number(policy.cost_per_credit || 0).toFixed(2)} / credit {policy.is_active ? '(active)' : ''}</div>
                </div>
                <div>
                  <button onClick={() => startEditPolicy(policy)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, marginRight: '0.75rem' }}>Sửa</button>
                  <button onClick={() => handleDeletePolicyClick(policy._id)} style={{ color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Xóa</button>
                </div>
              </div>
            ))}
            {!loading && policies.length === 0 ? <div>Chưa có chính sách học phí nào.</div> : null}
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
