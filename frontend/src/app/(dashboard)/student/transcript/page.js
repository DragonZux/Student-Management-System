"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Download, CheckCircle, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from '@/styles/modules/student/transcript.module.css';

export default function TranscriptPage() {
  const { user, loading: authLoading } = useAuth();
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?._id) return;
      try {
        setLoading(true);
        const res = await api.get(`/reports/transcript/${user._id}`);
        if (!cancelled) setTranscript(res.data);
      } catch (e) {
        console.error('Failed to load transcript', e);
        if (!cancelled) setTranscript(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const download = async () => {
    if (!user?._id) return;
    try {
      setDownloading(true);
      setDownloadError('');
      const res = await api.get(`/reports/transcript/${user._id}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${user._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download transcript', e);
      setDownloadError(e.response?.data?.detail || 'Tải xuống thất bại');
    } finally {
      setDownloading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      totalCredits: transcript?.total_credits ?? 0,
      gpa: transcript?.cgpa ?? 0,
    };
  }, [transcript]);

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={`${styles.header} slide-right stagger-1`}>
        <h1 className={styles.title}>Bảng điểm Học tập</h1>
        <p className={styles.subtitle}>Tạo và xuất bảng điểm chính thức phục vụ các mục đích hành chính.</p>
      </header>

      {downloadError && (
        <InlineMessage variant="error" style={{ marginBottom: '2rem' }}>
          {downloadError}
        </InlineMessage>
      )}

      <div className={`${styles.statsGrid} slide-right stagger-2`}>
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>Trích xuất Bảng điểm (PDF)</div>}
          headerExtra={<FileText size={20} color="var(--primary)" />}
        >
          <div className="animate-in">
            <p className={styles.infoText}>
              Bản trích xuất chứa toàn bộ lịch sử kết quả học tập từ khi nhập học đến thời điểm hiện tại. 
              Tài liệu này bao gồm danh sách các môn học, số tín chỉ tương ứng, điểm số chi tiết và GPA tích lũy.
            </p>
            <button 
              className={styles.downloadButton}
              onClick={download}
              disabled={authLoading || loading || downloading || !user?._id}
            >
              {downloading ? (
                <>
                  <div className="spinner-sm" />
                  Đang chuẩn bị tài liệu...
                </>
              ) : (
                <>
                  <Download size={22} />
                  Xuất Bảng điểm chính thức
                </>
              )}
            </button>
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>Tóm tắt Tiến độ</div>}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Tổng tín chỉ đã tích lũy</span>
              <span className={styles.statValue}>{loading ? '...' : stats.totalCredits}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Điểm trung bình (CGPA)</span>
              <span className={styles.statValue} style={{ color: 'var(--primary)' }}>{loading ? '...' : stats.gpa.toFixed(2)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Hồ sơ sinh viên</span>
              <span className={styles.statusVerified}>
                <CheckCircle size={18} /> Đã xác thực
              </span>
            </div>
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--surface-1)', borderRadius: '1rem', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 600, fontStyle: 'italic' }}>
              * Bảng điểm điện tử có giá trị tương đương với bản giấy có dấu mộc trong các giao dịch nội bộ.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
