 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Upload, File, CheckCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';

export default function StudentAssignmentsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submittingFor, setSubmittingFor] = useState(null);
  const [content, setContent] = useState('');

  const {
    data: assignments,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    refresh,
  } = usePaginatedData('/student/my-assignments', { cacheKey: 'student_assignments', initialLimit: 6 });

  useEffect(() => {
    let cancelled = false;
    const loadSubmissions = async () => {
      try {
        setSubmissionsLoading(true);
        setSubmissionsError('');
        const response = await api.get('/student/my-submissions', { params: { skip: 0, limit: 1000 } });
        if (!cancelled) {
          setSubmissions(response.data?.data || response.data || []);
        }
      } catch (e) {
        console.error('Failed to load submissions', e);
        if (!cancelled) setSubmissionsError(e.response?.data?.detail || 'Không tải được bài nộp');
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    };
    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, []);

  const submissionByAssignment = useMemo(() => {
    const map = new Map();
    for (const s of submissions || []) map.set(s.assignment_id, s);
    return map;
  }, [submissions]);

  const openSubmit = (asm) => {
    setSubmittingFor(asm);
    setContent('');
    setSubmitError('');
  };

  const submit = async () => {
    if (!submittingFor?._id) return;
    setSubmitError('');
    if (!content.trim()) {
      popupValidationError(setSubmitError, 'Vui lòng nhập nội dung hoặc liên kết bài nộp.');
      return;
    }
    if (content.trim().length < 5) {
      popupValidationError(setSubmitError, 'Nội dung bài nộp phải có ít nhất 5 ký tự.');
      return;
    }
    if (content.trim().length > 5000) {
      popupValidationError(setSubmitError, 'Nội dung bài nộp tối đa 5000 ký tự.');
      return;
    }
    try {
      await api.post(`/student/submit-assignment/${submittingFor._id}`, null, {
        params: { submission_content: content.trim() },
      });
      setSubmittingFor(null);
      refresh();
      const response = await api.get('/student/my-submissions', { params: { skip: 0, limit: 1000 } });
      setSubmissions(response.data?.data || response.data || []);
    } catch (e) {
      console.error('Failed to submit assignment', e);
      setSubmitError(e.response?.data?.detail || 'Gửi bài thất bại');
    }
  };

  return (
    <div>
      <h1>Assignments & Submissions</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {(loading || submissionsLoading) ? <Card className="glass">Đang tải...</Card> : null}
        <InlineMessage variant="error">{error}</InlineMessage>
        <InlineMessage variant="error">{submissionsError}</InlineMessage>

        {submittingFor ? (
          <Card title={`Submit: ${submittingFor.title}`} className="glass" footer={
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setSubmittingFor(null)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
              <button style={{ 
                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--primary)', 
                color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', 
                alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
              onClick={submit}
              >
                <Upload size={18} /> Submit
              </button>
            </div>
          }>
            <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{submitError}</InlineMessage>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Deadline: {submittingFor.deadline ? new Date(submittingFor.deadline).toLocaleString() : '—'}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your solution link or text..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: 120 }}
              />
            </div>
          </Card>
        ) : null}

        {(assignments || []).map((asm) => {
          const sub = submissionByAssignment.get(asm._id);
          const pending = !sub;
          return (
            <Card
              key={asm._id}
              title={asm.title}
              className="glass"
              footer={
                pending ? (
                  <button
                    onClick={() => openSubmit(asm)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius)',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Upload size={18} /> Submit
                  </button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      color: '#166534',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={18} /> Submitted
                  </div>
                )
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <File size={24} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Class: {asm.class_id}</div>
                    <div style={{ fontWeight: 600 }}>{asm.description || '—'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Deadline</div>
                  <div style={{ fontWeight: 600, color: pending ? '#991b1b' : 'inherit' }}>
                    {asm.deadline ? new Date(asm.deadline).toLocaleString() : '—'}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && !error && (assignments || []).length === 0 ? <Card className="glass">Chưa có bài tập nào.</Card> : null}
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          total={total}
          currentCount={assignments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showPageSize
        />
      </div>
    </div>
  );
}
