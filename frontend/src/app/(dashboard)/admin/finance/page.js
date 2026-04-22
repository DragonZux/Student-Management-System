"use client";
import Card from '@/components/ui/Card';
import { DollarSign, Download, PieChart, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

export default function AdminFinancePage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [invRes, payRes, studentRes] = await Promise.all([
          api.get('/finance/invoices'),
          api.get('/finance/payments'),
          api.get('/admin/users', { params: { role: 'student' } }),
        ]);
        if (cancelled) return;
        setInvoices(invRes.data || []);
        setPayments(payRes.data || []);
        setStudents(studentRes.data || []);
      } catch (e) {
        console.error('Failed to load admin finance data', e);
        if (!cancelled) {
          setInvoices([]);
          setPayments([]);
          setStudents([]);
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

  const recentPayments = useMemo(() => {
    return (payments || [])
      .slice()
      .sort((a, b) => new Date(b.paid_at || 0).getTime() - new Date(a.paid_at || 0).getTime())
      .slice(0, 20)
      .map((p) => {
        const student = studentById.get(p.student_id);
        const status = 'Paid';
        return {
          id: p._id || p.id,
          student: student?.full_name || p.student_id,
          amount: `$${Number(p.amount || 0).toFixed(2)}`,
          date: p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : '',
          status,
        };
      });
  }, [payments, studentById]);

  return (
    <div>
      <h1>Quản lý học phí & phí</h1>

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

      <Card title="Giao dịch gần đây" footer={
        <button style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Xem tất cả giao dịch</button>
      }>
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
            {!loading && recentPayments.length === 0 ? (
              <tr>
                <td style={{ padding: '1rem' }} colSpan={5}>Chưa có giao dịch nào.</td>
              </tr>
            ) : null}
            {recentPayments.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{tx.student}</td>
                <td style={{ padding: '1rem' }}>{tx.amount}</td>
                <td style={{ padding: '1rem' }}>{tx.date}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                    background: tx.status === 'Paid' ? '#dcfce7' : '#fef9c3',
                    color: tx.status === 'Paid' ? '#166534' : '#854d0e'
                  }}>{tx.status === 'Paid' ? 'Đã thanh toán' : tx.status}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <Download size={16} style={{ cursor: 'pointer' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
