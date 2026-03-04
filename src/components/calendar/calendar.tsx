'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { CalendarItem } from '../../../types/calendar';

interface CalendarProps {
  itemsByDate: Map<string, CalendarItem[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  itemsByDate,
  selectedDate,
  onDateSelect,
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <button 
          onClick={handlePrevMonth} 
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg cursor-pointer"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h2>
        <button 
          onClick={handleNextMonth} 
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-lg cursor-pointer"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-600 mb-2 text-sm shrink-0">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-gray-50 rounded" />
        ))}

        {days.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const itemsForDay = getItemsForDay(day);
          
          const posts = itemsForDay.filter(item => item.type === 'post');
          const tasks = itemsForDay.filter(item => item.type === 'task');

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
            >
              <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
              
              {posts.slice(0, 2).map((post, idx) => (
                <div
                  key={`post-${idx}`}
                  className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-0.5 truncate"
                  title={post.post_title}
                >
                  📄 {truncateText(post.post_title, 15)}
                </div>
              ))}
              
              {tasks.slice(0, 2).map((task, idx) => (
                <div
                  key={`task-${idx}`}
                  className="text-xs bg-purple-100 text-purple-800 rounded px-1 py-0.5 mb-0.5 truncate"
                  title={task.title}
                >
                  ✓ {truncateText(task.title, 15)}
                </div>
              ))}
              
              {posts.length + tasks.length > 4 && (
                <div className="text-xs text-gray-500 mt-0.5">
                  +{posts.length + tasks.length - 4} еще
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};