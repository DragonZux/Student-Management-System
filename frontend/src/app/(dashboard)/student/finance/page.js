"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CreditCard, History, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

import usePaginatedData from '@/hooks/usePaginatedData';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';

export default function StudentFinancePage() {
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  
  const {
    data: payments,
    loading: paymentsLoading,
    total,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    setPageSize,
    refresh: refreshPayments
  } = usePaginatedData('/finance/my-payments', { cacheKey: 'my-payments', initialLimit: 5 });

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const refreshAll = async () => {
    try {
      const invRes = await api.get('/finance/my-tuition');
      setInvoice(invRes.data);
      refreshPayments();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadInvoice = async () => {
      try {
        setInvoiceLoading(true);
        const invRes = await api.get('/finance/my-tuition');
        if (!cancelled) setInvoice(invRes.data);
      } catch (e) {
        if (!cancelled) setInvoice(null);
      } finally {
        if (!cancelled) setInvoiceLoading(false);
      }
    };
    loadInvoice();
    return () => { cancelled = true; };
  }, []);

  const balance = useMemo(() => {
    if (!invoice) return 0;
    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid_amount || 0);
    return Math.max(0, total - paid);
  }, [invoice]);

  const payNow = async () => {
    if (!invoice || balance <= 0) return;
    setPayError('');
    try {
      setPaying(true);
      await api.post('/finance/pay-my-tuition', { amount: balance, method: 'online' });
      await refreshAll();
    } catch (e) {
      setPayError(e.response?.data?.detail || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Học phí & Tài chính</h1>
        <p style={{ fontSize: '1.1rem' }}>Quản lý các khoản phí, thanh toán trực tuyến và xem lịch sử giao dịch.</p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '2.5rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
          {invoiceLoading ? (
            <div style={{ padding: '2rem' }}>
              <div style={{ height: '300px', background: 'var(--border)', borderRadius: '2rem', animation: 'pulse 2s infinite' }} />
            </div>
          ) : (
            <Card className="glass" style={{ 
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
              color: 'white',
              padding: '3rem',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)'
            }}>
              <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
              <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '250px', height: '250px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                  <div>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Số dư cần thanh toán</p>
                    <h1 style={{ margin: '0.75rem 0', fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                      ${balance.toLocaleString()}
                    </h1>
                  </div>
                  <CreditCard size={64} style={{ opacity: 0.4 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', opacity: 0.6, fontWeight: 600, marginBottom: '0.25rem' }}>Trạng thái tài khoản</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: balance > 0 ? '#fbbf24' : '#10b981' }} />
                      <span style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'capitalize' }}>
                        {invoice?.status || 'đã hoàn tất'}
                      </span>
                    </div>
                  </div>

                  <button 
                    style={{ 
                      padding: '1.25rem 2.5rem', borderRadius: '1.25rem', 
                      background: 'white', color: '#0f172a', border: 'none', fontWeight: 800, cursor: 'pointer',
                      fontSize: '1.1rem', transition: 'all 0.3s ease',
                      boxShadow: '0 10px 20px -5px rgba(255,255,255,0.2)'
                    }}
                    disabled={paying || balance <= 0}
                    onClick={payNow}
                    className="input-hover"
                  >
                    {balance <= 0 ? 'Học phí đã hoàn tất' : paying ? 'Đang xử lý...' : 'Thanh toán ngay'}
                  </button>
                </div>
              </div>
            </Card>
          )}

          <InlineMessage variant="error" style={{ marginTop: '2rem' }}>{payError}</InlineMessage>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '1.25rem', marginTop: '2rem', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <AlertCircle color="var(--primary)" size={24} />
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--primary)' }}>
              Lưu ý: Mọi giao dịch thanh toán đều được mã hóa và bảo mật tuyệt đối. 
              Vui lòng liên hệ phòng tài vụ nếu có thắc mắc về hóa đơn.
            </p>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Lịch sử giao dịch</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentsLoading ? (
              <CardSkeleton />
            ) : payments.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
                <p style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Chưa có giao dịch nào.</p>
              </div>
            ) : (
              <>
                {payments.map((p) => (
                  <Card key={p._id || p.id} className="glass card-hover" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '1rem' }}>
                          <History size={20} color="#166534" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{p.method === 'online' ? 'Thanh toán trực tuyến' : 'Nộp tiền mặt'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                            {p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#166534' }}>
                        +${Number(p.amount).toLocaleString()}
                      </div>
                    </div>
                  </Card>
                ))}

                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  total={total}
                  currentCount={payments.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  showPageSize
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
