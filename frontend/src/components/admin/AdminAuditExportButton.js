"use client";

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AdminAuditExportButton({ className, style }) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setExporting(true);
    setError('');

    try {
      const response = await api.get('/admin/audit-logs');
      const data = JSON.stringify(response.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `system-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      console.error('Failed to generate report:', nextError);
      setError('Không tạo được báo cáo. Vui lòng kiểm tra backend.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {error ? (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: '0.85rem',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            background: 'rgba(244, 63, 94, 0.05)',
            color: '#e11d48',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}
      <button
        className={className}
        onClick={handleGenerateReport}
        disabled={exporting}
        style={style}
      >
        {exporting ? <Loader2 className="animate-spin" size={28} /> : <FileText size={28} />}
        <span>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</span>
      </button>
    </>
  );
}
