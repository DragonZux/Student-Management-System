"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Download, CheckCircle, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './Transcript.module.css';

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
      <header className={styles.header}>
        <h1 className={styles.title}>Bảng điểm học tập</h1>
        <p className={styles.subtitle}>Tạo và tải xuống bảng điểm chính thức của bạn.</p>
      </header>

      {downloadError && (
        <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>
          {downloadError}
        </InlineMessage>
      )}

      <div className={styles.statsGrid}>
        <Card 
          title="Bảng điểm chính thức (PDF)" 
          className="glass"
          headerExtra={<FileText size={20} className="text-primary" />}
        >
          <p className={styles.infoText}>
            Tài liệu này chứa toàn bộ lịch sử học tập, bao gồm các môn học, điểm số và GPA đã tính. 
            Bạn có thể sử dụng bản in này cho các mục đích hành chính chính thức.
          </p>
          <button 
            className={styles.downloadButton}
            onClick={download}
            disabled={authLoading || loading || downloading || !user?._id}
          >
            {downloading ? (
              <>Đang xử lý...</>
            ) : (
              <>
                <Download size={20} />
                Tải xuống bản PDF
              </>
            )}
          </button>
        </Card>

        <Card title="Trạng thái học tập" className="glass">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Tổng tín chỉ tích lũy</span>
              <span className={styles.statValue}>{loading ? '...' : stats.totalCredits}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Điểm trung bình (GPA)</span>
              <span className={styles.statValue}>{loading ? '...' : stats.gpa.toFixed(2)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Trạng thái xác minh</span>
              <span className={styles.statusVerified}>
                <CheckCircle size={16} /> Đã xác minh
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
