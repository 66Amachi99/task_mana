'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/Header/Header';
import { Calendar } from '../../components/calendar/calendar';
import { PostDetailsWindow } from '@/components/shared/post_details_window';
import { TaskDetailsWindow } from '@/components/shared/task_details_window';
import { format } from 'date-fns';
import { getPostStatus, getStatusColor } from '../../lib/post-status';
import { useUser } from '../../hooks/use-roles';
import { CalendarPost, CalendarTask, CalendarItem } from '../../../types/calendar';
import { CheckCircle, Circle, X } from 'lucide-react';
import { ru } from 'date-fns/locale';

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ post?: CalendarPost; task?: CalendarTask } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [showPosts, setShowPosts] = useState(true);
  const [showTasks, setShowTasks] = useState(true);

  const { filterPostByRole } = useUser();

  const fetchAllContent = useCallback(async () => {
    try {
      setLoading(true);
      const [postsRes, tasksRes] = await Promise.all([
        fetch('/api/posts?limit=100'),
        fetch('/api/tasks?limit=100')
      ]);
      
      const postsData = await postsRes.json();
      const tasksData = await tasksRes.json();

      setPosts((postsData.posts || []).map((p: any) => ({
        ...p,
        post_date: p.post_date ? new Date(p.post_date) : null,
        post_deadline: new Date(p.post_deadline),
        type: 'post',
      })));

      setTasks((tasksData.tasks || []).map((t: any) => ({
        ...t,
        type: 'task',
      })));
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllContent();
  }, [fetchAllContent]);

  useEffect(() => {
    const handleUpdate = () => fetchAllContent();
    window.addEventListener('contentUpdated', handleUpdate);
    return () => window.removeEventListener('contentUpdated', handleUpdate);
  }, [fetchAllContent]);

  // Вычисляем общее количество постов и задач за текущий месяц для отображения в кнопках
  const currentMonth = new Date(); // можно передавать из календаря, но для простоты используем текущую дату; на самом деле нужно получать месяц из календаря, но проще вычислять из данных
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const postsInMonth = useMemo(() => {
    return posts.filter(p => {
      const date = new Date(p.post_deadline);
      return date >= monthStart && date <= monthEnd;
    }).length;
  }, [posts, monthStart, monthEnd]);

  const tasksInMonth = useMemo(() => {
    return tasks.filter(t => {
      const date = new Date(t.end_time);
      return date >= monthStart && date <= monthEnd;
    }).length;
  }, [tasks, monthStart, monthEnd]);

  // Формируем itemsByDate с учётом фильтров, но если оба выключены – показываем всё
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    
    const showPostsActual = showPosts || (!showPosts && !showTasks);
    const showTasksActual = showTasks || (!showPosts && !showTasks);
    
    const allItems: CalendarItem[] = [];
    if (showPostsActual) {
      const filtered = selectedRoleFilter 
        ? posts.filter(p => filterPostByRole(p, selectedRoleFilter))
        : posts;
      allItems.push(...filtered);
    }
    if (showTasksActual) allItems.push(...tasks);

    allItems.forEach(item => {
      const date = item.type === 'post' ? item.post_deadline : new Date(item.end_time);
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(item);
    });
    return map;
  }, [posts, tasks, showPosts, showTasks, selectedRoleFilter, filterPostByRole]);

  const dayStats = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const items = itemsByDate.get(dateStr) || [];
    const completed = items.filter(i => 
      i.type === 'post' ? i.post_status === 'Завершен' : i.task_status === 'Выполнена'
    ).length;

    return { 
      items,
      total: items.length, 
      completed, 
      postsCount: items.filter(i => i.type === 'post').length, 
      tasksCount: items.filter(i => i.type === 'task').length 
    };
  }, [itemsByDate, selectedDate]);

  const filteredDayItems = useMemo(() => {
    if (!showCompletedOnly) return dayStats.items;
    return dayStats.items.filter(i => 
      i.type === 'post' ? i.post_status === 'Завершен' : i.task_status === 'Выполнена'
    );
  }, [dayStats.items, showCompletedOnly]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
    setShowCompletedOnly(false);
  };

  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'post') setSelectedItem({ post: item });
    else setSelectedItem({ task: item });
  };

  const renderCard = (item: CalendarItem) => {
    const isPost = item.type === 'post';
    const isCompleted = isPost ? item.post_status === 'Завершен' : item.task_status === 'Выполнена';
    const accentClass = isPost 
      ? (isCompleted ? 'border-green-400 bg-green-50' : 'border-blue-400')
      : (isCompleted ? 'border-green-400 bg-green-50' : 'border-purple-400');

    return (
      <div
        key={`${item.type}-${isPost ? item.post_id : item.task_id}`}
        onClick={() => handleItemClick(item)}
        className={`p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 bg-gray-50 ${accentClass}`}
      >
        <h3 className="font-semibold text-gray-800 truncate">
          {isPost ? item.post_title : item.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {isPost ? item.post_description : (item.description || 'Нет описания')}
        </p>
        <div className="mt-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            isPost ? getStatusColor(getPostStatus(item)) : (isCompleted ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800')
          }`}>
            {isPost ? getPostStatus(item) : item.task_status}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="text-gray-500">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden relative">
      <div className="fixed bottom-0 left-0 w-full z-50">
        <Header />
      </div>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex w-full h-full overflow-hidden">
          
          <div className={`transition-all duration-500 ease-in-out h-full ${isSidebarOpen ? 'w-full lg:w-2/3 xl:w-3/4' : 'w-full'}`}>
            <div className="h-full w-full pb-20">
              <Calendar
                itemsByDate={itemsByDate}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onPostClick={(p) => handleItemClick(p)}
                onTaskClick={(t) => handleItemClick(t)}
                showPosts={showPosts}
                onShowPostsChange={setShowPosts}
                showTasks={showTasks}
                onShowTasksChange={setShowTasks}
                selectedRoleFilter={selectedRoleFilter}
                onRoleFilterChange={setSelectedRoleFilter}
                totalPostsCount={postsInMonth}
                totalTasksCount={tasksInMonth}
              />
            </div>
          </div>

          <aside className={`transition-all duration-500 ease-in-out bg-white flex flex-col overflow-hidden h-full ${
            isSidebarOpen ? 'w-full lg:w-1/3 xl:w-1/4 opacity-100' : 'w-0 opacity-0 invisible'
          }`}>
            <div className="p-4 pl-0 flex flex-col h-full min-w-[320px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                  </h2>
                  <div className="flex gap-3 mt-1 text-xs font-medium text-gray-500">
                    <span>📄 {dayStats.postsCount} постов</span>
                    <span>✅ {dayStats.tasksCount} задач</span>
                    <span className="text-green-600">✓ {dayStats.completed} выполнено</span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <button
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
                className={`mb-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg border transition-all text-sm font-medium ${
                  showCompletedOnly ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {showCompletedOnly ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {showCompletedOnly ? 'Только выполненные' : 'Все статусы'}
              </button>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {filteredDayItems.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed">
                    <p>{showCompletedOnly ? 'Нет выполненных' : 'Событий нет'}</p>
                  </div>
                ) : (
                  filteredDayItems.map(renderCard)
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {selectedItem?.post && (
        <PostDetailsWindow 
          post={selectedItem.post} 
          onClose={() => setSelectedItem(null)} 
          onSuccess={fetchAllContent} 
        />
      )}
      {selectedItem?.task && (
        <TaskDetailsWindow 
          task={selectedItem.task} 
          onClose={() => setSelectedItem(null)} 
          onSuccess={fetchAllContent} 
        />
      )}
    </div>
  );
}