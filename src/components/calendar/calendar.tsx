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
} from 'date-fns';
import { ru } from 'date-fns/locale';

interface Post {
  post_id: number;
  post_title: string;
  post_type: string;
  post_deadline: Date;
}

interface CalendarProps {
  postsByDate: Map<string, Post[]>;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  showMyTasks: boolean;
  hasAccessToPost: (post: Post) => boolean;
}

const typeEmoji: Record<string, string> = {
  'Видео': '🎥',
  'Фотопост': '📷',
  'Афиша': '🎫',
  'Светлана Юрьевна': '👥',
  'Рубрика': '📑',
  'ЧЕ': '⭐',
};

const getEmojiForType = (type: string): string => {
  if (typeEmoji[type]) return typeEmoji[type];
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('видео')) return '🎥';
  if (lowerType.includes('фото')) return '📷';
  if (lowerType.includes('афиш')) return '🎫';
  if (lowerType.includes('светлан') || lowerType.includes('юрьев')) return '👥';
  if (lowerType.includes('рубрик')) return '📑';
  if (lowerType.includes('че')) return '⭐';
  
  return type.charAt(0).toUpperCase();
};

export const Calendar: React.FC<CalendarProps> = ({
  postsByDate,
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

  const getPostsForDay = (day: Date): Post[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return postsByDate.get(dateStr) || [];
  };

  return (
    <div className="bg-white rounded-lg shadow p-2 md:p-4">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={handlePrevMonth} 
          className="px-2 md:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-base md:text-lg cursor-pointer"
        >
          ←
        </button>
        <h2 className="text-base md:text-xl font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h2>
        <button 
          onClick={handleNextMonth} 
          className="px-2 md:px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-base md:text-lg cursor-pointer"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-center font-medium text-gray-600 mb-2 text-xs md:text-sm">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16 md:h-32 bg-gray-50 rounded" />
        ))}

        {days.map(day => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentDay = isToday(day);
          const postsForDay = getPostsForDay(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                h-16 md:h-32 p-1 md:p-2 border rounded cursor-pointer transition-colors flex flex-col
                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-100'}
                ${isCurrentDay ? 'ring-1 md:ring-2 ring-yellow-400' : ''}
                ${postsForDay.length === 0 ? 'opacity-50' : ''}
              `}
            >
              <div className="text-right text-xs md:text-sm mb-1">{format(day, 'd')}</div>
              <div className="flex flex-wrap gap-0.5 md:gap-2 items-start justify-start overflow-y-auto flex-1 content-start no-scrollbar">
                {postsForDay.map((post, idx) => {
                  const emoji = getEmojiForType(post.post_type);
                  return (
                    <span key={idx} className="text-sm md:text-2xl" title={`${post.post_type}: ${post.post_title}`}>
                      {emoji}
                    </span>
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