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
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarItem, DayStats, MonthStats, CalendarPost, CalendarTask } from '../../../types/calendar';

interface CalendarProps {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPostClick?: (post: CalendarPost) => void;
  onTaskClick?: (task: CalendarTask) => void;
}

// Функция для получения дня недели в формате "ПН", "ВТ" и т.д.
const getDayOfWeekShort = (date: Date): string => {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  return days[getDay(date)];
};

// Функция для подсчета статистики дня
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

// Функция для подсчета статистики месяца
const getMonthStats = (itemsByDate: Map<string, CalendarItem[]>): MonthStats => {
  let postsTotal = 0;
  let tasksTotal = 0;
  
  itemsByDate.forEach((items) => {
    postsTotal += items.filter(item => item.type === 'post').length;
    tasksTotal += items.filter(item => item.type === 'task').length;
  });
  
  return { postsTotal, tasksTotal };
};

// Максимальное количество элементов для отображения в ячейке
const MAX_VISIBLE_ITEMS = 3;

export const Calendar: React.FC<CalendarProps> = ({
  itemsByDate,
  selectedDate,
  onDateSelect,
  onPostClick,
  onTaskClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Подсчет статистики месяца
  const monthStats = useMemo(() => getMonthStats(itemsByDate), [itemsByDate]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      {/* Заголовок с месяцем и статистикой справа */}
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
          <div className="flex gap-3 text-sm bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="text-blue-600 flex items-center gap-1">
              <span>Постов</span> {monthStats.postsTotal}
            </span>
            <span className="text-purple-600 flex items-center gap-1">
              <span>Задач</span> {monthStats.tasksTotal}
            </span>
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
          
          // Формат даты: "14 ЧТ"
          const dayNumber = format(day, 'd');
          const dayOfWeek = getDayOfWeekShort(day);
          
          // Определяем, сколько элементов показывать
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
              style={{ height: '100%', minHeight: '80px' }}
            >
              {/* Верхняя строка: дата слева, счетчик справа */}
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
              
              {/* Элементы (только первые MAX_VISIBLE_ITEMS) */}
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
                
                {/* Индикатор скрытых элементов */}
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