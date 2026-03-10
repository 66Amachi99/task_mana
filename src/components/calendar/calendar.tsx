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
import { CalendarItem, DayStats, MonthStats, CalendarPost, CalendarTask } from '../../../types/calendar';
import { ROLE_FILTERS } from '@/hooks/use-roles';
import { ChevronDown } from 'lucide-react';

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
  totalPostsCount: number;      // общее количество постов в месяце
  totalTasksCount: number;      // общее количество задач в месяце
}

const MAX_VISIBLE_ITEMS = 3;

const getDayOfWeekShort = (date: Date): string => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  return days[getDay(date)];
};

const getDayStats = (items: CalendarItem[]): DayStats => {
  const posts = items.filter(item => item.type === 'post');
  const tasks = items.filter(item => item.type === 'task');
  const postsCompleted = posts.filter(post => post.post_status === 'Завершен').length;
  const tasksCompleted = tasks.filter(task => task.task_status === 'Выполнена').length;
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
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      {/* Заголовок с фильтрами */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <button 
          onClick={handlePrevMonth} 
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg cursor-pointer"
        >
          ←
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </h2>
          
          {/* Независимые кнопки фильтрации по типу с фиксированными числами */}
          <div className="flex gap-2">
            <button
              onClick={() => onShowPostsChange(!showPosts)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                showPosts ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Постов {totalPostsCount}
            </button>
            <button
              onClick={() => onShowTasksChange(!showTasks)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                showTasks ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Задач {totalTasksCount}
            </button>
          </div>

          {/* Фильтр по ролям */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <span className="max-w-28 truncate">
                {selectedFilterLabel ? `Роль: ${selectedFilterLabel}` : 'Все посты'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isRoleDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button
                  onClick={() => { onRoleFilterChange(null); setIsRoleDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${!selectedRoleFilter ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                >
                  Все посты
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                {ROLE_FILTERS.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => { onRoleFilterChange(role.id); setIsRoleDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${selectedRoleFilter === role.id ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-base">
                        {role.id === 'smm' && '📹'}
                        {role.id === 'photographer' && '📷'}
                        {role.id === 'designer' && '✏️'}
                      </span>
                      <span>{role.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 ml-6">
                      {role.tasks.map(t => t.label).join(' • ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleNextMonth} 
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg cursor-pointer"
        >
          →
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-600 mb-2 text-sm shrink-0">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      {/* Сетка календаря */}
      <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 rounded" />
        ))}

        {days.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const itemsForDay = getItemsForDay(day);
          const dayStats = getDayStats(itemsForDay);
          const posts = itemsForDay.filter(item => item.type === 'post');
          const tasks = itemsForDay.filter(item => item.type === 'task');
          const dayNumber = format(day, 'd');
          const dayOfWeek = getDayOfWeekShort(day);

          const visibleItems = [...posts, ...tasks].slice(0, MAX_VISIBLE_ITEMS);
          const hiddenCount = posts.length + tasks.length - MAX_VISIBLE_ITEMS;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                p-1 border rounded cursor-pointer transition-colors flex flex-col overflow-hidden
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}
                ${isCurrentDay ? 'ring-2 ring-yellow-400' : ''}
                ${!isCurrentMonth ? 'opacity-50' : ''}
              `}
              style={{ minHeight: '80px', height: '100%' }}
            >
              <div className="flex justify-between items-center mb-1 text-xs shrink-0">
                <span className="font-medium">
                  {dayNumber} {dayOfWeek}
                </span>
                {itemsForDay.length > 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    dayStats.completed === dayStats.total 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dayStats.completed}/{dayStats.total}
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                {visibleItems.map((item, idx) => {
                  if (item.type === 'post') {
                    return (
                      <div
                        key={`post-${item.post_id}-${idx}`}
                        className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-blue-200 transition-colors"
                        title={item.post_title}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostClick?.(item as CalendarPost);
                        }}
                      >
                        📄 {truncateText(item.post_title, 12)}
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={`task-${item.task_id}-${idx}`}
                        className="text-xs bg-purple-100 text-purple-800 rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:bg-purple-200 transition-colors"
                        title={item.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick?.(item as CalendarTask);
                        }}
                      >
                        ✓ {truncateText(item.title, 12)}
                      </div>
                    );
                  }
                })}
                
                {hiddenCount > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    +{hiddenCount} еще
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};