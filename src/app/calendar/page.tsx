'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/layout/Header/Header';
import { Calendar } from '../../components/calendar/calendar';
import { PostDetailsWindow } from '@/components/shared/post_details_window';
import { TaskDetailsWindow } from '@/components/shared/task_details_window';
import { PostAddWindow } from '@/components/shared/post_add_window';
import { TaskAddWindow } from '@/components/shared/task_add_window';
import { format } from 'date-fns';
import { useUser } from '../../hooks/use-roles';
import { CalendarPost, CalendarTask, CalendarItem } from '../../../types/calendar';
import { X } from 'lucide-react';
import { ru } from 'date-fns/locale';
import styles from '../../components/styles/CalendarPage.module.css';

// Вспомогательная функция для цвета статусного кружка
const getStatusDotColor = (item: CalendarItem): string => {
  if (item.type === 'post') {
    return item.post_status === 'Завершен' ? '#449627' : '#FFCC00';
  } else {
    return item.task_status === 'Выполнена' ? '#449627' : '#FFCC00';
  }
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ post?: CalendarPost; task?: CalendarTask } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Фильтры для календаря
  const [calendarShowPosts, setCalendarShowPosts] = useState(true);
  const [calendarShowTasks, setCalendarShowTasks] = useState(true);

  // Фильтры для сайдбара
  const [sidebarShowPosts, setSidebarShowPosts] = useState(true);
  const [sidebarShowTasks, setSidebarShowTasks] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  // Состояния для модалок создания
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const { user, filterPostByRole, canCreateTask } = useUser();
  const canAddPost = user && (user.admin_role || user.SMM_role);

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

  // Полный маппинг всех элементов по датам (без фильтрации)
  const allItemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    const allItems: CalendarItem[] = [
      ...posts.map(p => ({ ...p, type: 'post' as const })),
      ...tasks.map(t => ({ ...t, type: 'task' as const }))
    ];

    allItems.forEach(item => {
      const date = item.type === 'post' ? item.post_deadline : new Date(item.end_time);
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(item);
    });
    return map;
  }, [posts, tasks]);

  // Статистика для выбранного дня (полная)
  const dayStats = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const items = allItemsByDate.get(dateStr) || [];
    return {
      items,
      total: items.length,
      postsCount: items.filter(i => i.type === 'post').length,
      tasksCount: items.filter(i => i.type === 'task').length
    };
  }, [allItemsByDate, selectedDate]);

  // Отфильтрованные элементы для сайдбара
  const sidebarFilteredItems = useMemo(() => {
    let filtered = dayStats.items;

    // Фильтр по типу
    filtered = filtered.filter(item =>
      (sidebarShowPosts && item.type === 'post') || (sidebarShowTasks && item.type === 'task')
    );

    // Фильтр по готовности
    if (showIncompleteOnly) {
      filtered = filtered.filter(item =>
        item.type === 'post' ? item.post_status !== 'Завершен' : item.task_status !== 'Выполнена'
      );
    }

    return filtered;
  }, [dayStats.items, sidebarShowPosts, sidebarShowTasks, showIncompleteOnly]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
    setShowIncompleteOnly(false);
  };

  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'post') setSelectedItem({ post: item });
    else setSelectedItem({ task: item });
  };

  // Обработчики для кнопок в календаре
  const handleCalendarPostsClick = () => {
    if (calendarShowPosts && calendarShowTasks) {
      setCalendarShowPosts(false);
      setCalendarShowTasks(true);
    } else if (calendarShowPosts && !calendarShowTasks) {
      setCalendarShowPosts(false);
      setCalendarShowTasks(true);
    } else if (!calendarShowPosts && calendarShowTasks) {
      setCalendarShowPosts(true);
      setCalendarShowTasks(true);
    }
  };

  const handleCalendarTasksClick = () => {
    if (calendarShowPosts && calendarShowTasks) {
      setCalendarShowPosts(true);
      setCalendarShowTasks(false);
    } else if (calendarShowPosts && !calendarShowTasks) {
      setCalendarShowPosts(true);
      setCalendarShowTasks(true);
    } else if (!calendarShowPosts && calendarShowTasks) {
      setCalendarShowPosts(true);
      setCalendarShowTasks(false);
    }
  };

  // Обработчики для кнопок в сайдбаре
  const handleSidebarPostsClick = () => {
    if (sidebarShowPosts && sidebarShowTasks) {
      setSidebarShowPosts(false);
      setSidebarShowTasks(true);
    } else if (sidebarShowPosts && !sidebarShowTasks) {
      setSidebarShowPosts(false);
      setSidebarShowTasks(true);
    } else if (!sidebarShowPosts && sidebarShowTasks) {
      setSidebarShowPosts(true);
      setSidebarShowTasks(true);
    }
  };

  const handleSidebarTasksClick = () => {
    if (sidebarShowPosts && sidebarShowTasks) {
      setSidebarShowPosts(true);
      setSidebarShowTasks(false);
    } else if (sidebarShowPosts && !sidebarShowTasks) {
      setSidebarShowPosts(true);
      setSidebarShowTasks(true);
    } else if (!sidebarShowPosts && sidebarShowTasks) {
      setSidebarShowPosts(true);
      setSidebarShowTasks(false);
    }
  };

  // Обработчики для кнопок в хедере (с подстановкой даты)
  const handleOpenPostModal = () => {
    setShowAddPostModal(true);
  };

  const handleOpenTaskModal = () => {
    setShowAddTaskModal(true);
  };

  const renderCard = (item: CalendarItem) => {
    const isPost = item.type === 'post';
    const firstTag = item.tags && item.tags.length > 0 ? item.tags[0] : null;

    const deadline = isPost
      ? new Date(item.post_deadline)
      : new Date(item.end_time);
    const timeStr = deadline.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dotColor = getStatusDotColor(item);
    const bgGradient = firstTag
      ? `radial-gradient(100% 100% at 50% 0%, color-mix(in srgb, ${firstTag.color}, transparent 70%) 0%, rgba(72, 200, 132, 0) 100%)`
      : 'none';

    return (
      <div
        key={`${item.type}-${isPost ? item.post_id : item.task_id}`}
        onClick={() => handleItemClick(item)}
        className={styles.sidebarCard}
        style={{ backgroundImage: bgGradient }}
      >
        <div className={styles.sidebarCardHeader}>
          <span className={styles.sidebarCardTime}>{timeStr}</span>
          <span
            className={styles.sidebarCardStatus}
            style={{ backgroundColor: dotColor }}
          />
        </div>
        <h3 className={styles.sidebarCardTitle}>
          {isPost ? item.post_title : item.title}
        </h3>
        {!isPost && item.description && (
          <p className={styles.sidebarCardDescription}>{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className={styles.sidebarCardTags}>
            {item.tags.map(tag => (
              <span
                key={tag.tag_id}
                className={styles.sidebarCardTag}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
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
        <Header
          onOpenPostModal={handleOpenPostModal}
          onOpenTaskModal={handleOpenTaskModal}
        />
      </div>

      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <div className={`${styles.calendarWrapper} ${
            isSidebarOpen ? styles.calendarWrapperWithSidebar : styles.calendarWrapperFull
          }`}>
            <div className={styles.calendarContainer}>
              <Calendar
                itemsByDate={allItemsByDate}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onPostClick={(p) => handleItemClick(p)}
                onTaskClick={(t) => handleItemClick(t)}
                showPosts={calendarShowPosts}
                showTasks={calendarShowTasks}
                selectedRoleFilter={selectedRoleFilter}
                onRoleFilterChange={setSelectedRoleFilter}
                totalPostsCount={postsInMonth}
                totalTasksCount={tasksInMonth}
                handlePostsClick={handleCalendarPostsClick}
                handleTasksClick={handleCalendarTasksClick}
              />
            </div>
          </div>

          <aside className={`${styles.sidebar} ${
            isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
          }`}>
            <div className={styles.sidebarContent}>
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarHeaderTitle}>
                  <h2 className={styles.dateTitle}>
                    {format(selectedDate, 'dd', { locale: ru })} {format(selectedDate, 'EEEE', { locale: ru }).replace(/^./, c => c.toUpperCase())}
                  </h2>
                  <button onClick={() => setIsSidebarOpen(false)} className={styles.closeButton}>
                    <X className={styles.closeIcon} />
                  </button>
                </div>

                <div className={styles.statsWrapper}>
                  {/* Кликабельные строки статистики */}
                  <button
                    onClick={handleSidebarPostsClick}
                    className={`${styles.statsRowPosts} ${sidebarShowPosts ? styles.active : ''}`}
                  >
                    <span>Постов {dayStats.postsCount}</span>
                  </button>
                  <button
                    onClick={handleSidebarTasksClick}
                    className={`${styles.statsRowTasks} ${sidebarShowTasks ? styles.active : ''}`}
                  >
                    <span>Задач {dayStats.tasksCount}</span>
                  </button>

                  <button
                    onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                    className={`${styles.filterButton} ${
                      showIncompleteOnly ? styles.filterButtonActive : styles.filterButtonInactive
                    }`}
                  >
                    Не готовые
                  </button>
                </div>
              </div>

              <div className={`${styles.itemsList} no-scrollbar`}>
                {sidebarFilteredItems.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Событий нет</p>
                  </div>
                ) : (
                  sidebarFilteredItems.map(renderCard)
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

      {/* Модалки создания с подстановкой даты */}
      {showAddPostModal && (
        <PostAddWindow
          onClose={() => setShowAddPostModal(false)}
          onPostAdded={async () => {
            await fetchAllContent();
            setShowAddPostModal(false);
          }}
          initialDate={selectedDate}
        />
      )}
      {showAddTaskModal && (
        <TaskAddWindow
          onClose={() => setShowAddTaskModal(false)}
          onTaskAdded={async () => {
            await fetchAllContent();
            setShowAddTaskModal(false);
          }}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}