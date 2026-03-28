'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
  getDay,
  subDays,
  addDays,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarItem, DayStats, CalendarPost, CalendarTask } from '../../../types/calendar';
import { RoleDropdown } from '../shared/role-dropdown/role-dropdown';
import styles from './Calendar.module.css';
import { FileText, Circle } from 'lucide-react';

interface CalendarProps {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPostClick?: (post: CalendarPost) => void;
  onTaskClick?: (task: CalendarTask) => void;
  showPosts: boolean;
  showTasks: boolean;
  selectedRoleFilter: string | null;
  onRoleFilterChange: (filter: string | null) => void;
  handlePostsClick: () => void;
  handleTasksClick: () => void;
  posts: CalendarPost[];
  tasks: CalendarTask[];
}

const getDayOfWeekShort = (date: Date): string => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  return days[getDay(date)];
};

const getDayStats = (items: CalendarItem[]): DayStats => {
  const posts = items.filter(item => item.type === 'post');
  const tasks = items.filter(item => item.type === 'task');

  const postsCompleted = posts.filter(
    post => (post as CalendarPost).post_status === 'Завершен'
  ).length;

  const tasksCompleted = tasks.filter(
    task => (task as CalendarTask).task_status === 'Выполнена'
  ).length;

  return {
    total: items.length,
    completed: postsCompleted + tasksCompleted,
    postsTotal: posts.length,
    postsCompleted,
    tasksTotal: tasks.length,
    tasksCompleted,
  };
};

export const Calendar: React.FC<CalendarProps> = ({
  itemsByDate,
  selectedDate,
  onDateSelect,
  onPostClick,
  onTaskClick,
  showPosts,
  showTasks,
  selectedRoleFilter,
  onRoleFilterChange,
  handlePostsClick,
  handleTasksClick,
  posts,
  tasks,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const startDayOfWeek = monthStart.getDay();
  const daysBefore = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const firstDisplayDate = subDays(monthStart, daysBefore);

  const endDayOfWeek = monthEnd.getDay();
  const daysAfter = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  const lastDisplayDate = addDays(monthEnd, daysAfter);

  const displayDays = eachDayOfInterval({
    start: firstDisplayDate,
    end: lastDisplayDate,
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const prevMonth = subMonths(currentMonth, 1);
  const nextMonth = addMonths(currentMonth, 1);

  const monthlyCounts = useMemo(() => {
    const postsCount = posts.filter(post =>
      isSameMonth(new Date(post.post_deadline), currentMonth)
    ).length;

    const tasksCount = tasks.filter(task =>
      isSameMonth(new Date(task.end_time), currentMonth)
    ).length;

    return { postsCount, tasksCount };
  }, [posts, tasks, currentMonth]);

  const getItemsForDay = (day: Date): CalendarItem[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return itemsByDate.get(dateStr) || [];
  };

  const getFirstTaskIcon = (post: CalendarPost): string | null => {
    const taskTypes = [
      { field: 'post_needs_mini_video_smm', icon: 'icons/mini_video_icon.svg' },
      { field: 'post_needs_video', icon: 'icons/video_icon.svg' },
      { field: 'post_needs_photogallery', icon: 'icons/photogallery_icon.svg' },
      { field: 'post_needs_cover_photo', icon: 'icons/coverphoto_icon.svg' },
      { field: 'post_needs_photo_cards', icon: 'icons/photocards_icon.svg' },
      { field: 'post_needs_mini_gallery', icon: 'icons/mini_photogallery.svg' },
      { field: 'post_needs_text', icon: 'icons/text_icon.svg' },
    ] as const;

    for (const task of taskTypes) {
      if (post[task.field]) {
        return task.icon;
      }
    }

    return null;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={handlePrevMonth} className={styles.prevGroupButton}>
          <img className={styles.navButtonSymbol} src="/icons/Left Arrow.svg" alt="" />
          <span className={styles.prevMonthName}>
            {format(prevMonth, 'LLLL', { locale: ru })}
          </span>
        </button>

        <div className={styles.filterGroup}>
          <h2 className={styles.monthTitle}>
            {format(currentMonth, 'LLLL', { locale: ru })}
          </h2>

          <div className={styles.filterButtons}>
            <button
              onClick={handlePostsClick}
              className={`${styles.filterButton} ${showPosts ? styles.filterButtonActive : styles.filterButtonInactive
                }`}
            >
              Постов {monthlyCounts.postsCount}
            </button>

            <button
              onClick={handleTasksClick}
              className={`${styles.filterButton} ${showTasks ? styles.filterButtonActive : styles.filterButtonInactive
                }`}
            >
              Задач {monthlyCounts.tasksCount}
            </button>
            <RoleDropdown
              roleFilter={selectedRoleFilter}
              onRoleSelect={onRoleFilterChange}
            />
          </div>

        </div>

        <button onClick={handleNextMonth} className={styles.nextGroupButton}>
          <span className={styles.nextMonthName}>
            {format(nextMonth, 'LLLL', { locale: ru })}
          </span>
          <img className={styles.navButtonSymbol} src="/icons/Right Arrow.svg" alt="" />
        </button>
      </div>

      <div className={styles.dayGrid}>
        {displayDays.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const itemsForDay = getItemsForDay(day);

          const filteredItems = itemsForDay.filter(item =>
            (showPosts && item.type === 'post') || (showTasks && item.type === 'task')
          );

          const dayStats = getDayStats(filteredItems);
          const dayNumber = format(day, 'dd');
          const dayOfWeek = getDayOfWeekShort(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          let dayCellClass = styles.dayCell;
          if (isSelected) dayCellClass += ` ${styles.dayCellSelected}`;
          if (isCurrentDay) dayCellClass += ` ${styles.dayCellToday}`;
          if (!isCurrentMonth) dayCellClass += ` ${styles.dayCellOtherMonth}`;
          if (isWeekend && isCurrentMonth) dayCellClass += ` ${styles.dayCellWeekend}`;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={dayCellClass}
            >
              <div className={styles.dayHeader}>
                <span className={styles.dayNumber}>
                  {dayNumber} <span className={styles.dayWeekday}>{dayOfWeek}</span>
                </span>

                {filteredItems.length > 0 && (
                  <span
                    className={`${styles.dayStats} ${dayStats.completed === dayStats.total
                      ? styles.dayStatsCompleted
                      : styles.dayStatsIncomplete
                      }`}
                  >
                    {dayStats.completed}/{dayStats.total}
                  </span>
                )}
              </div>

              <div className={`${styles.itemsContainer} ${styles.scrollable}`}>
                {filteredItems.map((item, idx) => {
                  const isPost = item.type === 'post';
                  const bgColor =
                    item.tags && item.tags.length > 0 ? item.tags[0].color : undefined;
                  const postIcon = isPost ? getFirstTaskIcon(item as CalendarPost) : null;

                  return (
                    <div
                      key={`${item.type}-${isPost ? item.post_id : item.task_id}-${idx}`}
                      className={styles.item}
                      style={{ backgroundColor: bgColor }}
                      title={isPost ? item.post_title : item.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPost) {
                          onPostClick?.(item as CalendarPost);
                        } else {
                          onTaskClick?.(item as CalendarTask);
                        }
                      }}
                    >
                      {postIcon ? (
                        <img src={postIcon} alt="" className={styles.itemIcon} />
                      ) : (
                        <span className={styles.itemIcon}>
                          {isPost ? <FileText size={14} /> : <Circle size={10} fill="currentColor" />}
                        </span>
                      )}
                      {isPost ? item.post_title : item.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};