"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, MapPin, ArrowLeft, ChevronLeft, ChevronRight, CircleDot, CalendarRange } from 'lucide-react';
import Card from '@/components/ui/Card';
import styles from '@/styles/modules/calendar/calendar.module.css';

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

function startOfMonth(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfMonth(date) {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatKey(date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(left, right) {
  return formatKey(left) === formatKey(right);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(date);
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

const baseDate = new Date();
baseDate.setHours(0, 0, 0, 0);

const eventSeed = [
  { title: 'Họp điều phối học vụ', time: '08:30 - 09:15', place: 'Phòng họp A1', status: 'Đang diễn ra', offset: 0 },
  { title: 'Duyệt rút học phần', time: '10:00 - 11:30', place: 'Dashboard Admin', status: 'Cần xử lý', offset: 1 },
  { title: 'Đồng bộ lịch thi', time: '13:30 - 14:00', place: 'Hệ thống', status: 'Sắp tới', offset: 3 },
  { title: 'Kiểm tra phòng học', time: '15:00 - 15:30', place: 'Cơ sở A', status: 'Xác nhận', offset: 6 },
  { title: 'Cập nhật môn mới', time: '09:00 - 10:00', place: 'Phòng đào tạo', status: 'Sắp tới', offset: 10 },
];

const events = eventSeed.map((event) => ({
  ...event,
  date: addDays(baseDate, event.offset),
  key: formatKey(addDays(baseDate, event.offset)),
}));

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState('month');
  const [cursorDate, setCursorDate] = useState(baseDate);
  const [selectedDate, setSelectedDate] = useState(baseDate);

  const visibleDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(cursorDate);
      return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    }

    const monthStart = startOfMonth(cursorDate);
    const monthEnd = endOfMonth(cursorDate);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const days = [];
    for (let day = new Date(gridStart); day <= gridEnd; day = addDays(day, 1)) {
      days.push(new Date(day));
    }
    return days;
  }, [cursorDate, viewMode]);

  const selectedEvents = useMemo(
    () => events.filter((event) => isSameDay(event.date, selectedDate)),
    [selectedDate]
  );

  const weekEventCount = useMemo(() => {
    const weekStart = startOfWeek(cursorDate);
    return events.filter((event) => {
      const eventTime = event.date.getTime();
      const weekStartTime = weekStart.getTime();
      const weekEndTime = addDays(weekStart, 6).getTime();
      return eventTime >= weekStartTime && eventTime <= weekEndTime;
    }).length;
  }, [cursorDate]);

  const monthEventCount = useMemo(() => {
    return events.filter((event) => event.date.getMonth() === cursorDate.getMonth() && event.date.getFullYear() === cursorDate.getFullYear()).length;
  }, [cursorDate]);

  const todayEvents = useMemo(() => events.filter((event) => isSameDay(event.date, baseDate)), []);

  const goPrevious = () => {
    setCursorDate((current) => (viewMode === 'month' ? addMonths(current, -1) : addDays(current, -7)));
  };

  const goNext = () => {
    setCursorDate((current) => (viewMode === 'month' ? addMonths(current, 1) : addDays(current, 7)));
  };

  const resetToday = () => {
    setCursorDate(baseDate);
    setSelectedDate(baseDate);
  };

  return (
    <main className={styles.page}>
      <motion.div className={styles.shell} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.kicker}>Lịch hệ thống</div>
            <h1 className={styles.pageTitle}>Lịch tuần / tháng</h1>
            <p className={styles.pageSubtitle}>Quản lý các mốc quan trọng theo ngày, tuần và tháng với lịch thật.</p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={resetToday}>Hôm nay</button>
            <Link href="/admin" prefetch={false} className={styles.backLink}>
              <ArrowLeft size={16} /> Quay lại admin
            </Link>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <button type="button" className={`${styles.modeButton} ${viewMode === 'month' ? styles.modeButtonActive : ''}`} onClick={() => setViewMode('month')}>Tháng</button>
            <button type="button" className={`${styles.modeButton} ${viewMode === 'week' ? styles.modeButtonActive : ''}`} onClick={() => setViewMode('week')}>Tuần</button>
          </div>

          <div className={styles.toolbarGroup}>
            <button type="button" className={styles.iconButton} onClick={goPrevious} aria-label="Thời gian trước"><ChevronLeft size={18} /></button>
            <div className={styles.toolbarTitle}>{viewMode === 'month' ? formatMonthLabel(cursorDate) : `Tuần của ${formatShortDate(startOfWeek(cursorDate))}`}</div>
            <button type="button" className={styles.iconButton} onClick={goNext} aria-label="Thời gian sau"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className={styles.gridLayout}>
          <div className={styles.mainColumn}>
            <Card title={<div className="flex items-center gap-3"><CalendarRange size={20} className="text-primary" /><span className="text-xl font-black">{viewMode === 'month' ? 'Lịch tháng' : 'Lịch tuần'}</span></div>}>
              <div className={styles.calendarGrid} style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {weekdayLabels.map((day) => (
                  <div key={day} className={styles.weekdayCell}>{day}</div>
                ))}

                {visibleDays.map((day) => {
                  const isCurrentMonth = day.getMonth() === cursorDate.getMonth();
                  const isToday = isSameDay(day, baseDate);
                  const isSelected = isSameDay(day, selectedDate);
                  const dayEvents = events.filter((event) => isSameDay(event.date, day));

                  return (
                    <button
                      key={formatKey(day)}
                      type="button"
                      className={`${styles.dayCell} ${!isCurrentMonth && viewMode === 'month' ? styles.dayCellMuted : ''} ${isToday ? styles.dayCellToday : ''} ${isSelected ? styles.dayCellSelected : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span className={styles.dayNumber}>{day.getDate()}</span>
                      <div className={styles.dayEvents}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <span key={event.title} className={styles.eventDot} title={event.title}>
                            <CircleDot size={10} />
                            <span>{event.title}</span>
                          </span>
                        ))}
                        {dayEvents.length > 3 && <span className={styles.moreEvents}>+{dayEvents.length - 3} sự kiện</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className={styles.sideColumn}>
            <Card title={<div className="flex items-center gap-3"><Clock3 size={20} className="text-primary" /><span className="text-xl font-black">Chi tiết ngày</span></div>}>
              <div className={styles.daySummary}>
                <div className={styles.summaryBadge}>Đang xem: {formatDayLabel(selectedDate)}</div>
                <div className={styles.summaryTitle}>{selectedEvents.length} sự kiện</div>
                <div className={styles.summaryMeta}>Ngày hiện tại: {isSameDay(selectedDate, baseDate) ? 'Hôm nay' : formatShortDate(selectedDate)}</div>
              </div>

              <div className={styles.eventList}>
                {selectedEvents.length === 0 ? (
                  <div className={styles.emptyState}>Không có sự kiện nào trong ngày này.</div>
                ) : selectedEvents.map((event) => (
                  <div key={`${event.title}-${event.key}`} className={styles.eventCard}>
                    <div className={styles.eventTitle}>{event.title}</div>
                    <div className={styles.eventInfo}><Clock3 size={14} /> {event.time}</div>
                    <div className={styles.eventInfo}><MapPin size={14} /> {event.place}</div>
                    <div className={styles.eventStatus}>{event.status}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={<div className="flex items-center gap-3"><CalendarDays size={20} className="text-primary" /><span className="text-xl font-black">Tổng quan</span></div>}>
              <div className={styles.overviewGrid}>
                <div className={styles.overviewItem}>
                  <div className={styles.overviewLabel}>Sự kiện tháng</div>
                  <div className={styles.overviewValue}>{monthEventCount}</div>
                </div>
                <div className={styles.overviewItem}>
                  <div className={styles.overviewLabel}>Sự kiện tuần</div>
                  <div className={styles.overviewValue}>{weekEventCount}</div>
                </div>
                <div className={styles.overviewItem}>
                  <div className={styles.overviewLabel}>Hôm nay</div>
                  <div className={styles.overviewValue}>{todayEvents.length}</div>
                </div>
                <div className={styles.overviewItem}>
                  <div className={styles.overviewLabel}>Chế độ</div>
                  <div className={styles.overviewValue}>{viewMode === 'month' ? 'Tháng' : 'Tuần'}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
