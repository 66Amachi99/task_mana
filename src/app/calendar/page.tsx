'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { usePosts } from '@/hooks/usePosts';
import { useTasks } from '@/hooks/useTasks';
import { FilterBar } from '@/components/ui/filter_bar';
import { ROLE_FILTERS } from '@/hooks/use-roles';

type CalendarViewMode = 'all' | 'posts' | 'tasks';

const getStatusDotColor = (item: CalendarItem): string => {
  if (item.type === 'post') {
    return item.post_status === 'Завершен' ? '#449627' : '#FFCC00';
  } else {
    return item.task_status === 'Выполнена' ? '#449627' : '#FFCC00';
  }
};

const getCardBackground = (item: CalendarItem): string => {
  const isCompleted =
    item.type === 'post'
      ? item.post_status === 'Завершен'
      : item.task_status === 'Выполнена';

  if (isCompleted) {
    return 'linear-gradient(90deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 255, 0, 0.15) 100%)';
  }

  const firstTag = item.tags && item.tags.length > 0 ? item.tags[0] : null;

  if (!firstTag) {
    return 'none';
  }

  return `radial-gradient(100% 100% at 50% 0%, color-mix(in srgb, ${firstTag.color}, transparent 70%) 0%, rgba(72, 200, 132, 0) 100%)`;
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<{ post?: CalendarPost; task?: CalendarTask } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('all');
  const [calendarRoleFilter, setCalendarRoleFilter] = useState<string | null>(null);

  const [sidebarShowPosts, setSidebarShowPosts] = useState(true);
  const [sidebarShowTasks, setSidebarShowTasks] = useState(true);
  const [sidebarRoleFilter, setSidebarRoleFilter] = useState<string | null>(null);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  const { filterPostByRole } = useUser();

  const [isSidebarRoleDropdownOpen, setIsSidebarRoleDropdownOpen] = useState(false);
  const sidebarRoleDropdownRef = useRef<HTMLDivElement>(null);

  const { data: postsData, isLoading: postsLoading } = usePosts(1, 100);
  const { data: tasksData, isLoading: tasksLoading } = useTasks(1, 100);

  const posts = useMemo(() => {
    return (postsData?.posts || []).map((p) => ({
      ...p,
      post_date: p.post_date ? new Date(p.post_date) : null,
      post_deadline: new Date(p.post_deadline),
      type: 'post' as const,
    }));
  }, [postsData]);

  const tasks = useMemo(() => {
    return (tasksData?.tasks || []).map((t) => ({
      ...t,
      type: 'task' as const,
    }));
  }, [tasksData]);

  const loading = postsLoading || tasksLoading;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRoleDropdownRef.current && !sidebarRoleDropdownRef.current.contains(event.target as Node)) {
        setIsSidebarRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarItemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    const filteredPosts = calendarRoleFilter
      ? posts.filter(p => filterPostByRole(p, calendarRoleFilter))
      : posts;

    let itemsToShow: CalendarItem[] = [];
    if (calendarViewMode === 'posts') {
      itemsToShow = filteredPosts.map(p => ({ ...p, type: 'post' as const }));
    } else if (calendarViewMode === 'tasks') {
      itemsToShow = tasks.map(t => ({ ...t, type: 'task' as const }));
    } else {
      itemsToShow = [
        ...filteredPosts.map(p => ({ ...p, type: 'post' as const })),
        ...tasks.map(t => ({ ...t, type: 'task' as const }))
      ];
    }

    itemsToShow.forEach(item => {
      const date = item.type === 'post' ? item.post_deadline : new Date(item.end_time);
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(item);
    });

    return map;
  }, [posts, tasks, calendarRoleFilter, filterPostByRole, calendarViewMode]);

  const rawDayItems = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const postsForDay = posts.filter(p => format(p.post_deadline, 'yyyy-MM-dd') === dateStr);
    const tasksForDay = tasks.filter(t => format(t.end_time, 'yyyy-MM-dd') === dateStr);
    return [
      ...postsForDay.map(p => ({ ...p, type: 'post' as const })),
      ...tasksForDay.map(t => ({ ...t, type: 'task' as const }))
    ];
  }, [posts, tasks, selectedDate]);

  const sidebarFilteredItems = useMemo(() => {
    let filtered = rawDayItems;

    if (sidebarRoleFilter) {
      filtered = filtered.filter(item =>
        item.type === 'post' ? filterPostByRole(item, sidebarRoleFilter) : true
      );
    }

    filtered = filtered.filter(item =>
      (sidebarShowPosts && item.type === 'post') || (sidebarShowTasks && item.type === 'task')
    );

    if (showIncompleteOnly) {
      filtered = filtered.filter(item =>
        item.type === 'post' ? item.post_status !== 'Завершен' : item.task_status !== 'Выполнена'
      );
    }

    return filtered;
  }, [rawDayItems, sidebarRoleFilter, sidebarShowPosts, sidebarShowTasks, showIncompleteOnly, filterPostByRole]);

  const dayStats = useMemo(() => {
    const items = rawDayItems;
    return {
      items,
      total: items.length,
      postsCount: items.filter(i => i.type === 'post').length,
      tasksCount: items.filter(i => i.type === 'task').length
    };
  }, [rawDayItems]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
    setShowIncompleteOnly(false);
  };

  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'post') setSelectedItem({ post: item });
    else setSelectedItem({ task: item });
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setCalendarViewMode(mode);
  };

  const handleOpenPostModal = () => {
    setShowAddPostModal(true);
  };

  const handleOpenTaskModal = () => {
    setShowAddTaskModal(true);
  };

  const handleSidebarPostsClick = () => {
    if (sidebarShowPosts) {
      if (sidebarShowTasks) {
        setSidebarShowPosts(false);
      } else {
        setSidebarShowPosts(false);
        setSidebarShowTasks(true);
      }
    } else {
      setSidebarShowPosts(true);
    }
  };

  const handleSidebarTasksClick = () => {
    if (sidebarShowTasks) {
      if (sidebarShowPosts) {
        setSidebarShowTasks(false);
      } else {
        setSidebarShowTasks(false);
        setSidebarShowPosts(true);
      }
    } else {
      setSidebarShowTasks(true);
    }
  };

  const handleCalendarPostsClick = () => {
    setCalendarViewMode(prev => {
      if (prev === 'all') return 'tasks';
      if (prev === 'posts') return 'tasks';
      return 'all';
    });
  };

  const handleCalendarTasksClick = () => {
    setCalendarViewMode(prev => {
      if (prev === 'all') return 'posts';
      if (prev === 'tasks') return 'posts';
      return 'all';
    });
  };

  const getTaskIconsForPost = (post: CalendarPost): string[] => {
    const icons: string[] = [];
    if (post.post_needs_mini_video_smm) icons.push('mini_video_icon.svg');
    if (post.post_needs_video) icons.push('video_icon.svg');
    if (post.post_needs_photogallery) icons.push('photogallery_icon.svg');
    if (post.post_needs_cover_photo) icons.push('coverphoto_icon.svg');
    if (post.post_needs_photo_cards) icons.push('photocards_icon.svg');
    if (post.post_needs_mini_gallery) icons.push('mini_photogallery.svg');
    if (post.post_needs_text) icons.push('text_icon.svg');
    return icons;
  };

  const renderCard = (item: CalendarItem) => {
    const isPost = item.type === 'post';
    const taskIcons = isPost ? getTaskIconsForPost(item as CalendarPost) : [];

    let timeDisplay: string;
    if (isPost) {
      timeDisplay = new Date(item.post_deadline).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } else {
      if (item.all_day) {
        timeDisplay = 'Весь день';
      } else {
        timeDisplay = new Date(item.end_time).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
    }

    const dotColor = getStatusDotColor(item);
    const bgGradient = getCardBackground(item);

    return (
      <div
        key={`${item.type}-${isPost ? item.post_id : item.task_id}`}
        onClick={() => handleItemClick(item)}
        className={styles.sidebarCard}
        style={{ backgroundImage: bgGradient }}
      >
        <div className={styles.sidebarCardHeader}>
          <div className={styles.leftGroup}>
            <span className={styles.sidebarCardTime}>{timeDisplay}</span>
            <span
              className={styles.sidebarCardStatus}
              style={{ backgroundColor: dotColor }}
            />
          </div>
          {taskIcons.length > 0 && (
            <div className={styles.taskIcons}>
              {taskIcons.map(icon => (
                <img
                  key={icon}
                  src={`/icons/${icon}`}
                  alt=""
                  className={styles.taskIcon}
                />
              ))}
            </div>
          )}
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
                itemsByDate={calendarItemsByDate}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onPostClick={(p) => handleItemClick(p)}
                onTaskClick={(t) => handleItemClick(t)}
                showPosts={calendarViewMode === 'all' || calendarViewMode === 'posts'}
                showTasks={calendarViewMode === 'all' || calendarViewMode === 'tasks'}
                selectedRoleFilter={calendarRoleFilter}
                onRoleFilterChange={setCalendarRoleFilter}
                handlePostsClick={handleCalendarPostsClick}
                handleTasksClick={handleCalendarTasksClick}
              />
            </div>
            <div className={styles.calendarFilterBar}>
              <FilterBar
                viewMode={calendarViewMode}
                onViewModeChange={handleViewModeChange}
                roleFilter={calendarRoleFilter}
                onRoleFilterChange={setCalendarRoleFilter}
                postsCount={posts.filter(p => {
                  const date = new Date(p.post_deadline);
                  const currentMonth = new Date();
                  return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
                }).length}
                tasksCount={tasks.filter(t => {
                  const date = new Date(t.end_time);
                  const currentMonth = new Date();
                  return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
                }).length}
                showCounts={true}
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

                  <div className={styles.roleDropdown} ref={sidebarRoleDropdownRef}>
                    <button
                      onClick={() => setIsSidebarRoleDropdownOpen(!isSidebarRoleDropdownOpen)}
                      className={styles.roleDropdownButton}
                    >
                      <span className={styles.roleDropdownText}>
                        <img
                          src={isSidebarRoleDropdownOpen ? '/icons/filter_on.svg' : '/icons/filter.svg'}
                          alt="filter"
                          className={styles.filterIcon}
                        />
                      </span>
                    </button>
                    {isSidebarRoleDropdownOpen && (
                      <div className={styles.roleDropdownMenu}>
                        <button
                          onClick={() => { setSidebarRoleFilter(null); setIsSidebarRoleDropdownOpen(false); }}
                          className={`${styles.roleMenuItem} ${!sidebarRoleFilter ? styles.roleMenuItemActive : ''}`}
                        >
                          Все посты
                        </button>
                        <div className={styles.menuDivider}></div>
                        {ROLE_FILTERS.map((role) => (
                          <button
                            key={role.id}
                            onClick={() => { setSidebarRoleFilter(role.id); setIsSidebarRoleDropdownOpen(false); }}
                            className={`${styles.roleMenuItem} ${sidebarRoleFilter === role.id ? styles.roleMenuItemActive : ''}`}
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
          postId={selectedItem.post.post_id}
          onClose={() => setSelectedItem(null)}
        />
      )}
      {selectedItem?.task && (
        <TaskDetailsWindow
          task={selectedItem.task}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showAddPostModal && (
        <PostAddWindow
          onClose={() => setShowAddPostModal(false)}
          initialDate={selectedDate}
        />
      )}
      {showAddTaskModal && (
        <TaskAddWindow
          onClose={() => setShowAddTaskModal(false)}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}