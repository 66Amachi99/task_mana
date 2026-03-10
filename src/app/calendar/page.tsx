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
import { CheckCircle, Circle } from 'lucide-react';

type SortType = 'all' | 'posts' | 'tasks';

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'posts' | 'tasks'>('all');

  const { filterPostByRole } = useUser();

  const fetchAllContent = useCallback(async () => {
    try {
      setLoading(true);
      const postsRes = await fetch('/api/posts?limit=100');
      const postsData = await postsRes.json();
      const tasksRes = await fetch('/api/tasks?limit=100');
      const tasksData = await tasksRes.json();

      const postsWithDates = (postsData.posts || []).map((p: any) => ({
        ...p,
        post_date: p.post_date ? new Date(p.post_date) : null,
        post_deadline: new Date(p.post_deadline),
        type: 'post' as const,
      }));

      const tasksWithDates = (tasksData.tasks || []).map((t: any) => ({
        ...t,
        type: 'task' as const,
      }));

      setPosts(postsWithDates);
      setTasks(tasksWithDates);
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
    const handleContentUpdated = () => fetchAllContent();
    window.addEventListener('contentUpdated', handleContentUpdated);
    return () => window.removeEventListener('contentUpdated', handleContentUpdated);
  }, [fetchAllContent]);

  const filterContentForCalendar = useCallback((): CalendarItem[] => {
    let filteredPosts = posts;
    let filteredTasks = tasks;

    if (selectedRoleFilter) {
      filteredPosts = posts.filter(post => filterPostByRole(post, selectedRoleFilter));
    }

    if (viewMode === 'posts') {
      return filteredPosts;
    } else if (viewMode === 'tasks') {
      return filteredTasks;
    } else {
      return [...filteredPosts, ...filteredTasks];
    }
  }, [posts, tasks, selectedRoleFilter, filterPostByRole, viewMode]);

  const itemsByDate = new Map<string, CalendarItem[]>();
  filterContentForCalendar().forEach(item => {
    const dateStr = item.type === 'post'
      ? format(item.post_deadline, 'yyyy-MM-dd')
      : format(new Date(item.end_time), 'yyyy-MM-dd');
    if (!itemsByDate.has(dateStr)) {
      itemsByDate.set(dateStr, []);
    }
    itemsByDate.get(dateStr)!.push(item);
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const allItemsForSelectedDay = itemsByDate.get(selectedDateStr) || [];

  const filteredItems = useMemo(() => {
    let items = allItemsForSelectedDay;
    if (showCompletedOnly) {
      items = items.filter(item => {
        if (item.type === 'post') return item.post_status === 'Завершен';
        else return item.task_status === 'Выполнена';
      });
    }
    return items;
  }, [allItemsForSelectedDay, showCompletedOnly]);

  const dayStats = useMemo(() => {
    const total = allItemsForSelectedDay.length;
    const completed = allItemsForSelectedDay.filter(item => {
      if (item.type === 'post') return item.post_status === 'Завершен';
      else return item.task_status === 'Выполнена';
    }).length;
    const postsCount = allItemsForSelectedDay.filter(item => item.type === 'post').length;
    const tasksCount = allItemsForSelectedDay.filter(item => item.type === 'task').length;
    return { total, completed, postsCount, tasksCount };
  }, [allItemsForSelectedDay]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
    setShowCompletedOnly(false);
  };

  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const handlePostClick = (post: CalendarPost) => {
    setSelectedPost(post);
    setShowPostDetails(true);
  };

  const handleTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleCloseDetails = () => {
    setShowPostDetails(false);
    setShowTaskDetails(false);
    setSelectedPost(null);
    setSelectedTask(null);
  };

  const handleContentUpdate = async () => {
    await fetchAllContent();
  };

  const toggleCompletedFilter = () => setShowCompletedOnly(!showCompletedOnly);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">Загрузка...</div>
        </div>
        <Header
          selectedTaskFilter={selectedRoleFilter}
          onTaskFilterChange={setSelectedRoleFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Основной контент – занимает всё свободное место, с отступом снизу под хэдер */}
      <div className="flex-1 pb-16 flex flex-col min-h-0">
        <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row h-full gap-4">
            {/* Календарь */}
            <div className={`transition-all duration-300 ease-in-out h-full ${isSidebarOpen ? 'w-full lg:w-[70%]' : 'w-full'}`}>
              <div className="h-full">
                <Calendar
                  itemsByDate={itemsByDate}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onPostClick={handlePostClick}
                  onTaskClick={handleTaskClick}
                />
              </div>
            </div>

            {/* Сайдбар */}
            <div className={`transition-all duration-300 ease-in-out h-full overflow-hidden ${isSidebarOpen ? 'w-full lg:w-[30%] opacity-100' : 'w-0 opacity-0'}`}>
              <div className="bg-white rounded-lg h-full flex flex-col w-full min-w-[320px]">
                {/* Заголовок */}
                <div className="flex justify-between items-start mb-4 shrink-0">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="mr-3">📄 Постов: {dayStats.postsCount}</span>
                      <span>✓ Задач: {dayStats.tasksCount}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Готово: {dayStats.completed}/{dayStats.total}
                    </div>
                  </div>
                  <button onClick={handleCloseSidebar} className="text-gray-500 hover:text-gray-700 transition-colors">
                    ✕
                  </button>
                </div>

                {/* Фильтр выполненных */}
                <div className="flex flex-wrap gap-2 mb-4 shrink-0">
                  <button
                    onClick={toggleCompletedFilter}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      showCompletedOnly ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {showCompletedOnly ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    {showCompletedOnly ? 'Готовые' : 'Готовые'}
                  </button>
                </div>

                {/* Список элементов */}
                {filteredItems.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500 flex-1 flex items-center justify-center">
                    {showCompletedOnly ? 'Нет выполненных элементов на этот день' : 'Нет элементов на этот день'}
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto flex-1">
                    {filteredItems.map((item) => {
                      if (item.type === 'post') {
                        return (
                          <div
                            key={`post-${item.post_id}`}
                            className={`bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                              item.post_status === 'Завершен' ? 'border-green-400 bg-green-50' : 'border-blue-400'
                            }`}
                            onClick={() => handlePostClick(item)}
                          >
                            <h3 className="font-semibold text-gray-800 truncate" title={item.post_title}>
                              {item.post_title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={item.post_description}>
                              {item.post_description}
                            </p>
                            <div className="flex items-center mt-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getPostStatus(item))}`}>
                                {getPostStatus(item)}
                              </span>
                            </div>
                          </div>
                        );
                      } else {
                        const isCompleted = item.task_status === 'Выполнена';
                        return (
                          <div
                            key={`task-${item.task_id}`}
                            className={`bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                              isCompleted ? 'border-green-400 bg-green-50' : 'border-purple-400'
                            }`}
                            onClick={() => handleTaskClick(item)}
                          >
                            <h3 className="font-semibold text-gray-800 truncate" title={item.title}>
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={item.description || ''}>
                              {item.description || 'Нет описания'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                isCompleted ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.task_status}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Хэдер снизу */}
      <Header
        selectedTaskFilter={selectedRoleFilter}
        onTaskFilterChange={setSelectedRoleFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Модалки */}
      {showPostDetails && selectedPost && (
        <PostDetailsWindow post={selectedPost} onClose={handleCloseDetails} onSuccess={handleContentUpdate} />
      )}
      {showTaskDetails && selectedTask && (
        <TaskDetailsWindow task={selectedTask} onClose={handleCloseDetails} onSuccess={handleContentUpdate} />
      )}
    </div>
  );
}