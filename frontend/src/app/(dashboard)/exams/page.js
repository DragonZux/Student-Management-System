import { Calendar, Clock, Award, Trash2, Plus, Edit3, CheckCircle, AlertCircle, FileText, Send } from "lucide-react";
import styles from "@/styles/modules/exams.module.css";
import Modal from "@/components/ui/Modal";

export default function ExamsPage() {
  const { user } = useAuth();
  const [createError, setCreateError] = useState("");
  const [gradeError, setGradeError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    class_id: "",
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 90,
    max_score: 100,
  });

  const [myClasses, setMyClasses] = useState([]);
  const [gradeExam, setGradeExam] = useState(null);
  const [gradeForm, setGradeForm] = useState({ student_id: "", score: "", comments: "" });
  const [takeExam, setTakeExam] = useState(null);
  const [takeForm, setTakeForm] = useState({ content: "" });
  const [takeError, setTakeError] = useState("");

  const {
    data: exams,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    refresh,
  } = usePaginatedData("/exams", { cacheKey: "exams", initialLimit: 6 });

  const canManage = user?.role === "teacher" || user?.role === "admin";

  const loadClasses = useCallback(async () => {
    try {
      if (user?.role === "teacher") {
        const res = await api.get("/teacher/my-classes");
        setMyClasses(res.data || []);
      } else if (user?.role === "admin") {
        const res = await api.get("/admin/classes", { params: { skip: 0, limit: 1000 } });
        setMyClasses(res.data?.data || res.data || []);
      } else {
        setMyClasses([]);
      }
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  }, [user?.role]);

  useEffect(() => {
    async function init() {
      try {
        await loadClasses();
      } catch (e) {
        console.error("Failed to load exams", e);
      }
    }
    init();
  }, [loadClasses]);

  useEffect(() => {
    if (!createForm.class_id && myClasses.length > 0) {
      const firstClassId = myClasses[0]._id || myClasses[0].id;
      if (firstClassId) setCreateForm((p) => ({ ...p, class_id: firstClassId }));
    }
  }, [myClasses, createForm.class_id]);

  const createExam = async () => {
    setCreateError("");
    const missing = [];
    if (!createForm.class_id) missing.push("Lớp học");
    if (!createForm.title.trim()) missing.push("Tiêu đề");
    if (!createForm.scheduled_at) missing.push("Thời gian thi");
    if (missing.length > 0) {
      popupValidationError(setCreateError, `Vui lòng nhập: ${missing.join(", ")}.`);
      return;
    }
    if (Number(createForm.duration_minutes) <= 0 || Number(createForm.max_score) <= 0) {
      popupValidationError(setCreateError, "Thời lượng và điểm tối đa phải lớn hơn 0.");
      return;
    }
    if (!isInRange(createForm.duration_minutes, 15, 600)) {
      popupValidationError(setCreateError, "Thời lượng thi phải trong khoảng 15 đến 600 phút.");
      return;
    }
    if (!isInRange(createForm.max_score, 1, 1000)) {
      popupValidationError(setCreateError, "Điểm tối đa phải trong khoảng 1 đến 1000.");
      return;
    }
    const scheduledAt = new Date(createForm.scheduled_at);
    if (Number.isNaN(scheduledAt.getTime())) {
      popupValidationError(setCreateError, "Thời gian thi không hợp lệ.");
      return;
    }
    try {
      await api.post("/exams", {
        class_id: createForm.class_id,
        title: createForm.title.trim(),
        description: createForm.description || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: Number(createForm.duration_minutes),
        max_score: Number(createForm.max_score),
        grades: [],
      });
      setShowCreate(false);
      setCreateError("");
      setCreateForm({
        class_id: myClasses?.[0]?._id || "",
        title: "",
        description: "",
        scheduled_at: "",
        duration_minutes: 90,
        max_score: 100,
      });
      refresh();
    } catch (e) {
      console.error("Create exam failed", e);
      setCreateError(e.response?.data?.detail || "Tạo kỳ thi thất bại");
    }
  };

  const deleteExam = async (exam) => {
    if (!confirm(`Xóa kỳ thi "${exam.title}"?`)) return;
    setActionError("");
    try {
      await api.delete(`/exams/${exam._id}`);
      refresh();
    } catch (e) {
      console.error("Delete exam failed", e);
      setActionError(e.response?.data?.detail || "Xóa kỳ thi thất bại");
    }
  };

  const openGrade = (exam) => {
    setGradeExam(exam);
    setGradeError("");
    setGradeForm({ student_id: "", score: "", comments: "" });
  };

  const selectStudentToGrade = (submission) => {
    setGradeForm({
      student_id: submission.student_id,
      score: "",
      comments: ""
    });
  };

  const submitGrade = async () => {
    if (!gradeExam?._id) return;
    setGradeError("");
    if (!gradeForm.student_id.trim() || gradeForm.score === "") {
      popupValidationError(setGradeError, "Vui lòng nhập mã sinh viên và điểm.");
      return;
    }
    const score = toNumber(gradeForm.score, -1);
    if (score < 0) {
      popupValidationError(setGradeError, "Điểm không hợp lệ.");
      return;
    }
    const maxScore = Number(gradeExam.max_score || 100);
    if (!isInRange(score, 0, maxScore)) {
      popupValidationError(setGradeError, `Điểm phải trong khoảng 0 đến ${maxScore}.`);
      return;
    }
    try {
      await api.post(`/exams/${gradeExam._id}/grades`, {
        student_id: gradeForm.student_id.trim(),
        score,
        comments: gradeForm.comments || null,
      });
      setGradeExam(null);
      setGradeError("");
      refresh();
    } catch (e) {
      console.error("Record grade failed", e);
      setGradeError(e.response?.data?.detail || "Ghi điểm thất bại");
    }
  };

  const submitTake = async () => {
    if (!takeExam?._id) return;
    setTakeError("");
    if (!takeForm.content.trim()) {
      popupValidationError(setTakeError, "Vui lòng nhập nội dung bài làm.");
      return;
    }
    try {
      await api.post(`/exams/${takeExam._id}/submit`, {
        content: takeForm.content.trim(),
      });
      setTakeExam(null);
      setTakeForm({ content: "" });
      setTakeError("");
      refresh();
      alert("Nộp bài thi thành công!");
    } catch (e) {
      console.error("Submit exam failed", e);
      setTakeError(e.response?.data?.detail || "Nộp bài thi thất bại");
    }
  };

  const sorted = useMemo(() => {
    return (exams || [])
      .slice()
      .sort((a, b) => new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime());
  }, [exams]);

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Quản lý Kỳ thi</h1>
          <p>Lịch thi, bài làm và hệ thống chấm điểm trực tuyến.</p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary slide-right stagger-2"
          >
            <Plus size={18} /> Tạo kỳ thi mới
          </button>
        )}
      </header>

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Thiết lập kỳ thi mới"
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: "2rem" }}>{createError}</InlineMessage>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <div className={styles.formField}>
                <label>Lớp học mục tiêu</label>
                <select
                  value={createForm.class_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, class_id: e.target.value }))}
                >
                  <option value="">-- Chọn lớp học --</option>
                  {myClasses.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.course_code || "Môn học"}: {c.course_title || c.course_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formField}>
              <label>Thời gian thi</label>
              <input
                type="datetime-local"
                value={createForm.scheduled_at}
                onChange={(e) => setCreateForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              />
            </div>
            <div className={styles.formField}>
              <label>Thời lượng (phút)</label>
              <input
                type="number"
                min="1"
                value={createForm.duration_minutes}
                onChange={(e) => setCreateForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              />
            </div>
            <div className={styles.fullWidth}>
              <div className={styles.formField}>
                <label>Tiêu đề kỳ thi</label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ví dụ: Kiểm tra giữa kỳ môn Giải tích"
                />
              </div>
            </div>
            <div className={styles.fullWidth}>
              <div className={styles.formField}>
                <label>Mô tả & Hướng dẫn</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Nhập hướng dẫn làm bài cho sinh viên..."
                  style={{ minHeight: 120 }}
                />
              </div>
            </div>
            <div className={styles.formField}>
              <label>Thang điểm tối đa</label>
              <input
                type="number"
                min="1"
                value={createForm.max_score}
                onChange={(e) => setCreateForm((p) => ({ ...p, max_score: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowCreate(false)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={createExam} className="btn-primary">Phát hành kỳ thi</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!gradeExam}
        onClose={() => setGradeExam(null)}
        title={`Chấm điểm: ${gradeExam?.title}`}
        maxWidth="800px"
      >
        <div className="modal-inner">
          <InlineMessage variant="error" style={{ marginBottom: "2rem" }}>{gradeError}</InlineMessage>
          <div className={styles.formGrid}>
            {gradeExam?.submissions?.length > 0 && !gradeForm.student_id && (
              <div className={styles.fullWidth}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, marginBottom: "1rem", color: "var(--muted-foreground)" }}>CHỌN BÀI LÀM ĐÃ NỘP:</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {gradeExam.submissions.map(s => (
                    <button 
                      key={s.student_id} 
                      onClick={() => selectStudentToGrade(s)}
                      style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem", background: "var(--surface-1)", color: "var(--primary)", border: "1px solid var(--border)", borderRadius: "0.85rem", fontWeight: 800, cursor: "pointer" }}
                    >
                      {s.student_id.split("-")[0]}... ({new Date(s.submitted_at).toLocaleTimeString()})
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.formField}>
              <label>Mã sinh viên</label>
              <input
                value={gradeForm.student_id}
                onChange={(e) => setGradeForm((p) => ({ ...p, student_id: e.target.value }))}
                placeholder="Ví dụ: SV12345"
              />
            </div>
            <div className={styles.formField}>
              <label>Điểm đạt được</label>
              <input
                value={gradeForm.score}
                onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                placeholder={`0 - ${gradeExam?.max_score}`}
              />
            </div>
            <div className={styles.fullWidth}>
              <div className={styles.formField}>
                <label>Nhận xét giảng viên</label>
                <textarea
                  value={gradeForm.comments}
                  onChange={(e) => setGradeForm((p) => ({ ...p, comments: e.target.value }))}
                  placeholder="Phản hồi về bài làm của sinh viên..."
                  style={{ minHeight: 100 }}
                />
              </div>
            </div>
            {gradeForm.student_id && gradeExam?.submissions?.find(s => s.student_id === gradeForm.student_id) && (
              <div className={styles.submissionPreview}>
                <span className={styles.previewLabel}>NỘI DUNG BÀI LÀM CỦA SINH VIÊN</span>
                <div className={styles.previewContent}>
                  {gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).content}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginTop: "2rem", fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                  📅 Nộp lúc: {new Date(gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).submitted_at).toLocaleString('vi-VN')}
                </div>
              </div>
            )}
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setGradeExam(null)} className="btn-secondary" style={{ padding: '0.875rem 1.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--surface-1)', fontWeight: 700, cursor: 'pointer' }}>Hủy bỏ</button>
            <button onClick={submitGrade} className="btn-primary">Xác nhận ghi điểm</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!takeExam}
        onClose={() => setTakeExam(null)}
        title={`Làm bài thi: ${takeExam?.title}`}
        maxWidth="1000px"
      >
        <div className={styles.takeExamArea}>
          <InlineMessage variant="error" style={{ marginBottom: "2rem" }}>{takeError}</InlineMessage>
          <div className={styles.takeExamHeader}>
            <p style={{ fontSize: "1.1rem", color: "var(--foreground)", marginBottom: "1.5rem", lineHeight: "1.6", fontWeight: 500 }}>{takeExam?.description || "Hãy thực hiện bài thi theo yêu cầu của giảng viên."}</p>
            <div style={{ display: "flex", gap: "1rem" }}>
               <span className="badge badge-primary" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 800 }}>Điểm tối đa: {takeExam?.max_score}</span>
               <span className="badge badge-warning" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontWeight: 800 }}>Thời lượng: {takeExam?.duration_minutes} phút</span>
            </div>
          </div>
          <div className={styles.formField}>
            <label style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', display: 'block' }}>NỘI DUNG BÀI LÀM CỦA BẠN</label>
            <textarea
              className={styles.takeExamTextarea}
              value={takeForm.content}
              onChange={(e) => setTakeForm({ content: e.target.value })}
              placeholder="Nhập câu trả lời chi tiết của bạn tại đây..."
            />
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setTakeExam(null)} className="btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '1.25rem', fontWeight: 800, cursor: 'pointer' }}>Tạm ẩn</button>
            <button onClick={submitTake} className="btn-primary" style={{ padding: "1rem 3rem", borderRadius: '1.25rem' }}>
              <Send size={18} /> Nộp bài ngay
            </button>
          </div>
        </div>
      </Modal>

      {error || actionError ? <InlineMessage variant="error" style={{ marginBottom: "2rem" }}>{error || actionError}</InlineMessage> : null}

      <div className={styles.examList}>
        {loading && !exams.length ? (
          <Card>
            <div style={{ padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
              <p style={{ textAlign: 'center', fontWeight: 600, color: 'var(--muted-foreground)' }}>Đang tải danh sách kỳ thi...</p>
            </div>
          </Card>
        ) : (
          <>
            {sorted.map((e, idx) => {
              const isGraded = e.grades?.some(g => g.student_id === user?.id);
              const isSubmitted = e.submissions?.some(s => s.student_id === user?.id);
              const studentGrade = e.grades?.find(g => g.student_id === user?.id);
              
              return (
                <div key={e._id || e.id} className={`${styles.examCard} slide-right`} style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}>
                  <div className={styles.cardBody}>
                    <div className={styles.examInfo}>
                      <div className={styles.badgeRow}>
                        <span className="badge badge-primary" style={{ fontWeight: 800 }}>{e.course_code || e.class_id}</span>
                        {e.class_name && <span className="badge badge-primary" style={{ background: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary)", fontWeight: 800 }}>{e.class_name}</span>}
                        <span className="badge badge-warning" style={{ fontWeight: 800 }}>{e.duration_minutes} PHÚT</span>
                      </div>
                      <h2 className={styles.examTitle}>{e.title}</h2>
                      <p className={styles.examDescription}>
                        {e.description || "Kỳ thi được tổ chức trực tuyến trên hệ thống đào tạo."}
                      </p>
                      
                      {isGraded && studentGrade && (
                        <div className={styles.gradeBox}>
                          <div className={styles.gradeTitle}>
                            <Award size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                            Kết quả: {studentGrade.score} / {e.max_score}
                          </div>
                          {studentGrade.comments && (
                            <div className={styles.gradeComments}>
                              &ldquo;{studentGrade.comments}&rdquo;
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.examMeta}>
                      <div>
                        <span className={styles.metaLabel}>Thời gian bắt đầu</span>
                        <div className={styles.metaValue}>
                          <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem', opacity: 0.5 }} />
                          {e.scheduled_at ? new Date(e.scheduled_at).toLocaleString('vi-VN') : "—"}
                        </div>
                      </div>
                      <div className={styles.statusRow}>
                        <CheckCircle size={14} />
                        <span>{e.grades?.length || 0} bài đã chấm điểm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    {canManage ? (
                      <>
                        <button onClick={() => openGrade(e)} className="btn-primary" style={{ flex: 1, justifyContent: "center", background: "var(--surface-1)", color: "var(--primary)", border: "1px solid var(--border)", boxShadow: 'none' }}>
                          <Edit3 size={18} /> Ghi điểm / Xem bài làm
                        </button>
                        {user?.role === "admin" && (
                          <button onClick={() => deleteExam(e)} className="action-icon-btn" style={{ background: "rgba(244, 63, 94, 0.08)", color: "#f43f5e", border: "none", padding: "0.75rem", borderRadius: "1rem" }}>
                            <Trash2 size={20} />
                          </button>
                        )}
                      </>
                    ) : user?.role === "student" ? (
                      <button
                        onClick={() => { 
                          const existing = e.submissions?.find(s => s.student_id === user?.id);
                          setTakeExam(e); 
                          setTakeForm({ content: existing?.content || "" }); 
                        }}
                        disabled={isGraded}
                        className="btn-primary"
                        style={{ 
                          width: "100%", 
                          justifyContent: "center",
                          background: isGraded ? "var(--surface-2)" : (isSubmitted ? "var(--foreground)" : "var(--primary)"),
                          color: isGraded ? "var(--muted-foreground)" : "white",
                          opacity: isGraded ? 0.6 : 1,
                          padding: '1rem',
                          borderRadius: '1.25rem'
                        }}
                      >
                        {isGraded ? "Đã hoàn thành & Có điểm" : (isSubmitted ? "Cập nhật bài làm" : "Bắt đầu làm bài thi")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            
            {!loading && sorted.length === 0 && (
              <div className="error-state glass" style={{ textAlign: "center", padding: "6rem", borderRadius: "2rem" }}>
                <FileText size={64} style={{ opacity: 0.1, color: "var(--primary)", marginBottom: "1.5rem" }} />
                <p style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Chưa có kỳ thi nào được lên lịch.</p>
              </div>
            )}
            
            <div style={{ marginTop: '2.5rem' }}>
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                total={total}
                currentCount={sorted.length}
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
  );
}
