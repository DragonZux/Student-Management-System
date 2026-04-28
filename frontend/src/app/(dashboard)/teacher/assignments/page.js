 "use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Plus, FileText, Calendar, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError } from '@/lib/validation';

export default function TeacherAssignmentsPage() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_id: '', title: '', description: '', deadline: '' });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        setError('');
        const [clsRes, asmRes] = await Promise.all([
          api.get('/teacher/my-classes'),
          api.get('/teacher/assignments'),
        ]);
        if (!cancelled) {
          setClasses(clsRes.data || []);
          setAssignments(asmRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load teacher assignments', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách bài tập');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.class_id && classes.length > 0) setForm((p) => ({ ...p, class_id: classes[0]._id }));
  }, [classes, form.class_id]);

  const classById = useMemo(() => {
    const m = new Map();
    for (const c of classes || []) m.set(c._id, c);
    return m;
  }, [classes]);

  const openCreate = () => {
    setFormError('');
    setActionError('');
    setShowForm(true);
    setSelectedAssignment(null);
    setSubmissions([]);
  };

  const create = async () => {
    setFormError('');
    const missing = [];
    if (!form.class_id) missing.push('Lớp học');
    if (!form.title.trim()) missing.push('Tiêu đề');
    if (!form.deadline) missing.push('Hạn nộp');
    if (missing.length > 0) {
      popupValidationError(setFormError, `Vui lòng nhập: ${missing.join(', ')}.`);
      return;
    }
    if (form.title.trim().length < 3) {
      popupValidationError(setFormError, 'Tiêu đề bài tập phải có ít nhất 3 ký tự.');
      return;
    }
    if (String(form.description || '').length > 2000) {
      popupValidationError(setFormError, 'Mô tả tối đa 2000 ký tự.');
      return;
    }
    const deadline = new Date(form.deadline);
    if (Number.isNaN(deadline.getTime())) {
      popupValidationError(setFormError, 'Hạn nộp không hợp lệ.');
      return;
    }
    if (deadline.getTime() <= Date.now()) {
      popupValidationError(setFormError, 'Hạn nộp phải lớn hơn thời điểm hiện tại.');
      return;
    }
    try {
      await api.post(`/teacher/assignments/${form.class_id}`, null, {
        params: {
          title: form.title.trim(),
          description: form.description || '',
          deadline: deadline.toISOString(),
        },
      });
      setShowForm(false);
      setForm({ class_id: classes?.[0]?._id || '', title: '', description: '', deadline: '' });
      await load();
    } catch (e) {
      console.error('Failed to create assignment', e);
      setFormError(e.response?.data?.detail || 'Tạo bài tập thất bại');
    }
  };

  const openSubmissions = async (asm) => {
    setActionError('');
    setSelectedAssignment(asm);
    try {
      const res = await api.get(`/teacher/submissions/${asm._id}`);
      setSubmissions(res.data || []);
    } catch (e) {
      console.error('Failed to load submissions', e);
      setActionError(e.response?.data?.detail || 'Không tải được bài nộp');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Bài tập & học phần</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', 
          background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer',
          fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
        onClick={openCreate}
        >
          <Plus size={18} /> Thêm bài tập
        </button>
      </div>

      <div className="grid grid-cols-1">
        {loading ? <Card className="glass">Đang tải...</Card> : null}
        <InlineMessage variant="error">{error}</InlineMessage>
        <InlineMessage variant="error">{actionError}</InlineMessage>

        {showForm ? (
          <Card className="glass" title="Tạo bài tập">
            <InlineMessage variant="error" style={{ marginBottom: '0.75rem' }}>{formError}</InlineMessage>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Lớp học</label>
                <select value={form.class_id} onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>{c.course_code || 'Course'} - {c.course_title || c.course_id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Hạn nộp</label>
                <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Tiêu đề</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', minHeight: 90 }} />
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button onClick={create} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Tạo</button>
            </div>
          </Card>
        ) : null}

        {selectedAssignment ? (
          <Card className="glass" title={`Submissions: ${selectedAssignment.title}`}>
            {(submissions || []).length === 0 ? (
                <div style={{ padding: '0.5rem' }}>Chưa có bài nộp.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {submissions.map((s) => (
                  <div key={s._id} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Student: {String(s.student_id).slice(0, 8)}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''}</div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{s.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedAssignment(null)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>Đóng</button>
            </div>
          </Card>
        ) : null}

        {assignments.map((asm) => (
          <Card key={asm._id} className="glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--radius)' }}>
                  <FileText color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{asm.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    Lớp: {classById.get(asm.class_id)?.course_code || asm.class_id}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2.5rem', textAlign: 'right' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
                    <Calendar size={14} /> Hạn nộp
                  </div>
                  <div style={{ fontWeight: 600 }}>{asm.deadline ? new Date(asm.deadline).toISOString().slice(0, 10) : '—'}</div>
                </div>
                <button onClick={() => openSubmissions(asm)} style={{ alignSelf: 'center', color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Bài nộp</button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !error && assignments.length === 0 ? <Card className="glass">Chưa có bài tập nào.</Card> : null}
      </div>
    </div>
  );
}
