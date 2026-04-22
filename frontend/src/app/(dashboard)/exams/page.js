"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import InlineMessage from "@/components/ui/InlineMessage";
import api from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { isInRange, popupValidationError, toNumber } from "@/lib/validation";

export default function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const canManage = user?.role === "teacher" || user?.role === "admin";

  const load = useCallback(async () => {
    const res = await api.get("/exams/");
    setExams(res.data || []);
  }, []);

  const loadClasses = useCallback(async () => {
    try {
      if (user?.role === "teacher") {
        const res = await api.get("/teacher/my-classes");
        setMyClasses(res.data || []);
      } else if (user?.role === "admin") {
        const res = await api.get("/admin/classes");
        setMyClasses(res.data || []);
      } else {
        setMyClasses([]);
      }
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        setError("");
        await Promise.all([load(), loadClasses()]);
      } catch (e) {
        console.error("Failed to load exams", e);
        if (!cancelled) setError(e.response?.data?.detail || "Failed to load exams");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [load, loadClasses]);

  useEffect(() => {
    if (!createForm.class_id && myClasses.length > 0) {
      setCreateForm((p) => ({ ...p, class_id: myClasses[0]._id }));
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
      await api.post("/exams/", {
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
      await load();
    } catch (e) {
      console.error("Create exam failed", e);
      setCreateError(e.response?.data?.detail || "Tạo kỳ thi thất bại");
    }
  };

  const deleteExam = async (exam) => {
    if (!confirm(`Delete exam "${exam.title}"?`)) return;
    setActionError("");
    try {
      await api.delete(`/exams/${exam._id}`);
      await load();
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

  const submitGrade = async () => {
    if (!gradeExam?._id) return;
    setGradeError("");
    if (!gradeForm.student_id.trim() || gradeForm.score === "") {
      popupValidationError(setGradeError, "Vui lòng nhập mã sinh viên và điểm.");
      return;
    }
    const score = toNumber(gradeForm.score);
    if (score === null) {
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
      await load();
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
      await load();
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
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>Quản lý Kỳ thi</h1>
          <p style={{ fontSize: "1.1rem" }}>Lịch thi, bài làm và hệ thống chấm điểm trực tuyến.</p>
        </div>
        {user?.role === "admin" ? (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="btn-primary"
            style={{ background: showCreate ? "var(--foreground)" : "var(--primary)" }}
          >
            {showCreate ? "Đóng trình tạo" : "+ Tạo kỳ thi mới"}
          </button>
        ) : null}
      </div>

      {showCreate ? (
        <Card className="glass animate-in" title="Tạo kỳ thi mới">
          <InlineMessage variant="error" style={{ marginBottom: "1.5rem" }}>{createError}</InlineMessage>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Lớp học mục tiêu</label>
              <select
                value={createForm.class_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, class_id: e.target.value }))}
                style={{ width: "100%" }}
              >
                <option value="">-- Chọn lớp học --</option>
                {myClasses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.course_code || "Môn học"}: {c.course_title || c.course_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Thời gian thi</label>
              <input
                type="datetime-local"
                value={createForm.scheduled_at}
                onChange={(e) => setCreateForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Thời lượng (phút)</label>
              <input
                type="number"
                min="1"
                value={createForm.duration_minutes}
                onChange={(e) => setCreateForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Tiêu đề kỳ thi</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ví dụ: Kiểm tra giữa kỳ môn Giải tích"
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Mô tả & Hướng dẫn</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Nhập hướng dẫn làm bài cho sinh viên..."
                style={{ width: "100%", minHeight: 120 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Thang điểm tối đa</label>
              <input
                type="number"
                min="1"
                value={createForm.max_score}
                onChange={(e) => setCreateForm((p) => ({ ...p, max_score: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button onClick={() => setShowCreate(false)} className="btn-primary" style={{ background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }}>Hủy</button>
            <button onClick={createExam} className="btn-primary">Phát hành kỳ thi</button>
          </div>
        </Card>
      ) : null}

      {gradeExam ? (
        <Card className="glass animate-in" title={`Hệ thống ghi điểm: ${gradeExam.title}`}>
          <InlineMessage variant="error" style={{ marginBottom: "1.5rem" }}>{gradeError}</InlineMessage>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Mã sinh viên</label>
              <input
                value={gradeForm.student_id}
                onChange={(e) => setGradeForm((p) => ({ ...p, student_id: e.target.value }))}
                placeholder="Ví dụ: SV12345"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Điểm đạt được</label>
              <input
                value={gradeForm.score}
                onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                placeholder={`0 - ${gradeExam.max_score}`}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Nhận xét giảng viên</label>
              <textarea
                value={gradeForm.comments}
                onChange={(e) => setGradeForm((p) => ({ ...p, comments: e.target.value }))}
                placeholder="Phản hồi về bài làm của sinh viên..."
                style={{ width: "100%", minHeight: 80 }}
              />
            </div>
            {gradeExam.submissions?.find(s => s.student_id === gradeForm.student_id) && (
              <div style={{ gridColumn: "1 / -1", marginTop: "1rem", padding: "1.5rem", background: "rgba(99, 102, 241, 0.05)", borderRadius: "1rem", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", marginBottom: "1rem" }}>Nội dung sinh viên đã nộp:</label>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "1rem", lineHeight: "1.6", color: "var(--foreground)" }}>
                  {gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).content}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                  📅 Thời gian nộp: {new Date(gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).submitted_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button onClick={() => setGradeExam(null)} className="btn-primary" style={{ background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }}>Đóng</button>
            <button onClick={submitGrade} className="btn-primary">Xác nhận ghi điểm</button>
          </div>
        </Card>
      ) : null}

      {takeExam ? (
        <Card className="glass animate-in" title={`Làm bài thi: ${takeExam.title}`}>
          <InlineMessage variant="error" style={{ marginBottom: "1.5rem" }}>{takeError}</InlineMessage>
          <div style={{ marginBottom: "2rem", padding: "1.25rem", background: "rgba(0,0,0,0.02)", borderRadius: "1rem" }}>
            <p style={{ fontSize: "1rem", color: "var(--foreground)", marginBottom: "1rem", lineHeight: "1.5" }}>{takeExam.description || "Hãy thực hiện bài thi theo yêu cầu của giảng viên."}</p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
               <span className="badge badge-primary">Điểm tối đa: {takeExam.max_score}</span>
               <span className="badge badge-warning">Thời lượng: {takeExam.duration_minutes} phút</span>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Nội dung bài làm của bạn</label>
            <textarea
              value={takeForm.content}
              onChange={(e) => setTakeForm({ content: e.target.value })}
              placeholder="Nhập câu trả lời chi tiết của bạn tại đây..."
              style={{ width: "100%", minHeight: "350px", fontSize: "1rem", lineHeight: "1.6", padding: "1.25rem" }}
            />
          </div>
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button onClick={() => setTakeExam(null)} className="btn-primary" style={{ background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }}>Tạm ẩn</button>
            <button onClick={submitTake} className="btn-primary" style={{ padding: "0.75rem 2.5rem" }}>Nộp bài thi ngay</button>
          </div>
        </Card>
      ) : null}

      <InlineMessage variant="error" style={{ marginBottom: "1rem" }}>{error || actionError}</InlineMessage>
      {loading && !exams.length ? <Card className="glass">Đang tải danh sách kỳ thi...</Card> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {sorted.map((e) => {
          const isGraded = e.grades?.some(g => g.student_id === user?._id);
          const isSubmitted = e.submissions?.some(s => s.student_id === user?._id);
          
          return (
            <Card key={e._id} className="glass" title={e.title} footer={
              (user?.role === "teacher" || user?.role === "admin") ? (
                <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
                  <button onClick={() => openGrade(e)} className="btn-primary" style={{ flex: 1, justifyContent: "center", background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)" }}>
                    Ghi điểm / Xem bài làm
                  </button>
                  {user?.role === "admin" && (
                    <button onClick={() => deleteExam(e)} className="btn-primary" style={{ background: "rgba(244, 63, 94, 0.1)", color: "var(--accent)", border: "none", boxShadow: "none" }}>
                      Xóa
                    </button>
                  )}
                </div>
              ) : user?.role === "student" ? (
                <button
                  onClick={() => { setTakeExam(e); setTakeForm({ content: "" }); }}
                  disabled={isGraded}
                  className="btn-primary"
                  style={{ 
                    width: "100%", 
                    justifyContent: "center",
                    background: isGraded ? "var(--muted)" : (isSubmitted ? "var(--foreground)" : "var(--primary)"),
                    color: isGraded ? "var(--muted-foreground)" : "white",
                    opacity: isGraded ? 0.6 : 1
                  }}
                >
                  {isGraded ? "Đã có điểm" : (isSubmitted ? "Cập nhật bài làm" : "Bắt đầu làm bài")}
                </button>
              ) : null
            }>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                    <span className="badge badge-primary">{e.class_id}</span>
                    <span className="badge badge-warning">{e.duration_minutes} phút</span>
                  </div>
                  <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.925rem", lineHeight: "1.5" }}>
                    {e.description || "Kỳ thi được tổ chức trực tuyến trên hệ thống."}
                  </p>
                </div>
                <div style={{ textAlign: "right", minWidth: "200px" }}>
                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.5rem", fontWeight: 600 }}>Thời gian bắt đầu</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)" }}>
                    {e.scheduled_at ? new Date(e.scheduled_at).toLocaleString() : "—"}
                  </div>
                  <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem" }}>
                    Tình trạng: <span style={{ fontWeight: 700, color: "var(--primary)" }}>{e.grades?.length || 0} đã chấm</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && sorted.length === 0 ? <Card className="glass" style={{ textAlign: "center", padding: "3rem" }}>Chưa có kỳ thi nào được lên lịch.</Card> : null}
      </div>
    </div>
  );
}
