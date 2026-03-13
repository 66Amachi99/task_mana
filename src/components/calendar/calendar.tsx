'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarItem, DayStats, CalendarPost, CalendarTask } from '../../../types/calendar';
import { ROLE_FILTERS } from '@/hooks/use-roles';
import { ChevronDown } from 'lucide-react';
import styles from '../styles/Calendar.module.css';

interface CalendarProps {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPostClick?: (post: CalendarPost) => void;
  onTaskClick?: (task: CalendarTask) => void;
  showPosts: boolean;
  onShowPostsChange: (value: boolean) => void;
  showTasks: boolean;
  onShowTasksChange: (value: boolean) => void;
  selectedRoleFilter: string | null;
  onRoleFilterChange: (filter: string | null) => void;
  totalPostsCount: number;
  totalTasksCount: number;
}

const getDayOfWeekShort = (date: Date): string => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  return days[getDay(date)];
};

const getDayStats = (items: CalendarItem[]): DayStats => {
  const posts = items.filter(item => item.type === 'post');
  const tasks = items.filter(item => item.type === 'task');
  const postsCompleted = posts.filter(post => (post as CalendarPost).post_status === 'Завершен').length;
  const tasksCompleted = tasks.filter(task => (task as CalendarTask).task_status === 'Выполнена').length;
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
  onShowPostsChange,
  showTasks,
  onShowTasksChange,
  selectedRoleFilter,
  onRoleFilterChange,
  totalPostsCount,
  totalTasksCount,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const emptyDays = startDay === 0 ? 6 : startDay - 1;

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const prevMonth = subMonths(currentMonth, 1);
  const nextMonth = addMonths(currentMonth, 1);

  const getItemsForDay = (day: Date): CalendarItem[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return itemsByDate.get(dateStr) || [];
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const selectedFilterLabel = selectedRoleFilter 
    ? ROLE_FILTERS.find(f => f.id === selectedRoleFilter)?.label 
    : null;

  return (
    <div className={styles.calendar}>
      {/* Заголовок с фильтрами */}
      <div className={styles.header}>
        {/* Левая группа: кликабельная кнопка с предыдущим месяцем */}
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
              onClick={() => onShowPostsChange(!showPosts)}
              className={`${styles.filterButton} ${showPosts ? styles.filterButtonActive : styles.filterButtonInactive}`}
            >
              Постов {totalPostsCount}
            </button>
            <button
              onClick={() => onShowTasksChange(!showTasks)}
              className={`${styles.filterButton} ${showTasks ? styles.filterButtonActive : styles.filterButtonInactive}`}
            >
              Задач {totalTasksCount}
            </button>
          </div>

          <div className={styles.roleDropdown} ref={roleDropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={styles.roleDropdownButton}
            >
              <span className={styles.roleDropdownText}>
                <img 
                  src={isRoleDropdownOpen ? '/icons/filter_on.svg' : '/icons/filter.svg'} 
                  alt="filter" 
                  className={styles.filterIcon} 
                />
              </span>
            </button>
            {isRoleDropdownOpen && (
              <div className={styles.roleDropdownMenu}>
                <button
                  onClick={() => { onRoleFilterChange(null); setIsRoleDropdownOpen(false); }}
                  className={`${styles.roleMenuItem} ${!selectedRoleFilter ? styles.roleMenuItemActive : ''}`}
                >
                  Все посты
                </button>
                <div className={styles.menuDivider}></div>
                {ROLE_FILTERS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { onRoleFilterChange(role.id); setIsRoleDropdownOpen(false); }}
                    className={`${styles.roleMenuItem} ${selectedRoleFilter === role.id ? styles.roleMenuItemActive : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={styles.roleIcon}>
                        {role.id === 'smm' && '📹'}
                        {role.id === 'photographer' && '📷'}
                        {role.id === 'designer' && '✏️'}
                      </span>
                      <span>{role.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Правая группа: кликабельная кнопка со следующим месяцем */}
        <button onClick={handleNextMonth} className={styles.nextGroupButton}>
          <span className={styles.nextMonthName}>
            {format(nextMonth, 'LLLL', { locale: ru })}
          </span>
          <img className={styles.navButtonSymbol} src="/icons/Right Arrow.svg" alt="" />
        </button>
      </div>

      {/* Дни недели */}
      {/* <div className={styles.weekDays}>
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div> */}

      {/* Сетка календаря */}
      <div className={styles.dayGrid}>
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptyCell} />
        ))}

        {days.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const itemsForDay = getItemsForDay(day);
          const dayStats = getDayStats(itemsForDay);
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
                {itemsForDay.length > 0 && (
                  <span
                    className={`${styles.dayStats} ${
                      dayStats.completed === dayStats.total
                        ? styles.dayStatsCompleted
                        : styles.dayStatsIncomplete
                    }`}
                  >
                    {dayStats.completed}/{dayStats.total}
                  </span>
                )}
              </div>
              
              <div className={`${styles.itemsContainer} ${styles.scrollable}`}>
                {itemsForDay.map((item, idx) => {
                  const isPost = item.type === 'post';
                  const bgColor = item.tags && item.tags.length > 0 ? item.tags[0].color : undefined;
                  return (
                    <div
                      key={`${item.type}-${isPost ? item.post_id : item.task_id}-${idx}`}
                      className={styles.item}
                      style={{ backgroundColor: bgColor }}
                      title={isPost ? item.post_title : item.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        isPost ? onPostClick?.(item as CalendarPost) : onTaskClick?.(item as CalendarTask);
                      }}
                    >
                      <span className={styles.itemIcon}>{isPost ? '📄' : '✓'}</span>
                      {truncateText(isPost ? item.post_title : item.title, 14)}
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