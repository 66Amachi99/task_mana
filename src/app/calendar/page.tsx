'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/shared/header';
import { Calendar } from '../../components/calendar/calendar';
import { PostDetailsWindow } from '@/components/shared/post_details_window';
import { TaskDetailsWindow } from '@/components/shared/task_details_window';
import { format } from 'date-fns';
import { getPostStatus, getStatusColor } from '../../lib/post-status';
import { CalendarAddButton } from '@/components/shared/calendar_add_button';
import { useUser, ROLE_FILTERS } from '../../hooks/use-roles';
import { CalendarPost, CalendarTask, CalendarItem } from '../../../types/calendar';

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

  const { user, filterPostByRole } = useUser();

  const fetchAllContent = useCallback(async () => {
    try {
      setLoading(true);
      
      const postsRes = await fetch('/api/posts?limit=100');
      const postsData = await postsRes.json();
      
      // Загружаем задачи (автоматически фильтруются на сервере)
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
    const handleContentUpdated = () => {
      fetchAllContent();
    };

    window.addEventListener('contentUpdated', handleContentUpdated);
    return () => {
      window.removeEventListener('contentUpdated', handleContentUpdated);
    };
  }, [fetchAllContent]);

  const filterContentForCalendar = useCallback((): CalendarItem[] => {
    let filteredPosts = posts;
    let filteredTasks = tasks;
    
    if (selectedRoleFilter) {
      filteredPosts = posts.filter(post => filterPostByRole(post, selectedRoleFilter));
    }
    
    return [...filteredPosts, ...filteredTasks];
  }, [posts, tasks, selectedRoleFilter, filterPostByRole]);

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
  const itemsForSelectedDay = itemsByDate.get(selectedDateStr) || [];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

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

  const getTaskPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTaskPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'Высокий';
      case 2: return 'Средний';
      default: return 'Низкий';
    }
  };

  if (loading) {
    return (
      <div>
        <Header 
          selectedTaskFilter={selectedRoleFilter} 
          onTaskFilterChange={setSelectedRoleFilter}
        />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-10">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        selectedTaskFilter={selectedRoleFilter} 
        onTaskFilterChange={setSelectedRoleFilter}
      />
      <div className="h-[calc(100vh-80px)] w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-8 h-full transition-all duration-300">
          <div className={`transition-all duration-300 h-full ${
            isSidebarOpen ? 'lg:w-[70%]' : 'lg:w-full'
          }`}>
            <div className="h-full">
              <Calendar
                itemsByDate={itemsByDate}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>
          </div>

          {isSidebarOpen && (
            <div className="lg:w-[30%] h-full animate-slideIn">
              <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h2 className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString('ru-RU', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h2>
                  <button
                    onClick={handleCloseSidebar}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                {itemsForSelectedDay.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    Нет элементов на этот день
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                    {itemsForSelectedDay.map((item) => {
                      if (item.type === 'post') {
                        return (
                          <div 
                            key={`post-${item.post_id}`} 
                            className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-400"
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
                        const priorityColor = getTaskPriorityColor(item.priority);
                        const priorityLabel = getTaskPriorityLabel(item.priority);
                        
                        return (
                          <div 
                            key={`task-${item.task_id}`} 
                            className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-400"
                            onClick={() => handleTaskClick(item)}
                          >
                            <h3 className="font-semibold text-gray-800 truncate" title={item.title}>
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={item.description || ''}>
                              {item.description || 'Нет описания'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${priorityColor}`}>
                                {priorityLabel}
                              </span>
                              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                {item.task_status}
                              </span>
                              {item.assignees && item.assignees.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {item.assignees[0].user_login}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CalendarAddButton selectedDate={selectedDate} />

      {showPostDetails && selectedPost && (
        <PostDetailsWindow 
          post={selectedPost} 
          onClose={handleCloseDetails} 
          onSuccess={handleContentUpdate}
        />
      )}

      {showTaskDetails && selectedTask && (
        <TaskDetailsWindow 
          task={selectedTask} 
          onClose={handleCloseDetails} 
          onSuccess={handleContentUpdate}
        />
      )}
    </div>
  );
}