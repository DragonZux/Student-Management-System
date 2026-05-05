"use client";
import Card from '@/components/ui/Card';
import InlineMessage from '@/components/ui/InlineMessage';
import { Plus, Trophy, Calendar, Clock, Trash2, Edit3, BookOpen, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { popupValidationError, toNumber } from '@/lib/validation';
import usePaginatedData from '@/hooks/usePaginatedData';
import PaginationControls from '@/components/ui/PaginationControls';
import Modal from '@/components/ui/Modal';

export default function TeacherExamsPage() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 90 });
  const [isEditing, setIsEditing] = useState(false);
  const [currentExamId, setCurrentExamId] = useState(null);
  
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewSubmission, setViewSubmission] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const {
    data: exams,
    loading,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    refresh,
  } = usePaginatedData('/exams', { cacheKey: 'teacher_exams', initialLimit: 6 });

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        setError('');
        const clsRes = await api.get('/teacher/my-classes');
        if (!cancelled) {
          setClasses(clsRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load teacher classes', e);
        if (!cancelled) setError(e.response?.data?.detail || 'Không tải được danh sách lớp');
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!form.class_id && classes.length > 0) setForm((p) => ({ ...p, class_id: classes[0]._id }));
  }, [classes, form.class_id]);

  const openCreate = () => {
    setForm({ class_id: classes[0]?._id || '', title: '', description: '', scheduled_at: '', duration_minutes: 90 });
    setIsEditing(false);
    setShowForm(true);
    setFormError('');
    setSelectedExam(null);
  };

  const openEdit = (exam) => {
    setForm({
      class_id: exam.class_id,
      title: exam.title,
      description: exam.description || '',
      scheduled_at: exam.scheduled_at ? new Date(exam.scheduled_at).toISOString().slice(0, 16) : '',
      duration_minutes: exam.duration_minutes
    });
    setCurrentExamId(exam._id);
    setIsEditing(true);
    setShowForm(true);
    setFormError('');
    setSelectedExam(null);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.title.trim()) {
      popupValidationError(setFormError, 'Vui lòng chọn loại kỳ thi.');
      return;
    }
    if (!form.scheduled_at) {
      popupValidationError(setFormError, 'Vui lòng chọn thời gian diễn ra.');
      return;
    }

    // Validation: Check if this type of exam already exists for this class
    if (!isEditing) {
      const alreadyExists = exams.some(e => e.class_id === form.class_id && e.title === form.title);
      if (alreadyExists) {
        popupValidationError(setFormError, `Lớp này đã có bài ${form.title}. Mỗi lớp chỉ được phép có 1 kỳ thi Giữa Kỳ và 1 kỳ thi Cuối Kỳ.`);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        duration_minutes: parseInt(form.duration_minutes),
        scheduled_at: new Date(form.scheduled_at).toISOString()
      };

      if (isEditing) {
        await api.put(`/exams/${currentExamId}`, payload);
      } else {
        await api.post('/exams', payload);
      }
      
      setShowForm(false);
      refresh();
    } catch (e) {
      console.error('Failed to save exam', e);
      setFormError(e.response?.data?.detail || 'Thao tác thất bại');
    }
  };

  const deleteExam = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kỳ thi này?')) return;
    try {
      await api.delete(`/exams/${id}`);
      refresh();
    } catch (e) {
      alert(e.response?.data?.detail || 'Xóa thất bại');
    }
  };

  const openExamGrades = async (exam) => {
    setSelectedExam(exam);
    setShowForm(false);
    setLoadingGrades(true);
    try {
      // Get students in this class
      const res = await api.get(`/teacher/classes/${exam.class_id}/students`);
      const students = res.data?.data || res.data || [];
      
      setStudentGrades(students.map(s => {
        const isMidterm = exam.title.includes('Giữa');
        // Get the specific component score from enrollment record
        const enrollmentScore = isMidterm ? s.enrollment?.score_midterm : s.enrollment?.score_final;
        
        // Also check if there's a score in the exam record itself (backup)
        const examRecordGrade = exam.grades?.find(g => g.student_id === s.student?._id);
        
        const finalDisplayScore = enrollmentScore ?? examRecordGrade?.score ?? '';
        const hasScore = finalDisplayScore !== '' && finalDisplayScore !== null;

        return {
          ...s,
          current_score: finalDisplayScore,
          is_locked: false // Allow editing scores in the Exam context
        };
      }));
    } catch (e) {
      console.error('Failed to load students for grading', e);
      alert('Không tải được danh sách sinh viên');
    } finally {
      setLoadingGrades(false);
    }
  };

  const saveAllGrades = async () => {
    if (!selectedExam) return;
    
    // Prepare grades to save
    const gradesToSave = studentGrades
      .filter(sg => sg.current_score !== '' && sg.current_score !== null && !sg.is_locked)
      .map(sg => ({
        student_id: sg.student?._id,
        score: toNumber(sg.current_score)
      }));

    if (gradesToSave.length === 0) {
      alert('Không có điểm mới nào cần lưu hoặc tất cả đã bị khóa.');
      return;
    }

    try {
      setLoadingGrades(true);
      // 1. Save to Exam Record (Batch)
      await api.post(`/exams/${selectedExam._id}/grades/batch`, gradesToSave);

      // 2. Sync to Enrollments (Parallel)
      const isMidterm = selectedExam.title.includes('Giữa');
      const syncPromises = gradesToSave.map(g => {
        const studentData = studentGrades.find(sg => sg.student?._id === g.student_id);
        if (studentData && !studentData.is_locked) {
          const params = isMidterm ? { score_midterm: g.score } : { score_final: g.score };
          return api.post(`/teacher/grade/${studentData.enrollment._id}`, null, { params });
        }
        return Promise.resolve();
      });

      await Promise.all(syncPromises);

      alert(`Đã cập nhật điểm thành công cho ${gradesToSave.length} sinh viên.`);
      setSelectedExam(null); // Close modal on success
      refresh();
    } catch (e) {
      console.error('Failed to save all grades', e);
      alert(e.response?.data?.detail || 'Lưu điểm hàng loạt thất bại');
    } finally {
      setLoadingGrades(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Quản lý Kỳ thi</h1>
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Thiết lập và chấm điểm các kỳ thi Giữa kỳ & Cuối kỳ.</p>
        </div>
        <button className="btn-primary" style={{ 
          padding: '0.75rem 1.5rem', borderRadius: '1.25rem', 
          display: 'flex', alignItems: 'center', gap: '0.625rem', fontWeight: 800
        }}
        onClick={openCreate}
        >
          <Plus size={20} strokeWidth={3} /> Tạo kỳ thi mới
        </button>
      </div>

      {showForm && (
        <Card title={isEditing ? 'Cập nhật kỳ thi' : 'Thiết lập kỳ thi mới'} style={{ marginBottom: '3rem' }}>
          {formError && <InlineMessage variant="error" style={{ marginBottom: '1.5rem' }}>{formError}</InlineMessage>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lớp học</label>
              <select 
                value={form.class_id} 
                onChange={(e) => setForm((p) => ({ ...p, class_id: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 600 }}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.course_code}: {c.course_title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Thời gian diễn ra</label>
              <input 
                type="datetime-local" 
                value={form.scheduled_at} 
                onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 600 }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Loại kỳ thi</label>
              <select 
                value={form.title} 
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 600 }}
              >
                <option value="">-- Chọn loại kỳ thi --</option>
                <option value="Thi Giữa Kỳ">Thi Giữa Kỳ</option>
                <option value="Thi Cuối Kỳ">Thi Cuối Kỳ</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Thời lượng (phút)</label>
              <input 
                type="number"
                value={form.duration_minutes} 
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 600 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn-secondary" onClick={() => setShowForm(false)} style={{ borderRadius: '1rem', padding: '0.75rem 1.5rem', fontWeight: 700 }}>Hủy</button>
            <button className="btn-primary" onClick={handleSave} style={{ borderRadius: '1rem', padding: '0.75rem 1.5rem', fontWeight: 800 }}>{isEditing ? 'Cập nhật' : 'Tạo kỳ thi'}</button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        title={`Chấm điểm: ${selectedExam?.title} - ${selectedExam?.course_code}`}
        maxWidth="1000px"
      >
        <div style={{ padding: '1rem' }}>
          {loadingGrades ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải danh sách sinh viên...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '1rem', 
                padding: '1rem 1.5rem', background: 'var(--surface-2)', borderRadius: '1rem', 
                fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' 
              }}>
                <div>Sinh viên</div>
                <div>Trạng thái nộp bài</div>
                <div style={{ textAlign: 'center' }}>Điểm (0-10)</div>
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {studentGrades.map((sg) => {
                  const sub = selectedExam?.submissions?.find(sb => sb.student_id === sg.student?._id);
                  return (
                    <div key={sg.student?._id} style={{ 
                      padding: '1.25rem 1.5rem', border: '1px solid var(--border)', borderRadius: '1.25rem',
                      display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', alignItems: 'center', gap: '1rem',
                      background: sg.is_locked ? 'var(--surface-1)' : 'transparent',
                      opacity: sg.is_locked ? 0.7 : 1
                    }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{sg.student?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>ID: {String(sg.student?._id).slice(-8).toUpperCase()}</div>
                      </div>
                      <div>
                        {sub ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <CheckCircle2 size={14} /> Đã nộp bài
                            </span>
                            <button 
                              onClick={() => {
                                setViewSubmission({
                                  student_name: sg.student?.full_name,
                                  content: sub.content,
                                  submitted_at: sub.submitted_at
                                });
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                            >
                              Xem nội dung →
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>Chưa nộp</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <input 
                          type="number"
                          id={`exam-score-${sg.student?._id}`}
                          value={sg.current_score}
                          disabled={!sub || sg.is_locked}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentGrades(prev => prev.map(item => 
                              item.student?._id === sg.student?._id ? { ...item, current_score: val } : item
                            ));
                          }}
                          placeholder={sub ? "—" : "N/A"}
                          style={{ 
                            width: '100px', padding: '0.6rem', borderRadius: '0.85rem', 
                            border: '1px solid var(--border)', textAlign: 'center', fontWeight: 800,
                            opacity: (sub && !sg.is_locked) ? 1 : 0.5, cursor: (sub && !sg.is_locked) ? 'text' : 'not-allowed',
                            background: 'var(--surface-1)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setSelectedExam(null)} style={{ padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 700 }}>Hủy bỏ</button>
            <button 
              className="btn-primary" 
              onClick={saveAllGrades} 
              disabled={loadingGrades}
              style={{ padding: '0.75rem 3rem', borderRadius: '1rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)' }}
            >
              {loadingGrades ? 'Đang lưu...' : 'Lưu tất cả kết quả'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewSubmission}
        onClose={() => setViewSubmission(null)}
        title={`Bài làm của sinh viên: ${viewSubmission?.student_name}`}
        maxWidth="800px"
      >
        <div style={{ padding: '1rem' }}>
          <div style={{ padding: '1.5rem', background: 'var(--surface-1)', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '1rem' }}>Nội dung chi tiết</label>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--foreground)' }}>
              {viewSubmission?.content}
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Clock size={16} /> Nộp lúc: {viewSubmission?.submitted_at ? new Date(viewSubmission.submitted_at).toLocaleString('vi-VN') : '—'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button className="btn-secondary" onClick={() => setViewSubmission(null)} style={{ padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 700 }}>Đóng</button>
          </div>
        </div>
      </Modal>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {exams.map((exam) => (
          <Card key={exam._id} style={{ position: 'relative', overflow: 'hidden', border: selectedExam?._id === exam._id ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '1rem', color: 'var(--primary)' }}>
                  <Trophy size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 850 }}>{exam.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{exam.course_code}: {exam.class_name}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(exam)} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--surface-1)', cursor: 'pointer', color: 'var(--primary)' }}><Edit3 size={16} /></button>
                <button onClick={() => deleteExam(exam._id)} style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--surface-1)', cursor: 'pointer', color: '#e11d48' }}><Trash2 size={16} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                <Calendar size={16} /> {exam.scheduled_at ? new Date(exam.scheduled_at).toLocaleString('vi-VN') : 'Chưa đặt'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                <Clock size={16} /> {exam.duration_minutes} phút
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => openExamGrades(exam)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(var(--primary-rgb), 0.1)', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer' }}
              >
                <BookOpen size={16} /> Chấm điểm ngay
              </button>
              <button 
                className="text-btn" 
                style={{ fontWeight: 800, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                onClick={() => window.location.href = `/teacher/grading?class_id=${exam.class_id}`}
              >
                Tổng kết lớp →
              </button>
            </div>
          </Card>
        ))}
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <PaginationControls
          page={currentPage}
          totalPages={totalPages}
          total={total}
          currentCount={exams.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          showPageSize
        />
      </div>
    </div>
  );
}
