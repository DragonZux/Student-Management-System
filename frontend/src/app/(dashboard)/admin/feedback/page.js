"use client";

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Search, Star, MessageSquare, Calendar, User, BookOpen, ExternalLink, Filter, Loader2, Quote, TrendingUp, Users } from 'lucide-react';
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

  const stats = useMemo(() => {
    if (!feedback.length) return { avg: 0, total: total };
    const sum = feedback.reduce((acc, curr) => acc + (curr.feedback.rating || 0), 0);
    return {
      avg: (sum / feedback.length).toFixed(1),
      total: total
    };
  }, [feedback, total]);

  const handleViewDetails = (item) => {
    setSelectedFeedback(item);
  };

  return (
    <div className={`${styles.container} animate-in`}>
      <header className={styles.header}>
        <div className="slide-right stagger-1">
          <h1>Quản lý Phản hồi</h1>
          <p>Lắng nghe và cải thiện chất lượng đào tạo từ ý kiến sinh viên.</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} slide-up stagger-1`}>
          <div className={styles.statIcon}><MessageSquare size={24} /></div>
          <div className={styles.statInfo}>
            <h3>Tổng số phản hồi</h3>
            <div className={styles.statValue}>{stats.total}</div>
          </div>
        </div>
        <div className={`${styles.statCard} slide-up stagger-2`}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Star size={24} /></div>
          <div className={styles.statInfo}>
            <h3>Đánh giá trung bình</h3>
            <div className={styles.statValue}>{stats.avg} <span style={{ fontSize: '1rem', color: 'var(--muted-foreground)' }}>/ 5.0</span></div>
          </div>
        </div>
        <div className={`${styles.statCard} slide-up stagger-3`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><TrendingUp size={24} /></div>
          <div className={styles.statInfo}>
            <h3>Tỉ lệ hài lòng</h3>
            <div className={styles.statValue}>{Math.round((stats.avg / 5) * 100)}%</div>
          </div>
        </div>
      </div>

      <div className={`${styles.filterBar} slide-up stagger-4`}>
        <div className={styles.searchInput}>
          <Search className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sinh viên, email hoặc mã môn học..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', fontWeight: 700 }}>
          <Filter size={18} /> Lọc kết quả
        </button>
      </div>

      <div className={`${styles.tableContainer} slide-up stagger-5`}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
            <Loader2 className="animate-spin text-primary" size={48} />
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Đang tải dữ liệu phản hồi...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--muted-foreground)' }}>
            <MessageSquare size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
            <p style={{ fontWeight: 600 }}>Không tìm thấy phản hồi nào phù hợp.</p>
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
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((item) => (
                  <tr key={item.feedback._id}>
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
                        <Star size={18} fill="currentColor" />
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
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className={styles.viewBtn} 
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
            <div style={{ padding: '1.5rem' }}>
              <PaginationControls 
                currentPage={page}
                totalPages={Math.ceil(total / pageSize)}
                onPageChange={setPage}
                total={total}
                currentCount={feedback.length}
              />
            </div>
          </>
        )}
      </div>

      <Modal 
        isOpen={!!selectedFeedback} 
        onClose={() => setSelectedFeedback(null)}
        title="Chi tiết Phản hồi"
        maxWidth="800px"
      >
        {selectedFeedback && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className={styles.modalDetailCard}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '1rem' }}>Người gửi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '0.75rem', color: 'var(--primary)' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedFeedback.student.full_name}</div>
                    <div style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>{selectedFeedback.student.email}</div>
                  </div>
                </div>
              </div>
              <div className={styles.modalDetailCard}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '1rem' }}>Học phần</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(var(--secondary-rgb), 0.1)', borderRadius: '0.75rem', color: 'var(--secondary)' }}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedFeedback.class.course_code}</div>
                    <div style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>{selectedFeedback.class.course_title}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.quoteContainer}>
              <div className={styles.quoteIcon}><Quote size={20} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>
                  <Star fill="currentColor" size={24} />
                  <span>{selectedFeedback.feedback.rating} / 5</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>
                  <Calendar size={18} />
                  {new Date(selectedFeedback.feedback.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              <div style={{ fontSize: '1.25rem', lineHeight: '1.8', color: 'var(--foreground)', fontStyle: 'italic', fontWeight: 500 }}>
                "{selectedFeedback.feedback.comment}"
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '1.25rem' }} onClick={() => setSelectedFeedback(null)}>
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
