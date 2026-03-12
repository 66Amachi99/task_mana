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
import styles from '../../components/styles/CalendarPage.module.css';

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

  const currentMonth = new Date();
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
    
    let cardClass = '';
    if (isPost) {
      cardClass = isCompleted ? styles.itemCardPostCompleted : styles.itemCardPostNotCompleted;
    } else {
      cardClass = isCompleted ? styles.itemCardTaskCompleted : styles.itemCardTaskNotCompleted;
    }

    return (
      <div
        key={`${item.type}-${isPost ? item.post_id : item.task_id}`}
        onClick={() => handleItemClick(item)}
        className={cardClass}
      >
        <h3 className={styles.itemTitle}>
          {isPost ? item.post_title : item.title}
        </h3>
        <p className={styles.itemDescription}>
          {isPost ? item.post_description : (item.description || 'Нет описания')}
        </p>
        <div className={styles.itemFooter}>
          <span className={`${styles.itemStatus} ${
            isPost 
              ? getStatusColor(getPostStatus(item)) // глобальные классы, оставляем как есть
              : (isCompleted ? styles.itemStatusTaskCompleted : styles.itemStatusTaskNotCompleted)
          }`}>
            {isPost ? getPostStatus(item) : item.task_status}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Загрузка...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerPlaceholder}>
        <Header />
      </div>

      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          
          <div className={`${styles.calendarWrapper} ${
            isSidebarOpen ? styles.calendarWrapperWithSidebar : styles.calendarWrapperFull
          }`}>
            <div className={styles.calendarContainer}>
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

          <aside className={`${styles.sidebar} ${
            isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
          }`}>
            <div className={styles.sidebarContent}>
              <div className={styles.sidebarHeader}>
                <div>
                  <h2 className={styles.dateTitle}>
                    {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                  </h2>
                  <div className={styles.statsRow}>
                    <span>📄 {dayStats.postsCount} постов</span>
                    <span>✅ {dayStats.tasksCount} задач</span>
                    <span className={styles.statsCompleted}>✓ {dayStats.completed} выполнено</span>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className={styles.closeButton}>
                  <X className={styles.closeIcon} />
                </button>
              </div>

              <button
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
                className={`${styles.filterButton} ${
                  showCompletedOnly ? styles.filterButtonActive : styles.filterButtonInactive
                }`}
              >
                {showCompletedOnly ? (
                  <CheckCircle className={styles.filterIcon} />
                ) : (
                  <Circle className={styles.filterIcon} />
                )}
                {showCompletedOnly ? 'Только выполненные' : 'Все статусы'}
              </button>

              <div className={`${styles.itemsList} custom-scrollbar`}>
                {filteredDayItems.length === 0 ? (
                  <div className={styles.emptyState}>
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