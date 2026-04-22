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
        setStudents(studentRes.data || []);
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
    if (!paymentForm.student_id) {
      popupValidationError(setActionError, 'Vui lòng chọn sinh viên.');
      return;
    }
    if (!isPositiveInteger(amount, 1)) {
      popupValidationError(setActionError, 'Số tiền phải là số dương.');
      return;
    }
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
    if (!policyForm.semester.trim()) {
      popupValidationError(setActionError, 'Vui lòng nhập kỳ học.');
      return;
    }
    if (!cost || cost <= 0) {
      popupValidationError(setActionError, 'Chi phí tín chỉ phải lớn hơn 0.');
      return;
    }
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

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Quản lý Tài chính</h1>
          <p style={{ fontSize: '1.1rem' }}>Giám sát học phí, ghi nhận thanh toán và thiết lập chính sách.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={exportTransactions}
            className="input-hover"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 700, fontSize: '0.875rem' }}
          >
            <Download size={18} /> Xuất Giao dịch
          </button>
          <button 
            onClick={exportPolicies}
            className="input-hover"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 700, fontSize: '0.875rem' }}
          >
            <Download size={18} /> Xuất Chính sách
          </button>
        </div>
      </div>

      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{error || actionError}</InlineMessage>
      <InlineMessage variant="success" style={{ marginBottom: '1rem' }}>{actionMessage}</InlineMessage>

      <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
        <Card className="glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tổng doanh thu</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`}</h2>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '1rem' }}>
              <TrendingUp color="#166534" size={24} />
            </div>
          </div>
        </Card>
        <Card className="glass">
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Công nợ chưa thu</p>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#e11d48' }}>{loading ? '...' : `$${stats.outstanding.toLocaleString()}`}</h2>
          </div>
        </Card>
        <Card className="glass">
          <div>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tỷ lệ thu hồi</p>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>{loading ? '...' : `${stats.collectionRate.toFixed(1)}%`}</h2>
          </div>
        </Card>
      </div>

      <Card 
        title={`Lịch sử Giao dịch`}
        className="glass"
        style={{ padding: 0, overflow: 'hidden', marginBottom: '3rem' }}
        headerExtra={
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc email..."
              value={txSearch}
              onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem' }} 
              className="input-hover"
            />
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Sinh viên</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Số tiền</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Ngày thanh toán</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Trạng thái</th>
                <th style={{ padding: '1.25rem 2rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={{ padding: '4rem', textAlign: 'center' }} colSpan={5}>Đang tải dữ liệu...</td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td style={{ padding: '4rem', textAlign: 'center' }} colSpan={5}>Không có dữ liệu giao dịch.</td>
                </tr>
              ) : paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{tx.student}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{tx.email}</div>
                  </td>
                  <td style={{ padding: '1.25rem 2rem', fontWeight: 800, fontSize: '1.125rem' }}>${tx.amount.toLocaleString()}</td>
                  <td style={{ padding: '1.25rem 2rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>{tx.date}</td>
                  <td style={{ padding: '1.25rem 2rem' }}>
                    <span className="badge badge-success">Thành công</span>
                  </td>
                  <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }} className="input-hover">
                      <Download size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalTxPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.01)' }}>
            <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', cursor: txPage === 1 ? 'not-allowed' : 'pointer', opacity: txPage === 1 ? 0.3 : 1 }} className="input-hover">
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Trang {txPage} / {totalTxPages}</span>
            <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', cursor: txPage === totalTxPages ? 'not-allowed' : 'pointer', opacity: txPage === totalTxPages ? 0.3 : 1 }} className="input-hover">
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <Card title="Ghi nhận Thanh toán" className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Chọn Sinh viên</label>
              <select 
                value={paymentForm.student_id} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, student_id: e.target.value }))} 
                style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '1rem' }}
                className="input-hover"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Số tiền ($)</label>
              <input 
                type="number" 
                min="1" 
                value={paymentForm.amount} 
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} 
                style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '1.25rem', fontWeight: 800 }} 
                className="input-hover"
                placeholder="0.00"
              />
            </div>
            <button 
              onClick={submitPayment} 
              className="btn-primary"
              style={{ padding: '1.125rem', borderRadius: '1.125rem', justifyContent: 'center', fontSize: '1.05rem', fontWeight: 800, marginTop: '0.5rem' }}
            >
              Xác nhận Thanh toán
            </button>
          </div>
        </Card>

        <Card title="Chính sách Học phí" className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Kỳ học</label>
                <input 
                  value={policyForm.semester} 
                  onChange={(e) => setPolicyForm((p) => ({ ...p, semester: e.target.value }))} 
                  placeholder="Ví dụ: HK2-2024"
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)' }} 
                  className="input-hover"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Phí / Tín chỉ ($)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={policyForm.cost_per_credit} 
                  onChange={(e) => setPolicyForm((p) => ({ ...p, cost_per_credit: e.target.value }))} 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--card)' }} 
                  className="input-hover"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={policyForm.is_active} 
                  onChange={(e) => setPolicyForm((p) => ({ ...p, is_active: e.target.checked }))} 
                  style={{ width: '1.125rem', height: '1.125rem' }}
                />
                Kích hoạt chính sách
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editingPolicyId && (
                  <button onClick={startCreatePolicy} className="input-hover" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'transparent', fontWeight: 700 }}>Hủy</button>
                )}
                <button onClick={submitPolicy} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 800 }}>
                  {editingPolicyId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {policies.map((policy) => (
                <div key={policy._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '1.25rem', padding: '1.25rem', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{policy.semester}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                      ${Number(policy.cost_per_credit).toLocaleString()} / tín chỉ • 
                      <span style={{ color: policy.is_active ? '#166534' : '#991b1b', marginLeft: '0.5rem' }}>
                        {policy.is_active ? 'Đang áp dụng' : 'Ngưng'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEditPolicy(policy)} className="input-hover" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>Sửa</button>
                    <button onClick={() => handleDeletePolicyClick(policy._id)} className="input-hover" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48', fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
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
