"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CreditCard, History, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

export default function StudentFinancePage() {
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const refresh = async () => {
    const [invRes, payRes] = await Promise.all([
      api.get('/finance/my-tuition'),
      api.get('/finance/my-payments'),
    ]);
    setInvoice(invRes.data);
    setPayments(payRes.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        console.error('Failed to load finance data', e);
        if (!cancelled) {
          setInvoice(null);
          setPayments([]);
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

  const balance = useMemo(() => {
    if (!invoice) return 0;
    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid_amount || 0);
    return Math.max(0, total - paid);
  }, [invoice]);

  const payNow = async () => {
    if (!invoice) return;
    if (balance <= 0) return;
    setPayError('');
    try {
      setPaying(true);
      await api.post('/finance/pay-my-tuition', { amount: balance, method: 'online' });
      await refresh();
    } catch (e) {
      console.error('Payment failed', e);
      setPayError(e.response?.data?.detail || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <h1>Tuition & Financials</h1>

      <div className="grid grid-cols-1" style={{ marginTop: '2rem' }}>
        <Card className="glass" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
          <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{payError}</InlineMessage>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, opacity: 0.8 }}>Số dư cần thanh toán</p>
              <h1 style={{ margin: '0.5rem 0', fontSize: '3rem' }}>
                {loading ? '...' : `$${balance.toFixed(2)}`}
              </h1>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>
                Trạng thái: {invoice?.status || (loading ? 'đang tải' : 'không rõ')}
              </p>
            </div>
            <CreditCard size={48} opacity={0.2} />
          </div>
          <button style={{ 
            marginTop: '2rem', width: '100%', padding: '1rem', borderRadius: 'var(--radius)', 
            background: 'white', color: '#0f172a', border: 'none', fontWeight: 700, cursor: 'pointer'
          }}
          disabled={loading || paying || balance <= 0}
          onClick={payNow}
          >
            {balance <= 0 ? 'Đã thanh toán' : paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
          </button>
        </Card>

        <div style={{ marginTop: '2.5rem' }}>
          <h3>Lịch sử thanh toán</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {loading ? (
              <Card className="glass">Đang tải...</Card>
            ) : null}
            {!loading && payments.length === 0 ? (
              <Card className="glass">Chưa có khoản thanh toán nào.</Card>
            ) : null}
            {payments.map((p) => (
              <div key={p._id || p.id} style={{ 
                padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '50%' }}>
                    <History size={18} color="#166534" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.method || 'payment'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>${Number(p.amount || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
