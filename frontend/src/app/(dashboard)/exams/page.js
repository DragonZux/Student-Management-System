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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1>Kỳ thi</h1>
        {user?.role === "admin" ? (
          <button
            onClick={() => setShowCreate((v) => !v)}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius)",
              background: "var(--primary)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {showCreate ? "Đóng" : "Tạo kỳ thi"}
          </button>
        ) : null}
      </div>

      {showCreate ? (
        <Card className="glass" title="Tạo kỳ thi">
          <InlineMessage variant="error" style={{ marginBottom: "0.75rem" }}>{createError}</InlineMessage>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Lớp học</label>
              <select
                value={createForm.class_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, class_id: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
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
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Thời gian thi</label>
              <input
                type="datetime-local"
                value={createForm.scheduled_at}
                onChange={(e) => setCreateForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Thời lượng (phút)</label>
              <input
                type="number"
                min="1"
                value={createForm.duration_minutes}
                onChange={(e) => setCreateForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Tiêu đề</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Mô tả</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)", minHeight: 90 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Điểm tối đa</label>
              <input
                type="number"
                min="1"
                value={createForm.max_score}
                onChange={(e) => setCreateForm((p) => ({ ...p, max_score: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={createExam}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "white",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Tạo mới
            </button>
          </div>
        </Card>
      ) : null}

      {gradeExam ? (
        <Card className="glass" title={`Ghi điểm: ${gradeExam.title}`}>
          <InlineMessage variant="error" style={{ marginBottom: "0.75rem" }}>{gradeError}</InlineMessage>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Mã sinh viên</label>
              <input
                value={gradeForm.student_id}
                onChange={(e) => setGradeForm((p) => ({ ...p, student_id: e.target.value }))}
                placeholder="mã_sinh_viên"
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Điểm</label>
              <input
                value={gradeForm.score}
                onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                placeholder="điểm"
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Nhận xét</label>
              <input
                value={gradeForm.comments}
                onChange={(e) => setGradeForm((p) => ({ ...p, comments: e.target.value }))}
                style={{ width: "100%", padding: "0.625rem", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
            </div>
            {gradeExam.submissions?.find(s => s.student_id === gradeForm.student_id) && (
              <div style={{ gridColumn: "1 / -1", marginTop: "1rem", padding: "1rem", background: "var(--muted)", borderRadius: "8px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Bài làm của sinh viên:</label>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
                  {gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).content}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", marginTop: "0.5rem" }}>
                  Nộp lúc: {new Date(gradeExam.submissions.find(s => s.student_id === gradeForm.student_id).submitted_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              onClick={() => setGradeExam(null)}
              style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 700 }}
            >
              Hủy
            </button>
            <button
              onClick={submitGrade}
              style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 800 }}
            >
              Lưu
            </button>
          </div>
        </Card>
      ) : null}

      {takeExam ? (
        <Card className="glass" title={`Làm bài thi: ${takeExam.title}`}>
          <InlineMessage variant="error" style={{ marginBottom: "0.75rem" }}>{takeError}</InlineMessage>
          <div style={{ marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Mô tả: {takeExam.description || "Không có mô tả"}</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Điểm tối đa: {takeExam.max_score} | Thời lượng: {takeExam.duration_minutes} phút</p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>Nội dung bài làm</label>
            <textarea
              value={takeForm.content}
              onChange={(e) => setTakeForm({ content: e.target.value })}
              placeholder="Nhập câu trả lời hoặc nội dung bài làm của bạn tại đây..."
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", minHeight: "250px" }}
            />
          </div>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              onClick={() => setTakeExam(null)}
              style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
            >
              Hủy
            </button>
            <button
              onClick={submitTake}
              style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "none", background: "var(--primary)", color: "white", cursor: "pointer", fontWeight: 800 }}
            >
              Nộp bài
            </button>
          </div>
        </Card>
      ) : null}

      {loading ? <Card className="glass">Đang tải...</Card> : null}
      {error ? <InlineMessage variant="error" style={{ marginBottom: "0.75rem" }}>{error}</InlineMessage> : null}
      {actionError ? <InlineMessage variant="error" style={{ marginBottom: "0.75rem" }}>{actionError}</InlineMessage> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {sorted.map((e) => (
          <Card key={e._id} className="glass" title={e.title} footer={
            (user?.role === "teacher" || user?.role === "admin") ? (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => openGrade(e)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--primary)", background: "transparent", color: "var(--primary)", cursor: "pointer", fontWeight: 800 }}
                >
                  Ghi điểm
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => deleteExam(e)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid #fee2e2", background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontWeight: 900 }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : user?.role === "student" ? (
              <button
                onClick={() => { setTakeExam(e); setTakeForm({ content: "" }); }}
                disabled={e.grades?.some(g => g.student_id === user._id)}
                style={{ 
                  width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", 
                  background: e.grades?.some(g => g.student_id === user._id) ? "var(--muted)" : "var(--primary)", 
                  color: "white", border: "none", cursor: "pointer", fontWeight: 700 
                }}
              >
                {e.grades?.some(g => g.student_id === user._id) ? "Đã có điểm" : "Làm bài thi"}
              </button>
            ) : null
          }>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Class: {e.class_id}</div>
                <div style={{ marginTop: "0.5rem" }}>{e.description || ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Scheduled</div>
                <div style={{ fontWeight: 800 }}>{e.scheduled_at ? new Date(e.scheduled_at).toLocaleString() : "—"}</div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !error && sorted.length === 0 ? <Card className="glass">Chưa có kỳ thi nào.</Card> : null}
      </div>
    </div>
  );
}

