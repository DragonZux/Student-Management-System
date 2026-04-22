"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

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
    <div>
      <h1>Bảng điểm học tập</h1>
      <p style={{ marginBottom: '2rem' }}>Tạo và tải xuống bảng điểm chính thức của bạn.</p>
      <InlineMessage variant="error" style={{ marginBottom: '1rem' }}>{downloadError}</InlineMessage>

      <div className="grid grid-cols-2">
        <Card title="Bảng điểm chính thức (PDF)" className="glass">
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            Tài liệu này chứa toàn bộ lịch sử học tập, bao gồm các môn học, điểm số và GPA đã tính.
          </p>
          <button className="glass" style={{ 
            width: '100%', padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', 
            borderRadius: 'var(--radius)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
          onClick={download}
          disabled={authLoading || loading || downloading || !user?._id}
          >
            <Download size={18} /> {downloading ? 'Đang tải...' : 'Tải bảng điểm'}
          </button>
        </Card>

        <Card title="Trạng thái" className="glass">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Tổng tín chỉ</span>
              <span style={{ fontWeight: 600 }}>{loading ? '...' : stats.totalCredits}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>GPA hiện tại</span>
              <span style={{ fontWeight: 600 }}>{loading ? '...' : stats.gpa}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Trạng thái xác minh</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#166534', fontWeight: 600 }}>
                <CheckCircle size={14} /> Đã xác minh
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
