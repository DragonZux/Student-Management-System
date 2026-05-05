"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { CreditCard, History, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

import usePaginatedData from '@/hooks/usePaginatedData';
import { CardSkeleton } from '@/components/ui/Skeleton';
import PaginationControls from '@/components/ui/PaginationControls';
import styles from '@/styles/modules/student/finance.module.css';

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
      setPayError(e.response?.data?.detail || 'Thanh toán thất bại. Vui lòng thử lại sau.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1>Học phí & Tài chính</h1>
        <p>Quản lý các khoản phí, thanh toán trực tuyến và theo dõi lịch sử giao dịch minh bạch.</p>
      </header>

      <div className={styles.mainGrid}>
        <div className={`${styles.cardSection} slide-right stagger-2`}>
          {invoiceLoading ? (
            <div style={{ height: '360px', background: 'var(--border)', borderRadius: '2.5rem', animation: 'pulse 2s infinite' }} />
          ) : (
            <div className={styles.premiumCard}>
              <div className={styles.cardBlob1} />
              <div className={styles.cardBlob2} />
              
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <div>
                    <p className={styles.balanceLabel}>Số dư cần thanh toán</p>
                    <h2 className={styles.balanceAmount}>
                      ${balance.toLocaleString()}
                    </h2>
                  </div>
                  <CreditCard size={48} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                </div>

                <div className={styles.cardBottom}>
                  <div className={styles.statusWrapper}>
                    <span className={styles.statusLabel}>Trạng thái tài khoản</span>
                    <div className={styles.statusIndicator}>
                      <div 
                        className={styles.statusDot} 
                        style={{ color: balance > 0 ? '#fbbf24' : '#10b981', backgroundColor: 'currentColor' }} 
                      />
                      <span className={styles.statusText}>
                        {balance > 0 ? 'Chưa hoàn tất' : 'Đã thanh toán đủ'}
                      </span>
                    </div>
                  </div>

                  <button 
                    className={styles.payButton}
                    disabled={paying || balance <= 0}
                    onClick={payNow}
                  >
                    {balance <= 0 ? (
                      <>
                        <CheckCircle2 size={22} />
                        <span>Đã hoàn tất</span>
                      </>
                    ) : paying ? (
                      <span>Đang xử lý...</span>
                    ) : (
                      <>
                        <span>Thanh toán ngay</span>
                        <ArrowUpRight size={22} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {payError && (
            <InlineMessage variant="error" style={{ margin: 0 }}>{payError}</InlineMessage>
          )}
          
          <div className={styles.noticeBox}>
            <div className={styles.historyIcon} style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>
              <AlertCircle size={24} />
            </div>
            <p className={styles.noticeText}>
              <b>Lưu ý quan trọng:</b> Mọi giao dịch thanh toán đều được mã hóa và bảo mật theo tiêu chuẩn quốc tế. 
              Vui lòng giữ lại biên lai điện tử và liên hệ <b>Phòng Kế hoạch Tài chính</b> nếu có bất kỳ sai sót nào.
            </p>
          </div>
        </div>

        <div className={`${styles.historySection} slide-right stagger-3`}>
          <h3 className={styles.historyTitle}>
            <History size={24} color="var(--primary)" />
            Lịch sử giao dịch
          </h3>
          
          <div className={styles.paymentList}>
            {paymentsLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : payments.length === 0 ? (
              <div className={styles.emptyState}>
                <History size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                <p>Chưa có dữ liệu giao dịch nào được ghi nhận.</p>
              </div>
            ) : (
              <>
                {payments.map((p, idx) => (
                  <Card 
                    key={p._id || p.id} 
                    className="glass card-hover"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={styles.paymentItem}>
                      <div className={styles.paymentLeft}>
                        <div className={styles.historyIcon}>
                          <ArrowUpRight size={20} />
                        </div>
                        <div className={styles.paymentInfo}>
                          <div className={styles.paymentMethod}>
                            {p.method === 'online' ? 'Thanh toán trực tuyến' : 'Nộp tiền mặt'}
                          </div>
                          <div className={styles.paymentDate}>
                            {p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN', { 
                              dateStyle: 'medium', 
                              timeStyle: 'short' 
                            }) : 'Không rõ thời gian'}
                          </div>
                        </div>
                      </div>
                      <div className={styles.paymentAmount}>
                        +${Number(p.amount).toLocaleString()}
                      </div>
                    </div>
                  </Card>
                ))}

                <div style={{ marginTop: '1rem' }}>
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

