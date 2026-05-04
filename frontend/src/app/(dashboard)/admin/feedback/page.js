"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Search, Star, MessageSquare, Calendar, User, BookOpen, ExternalLink, Filter, Loader2 } from 'lucide-react';
import styles from '@/styles/modules/admin/feedback.module.css';
import PaginationControls from '@/components/ui/PaginationControls';
import Modal from '@/components/ui/Modal';

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    async function loadFeedback() {
      try {
        setLoading(true);
        const res = await api.get('/admin/feedback', {
          params: {
            skip: (page - 1) * pageSize,
            limit: pageSize,
            search: search || undefined
          }
        });
        setFeedback(res.data?.data || []);
        setTotal(res.data?.total || 0);
      } catch (e) {
        console.error('Failed to load feedback', e);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadFeedback, search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [page, pageSize, search]);

  const handleViewDetails = (item) => {
    setSelectedFeedback(item);
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Quản lý Phản hồi</h1>
          <p>Xem và phân tích ý kiến đóng góp từ sinh viên về các lớp học.</p>
        </div>
      </header>

      <div className={`${styles.filterBar} scale-in stagger-2`}>
        <div className={styles.searchInput}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sinh viên, email hoặc mã môn học..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter size={18} /> Lọc kết quả
        </button>
      </div>

      <div className={`${styles.tableContainer} scale-in stagger-3`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-muted-foreground font-medium">Đang tải dữ liệu phản hồi...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center p-24 text-muted-foreground">
            <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
            <p>Không tìm thấy phản hồi nào phù hợp.</p>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Lớp học</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item, idx) => (
                  <tr key={item.feedback._id} className="table-row-hover">
                    <td>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{item.student.full_name}</span>
                        <span className={styles.studentEmail}>{item.student.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.classInfo}>
                        <span className={styles.courseCode}>{item.class.course_code}</span>
                        <span className={styles.courseTitle}>{item.class.course_title}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rating}>
                        <Star size={16} fill="currentColor" />
                        <span>{item.feedback.rating}</span>
                      </div>
                    </td>
                    <td>
                      <p className={styles.comment} title={item.feedback.comment}>
                        {item.feedback.comment}
                      </p>
                    </td>
                    <td>
                      <span className={styles.date}>
                        {new Date(item.feedback.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.viewBtn} 
                          title="Xem chi tiết"
                          onClick={() => handleViewDetails(item)}
                        >
                          <ExternalLink size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls 
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={setPage}
              total={total}
              currentCount={feedback.length}
            />
          </>
        )}
      </div>

      <Modal 
        isOpen={!!selectedFeedback} 
        onClose={() => setSelectedFeedback(null)}
        title="Chi tiết Phản hồi"
      >
        {selectedFeedback && (
          <div className="flex flex-col gap-6 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Sinh viên</label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold">{selectedFeedback.student.full_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedFeedback.student.email}</div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Học phần</label>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="font-bold">{selectedFeedback.class.course_code}</div>
                    <div className="text-sm text-muted-foreground">{selectedFeedback.class.course_title}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-1 rounded-2xl border border-border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-xl font-black text-yellow-500">
                  <Star fill="currentColor" size={24} />
                  <span>{selectedFeedback.feedback.rating} / 5</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={16} />
                  {new Date(selectedFeedback.feedback.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="text-lg leading-relaxed italic text-foreground">
                "{selectedFeedback.feedback.comment}"
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={() => setSelectedFeedback(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
