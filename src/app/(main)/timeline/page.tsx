'use client';

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Layers, User, CalendarDays, ZoomIn, ZoomOut } from 'lucide-react';
import { Loading } from '@/components/ui/loading/loading';
import { useUser, ROLE_FILTERS } from '@/hooks/use-roles';
import { format, differenceInDays, startOfDay, endOfDay, addDays, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { PostDetailsWindow } from '@/components/shared/post-details-window/post-details-window';
import { TaskDetailsWindow } from '@/components/shared/task-details-window/task-details-window';
import type { Task } from '@/types';
import styles from './TimelinePage.module.css';

interface TimelinePost {
  post_id: number;
  post_title: string;
  post_date: string | null;
  post_deadline: string;
  post_status: string;
  user: { user_id: number; user_login: string; } | null;
  tags: Array<{ tag: { tag_id: number; name: string; color: string; }; }>;
  [key: string]: any;
}

interface TimelineTask {
  task_id: number;
  title: string;
  start_time: string;
  end_time: string;
  task_status: string;
  assignees: Array<{ user: { user_id: number; user_login: string; }; }>;
  tags: Array<{ tag: { tag_id: number; name: string; color: string; }; }>;
}

interface TimelineData {
  posts: TimelinePost[];
  tasks: TimelineTask[];
}

// Предотвращение ошибок SSR в Next.js при использовании useLayoutEffect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const ZOOM_LEVELS = [40, 80, 120, 160];
const ZOOM_LABELS = ['50%', '100%', '150%', '200%'];
const DEFAULT_ZOOM_INDEX = 1;

const LANE_HEIGHT = 52;
const CARD_HEIGHT = 38;

export default function TimelinePage() {
  const [filterMy, setFilterMy] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const { user } = useUser();
  const viewportRef = useRef<HTMLDivElement>(null);

  // Ссылки для логики Drag-to-Scroll (перетаскивание мышью)
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ left: 0, top: 0 });
  const dragDistance = useRef(0);

  // Ссылки для предотвращения дерганья при зуме
  const centerDayRef = useRef<number | null>(null);
  const hasAutoScrolled = useRef(false);

  const DAY_WIDTH = ZOOM_LEVELS[zoomIndex];

  // Следим за системной темой
  useEffect(() => {
    const checkTheme = () => {
      const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
      if (current) setTheme(current);
    };
    checkTheme();
    window.addEventListener('theme-change', checkTheme);
    return () => window.removeEventListener('theme-change', checkTheme);
  }, []);

  // Сброс флага автоскролла при переключении фильтров "Все / Мои"
  // useEffect(() => {
  //   hasAutoScrolled.current = false;
  // }, [filterMy]);

  // Запрос данных
  const { data, isLoading, isError } = useQuery<TimelineData>({
    queryKey: ['timeline', filterMy],
    queryFn: async () => {
      const res = await fetch(`/api/timeline?filterMy=${filterMy}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    },
    refetchInterval: 60000,
    retry: 1
  });

  // Фильтрация данных
  const filteredData = useMemo(() => {
    if (!data || !user) return { posts: [], tasks: [] };

    const isAdminOrSmm = user.admin_role || user.SMM_role;

    // Задачи: админ и смм видят все, остальные — только свои (независимо от фильтра)
    const visibleTasks = isAdminOrSmm
      ? data.tasks
      : data.tasks.filter(task => task.assignees.some(a => a.user.user_id === user.id));

    if (!filterMy) {
      return { posts: data.posts, tasks: visibleTasks };
    }

    // Режим "Мои" — дополнительно фильтруем посты по ролям
    const userRoles: string[] = [];
    if (user.SMM_role) userRoles.push('smm');
    if (user.photographer_role) userRoles.push('photographer');
    if (user.designer_role) userRoles.push('designer');

    const filteredPosts = data.posts.filter(post =>
      userRoles.some(roleId => {
        const roleFilter = ROLE_FILTERS.find(r => r.id === roleId);
        if (!roleFilter) return false;
        return roleFilter.tasks.some(task => post[task.field as keyof TimelinePost] === true);
      })
    );

    const filteredTasks = visibleTasks.filter(task =>
      task.assignees.some(a => a.user.user_id === user.id)
    );

    return { posts: filteredPosts, tasks: filteredTasks };
  }, [data, filterMy, user]);

  // Вычисление границ временной шкалы
  const timeRange = useMemo(() => {
    const dates: Date[] = [];
    if (filteredData.posts.length === 0 && filteredData.tasks.length === 0) {
      const today = new Date();
      return { min: startOfDay(addDays(today, -3)), max: endOfDay(addDays(today, 14)) };
    }
    filteredData.posts.forEach(p => { 
      if (p.post_date) dates.push(new Date(p.post_date)); 
      dates.push(new Date(p.post_deadline)); 
    });
    filteredData.tasks.forEach(t => { 
      dates.push(new Date(t.start_time)); 
      dates.push(new Date(t.end_time)); 
    });
    return {
      min: startOfDay(addDays(new Date(Math.min(...dates.map(d => d.getTime()))), -3)),
      max: endOfDay(addDays(new Date(Math.max(...dates.map(d => d.getTime()))), 7))
    };
  }, [filteredData]);

  // Массив дней для построения колонок сетки
  const daysArray = useMemo(() => {
    const days: Date[] = [];
    const totalDays = differenceInDays(timeRange.max, timeRange.min) + 1;
    for (let i = 0; i < totalDays; i++) days.push(addDays(timeRange.min, i));
    return days;
  }, [timeRange]);

  const totalWidth = daysArray.length * DAY_WIDTH;

  // Алгоритм построения дорожек для элементов (Lanes)
  const arrangeItemsInLanes = <T extends { start: Date; end: Date }>(items: T[]) => {
    const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
    const lanes: number[] = [];

    return sorted.map(item => {
      const startOffset = differenceInDays(startOfDay(item.start), timeRange.min);
      const duration = Math.max(1, differenceInDays(endOfDay(item.end), startOfDay(item.start)) + 1);
      
      const left = (startOffset * DAY_WIDTH) + 2;
      const width = (duration * DAY_WIDTH) - 4; 

      const rightBuffer = left + width + 4;
      let laneIndex = lanes.findIndex(laneEnd => laneEnd <= left);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(rightBuffer);
      } else {
        lanes[laneIndex] = rightBuffer;
      }

      return {
        ...item,
        lane: laneIndex,
        style: { left: `${left}px`, width: `${width}px`, top: `${laneIndex * LANE_HEIGHT}px` }
      };
    });
  };

  const postsWithLanes = useMemo(() => arrangeItemsInLanes(
    filteredData.posts.map(p => ({ ...p, start: p.post_date ? new Date(p.post_date) : new Date(p.post_deadline), end: new Date(p.post_deadline) }))
  ), [filteredData.posts, timeRange, DAY_WIDTH]);

  const tasksWithLanes = useMemo(() => arrangeItemsInLanes(
    filteredData.tasks.map(t => ({ ...t, start: new Date(t.start_time), end: new Date(t.end_time) }))
  ), [filteredData.tasks, timeRange, DAY_WIDTH]);

  const postsSectionHeight = postsWithLanes.length > 0 ? (Math.max(...postsWithLanes.map(p => p.lane), 0) + 1) * LANE_HEIGHT + 16 : 0;
  const tasksSectionHeight = tasksWithLanes.length > 0 ? (Math.max(...tasksWithLanes.map(t => t.lane), 0) + 1) * LANE_HEIGHT + 16 : 0;

  // Позиционирование на текущую дату "Сегодня"
  const scrollToToday = () => {
    if (!viewportRef.current) return;
    const today = new Date();
    const offsetDays = differenceInDays(today, timeRange.min);
    const viewportWidth = viewportRef.current.clientWidth;
    const targetScroll = (offsetDays * DAY_WIDTH) - (viewportWidth / 3);
    viewportRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
  };

  // Автоматический скролл к сегодняшней дате один раз при загрузке данных
  useEffect(() => {
    if (!isLoading && data && !hasAutoScrolled.current) {
      setTimeout(() => {
        scrollToToday();
        hasAutoScrolled.current = true;
      }, 100);
    }
  }, [isLoading, data]);

  // Изменение зума с запоминанием фокусного центра до обновления DOM
  const changeZoom = (delta: number) => {
    if (!viewportRef.current) return;
    const newIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, zoomIndex + delta));
    if (newIndex === zoomIndex) return;

    const container = viewportRef.current;
    // Запоминаем, какая временная точка (в днях) была строго по центру экрана
    centerDayRef.current = (container.scrollLeft + container.clientWidth / 2) / DAY_WIDTH;
    
    setZoomIndex(newIndex);
  };

  // Синхронный скролл-корректор перед тем как браузер выполнит отрисовку (Paint)
  useIsomorphicLayoutEffect(() => {
    if (!viewportRef.current || centerDayRef.current === null) return;
    
    const container = viewportRef.current;
    const newScrollLeft = (centerDayRef.current * DAY_WIDTH) - (container.clientWidth / 2);
    
    container.scrollLeft = Math.max(0, newScrollLeft);
    centerDayRef.current = null; // Очищаем ссылку
  }, [zoomIndex, DAY_WIDTH]);

  // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ КУРСОРОМ (Drag-to-Scroll) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewportRef.current) return;
    isDragging.current = true;
    dragDistance.current = 0;
    startPos.current = { x: e.pageX, y: e.pageY };
    scrollPos.current = {
      left: viewportRef.current.scrollLeft,
      top: viewportRef.current.scrollTop
    };
    viewportRef.current.classList.add(styles.isDragging);
  };

  const stopDragging = () => {
    isDragging.current = false;
    if (viewportRef.current) {
      viewportRef.current.classList.remove(styles.isDragging);
    }
  };

  const DRAG_SPEED = 1.5;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !viewportRef.current) return;
    e.preventDefault();
    const dx = e.pageX - startPos.current.x;
    const dy = e.pageY - startPos.current.y;
    dragDistance.current = Math.abs(dx) + Math.abs(dy);
    viewportRef.current.scrollLeft = scrollPos.current.left - dx * DRAG_SPEED;
    viewportRef.current.scrollTop = scrollPos.current.top - dy * DRAG_SPEED;
  };

  const handleCardClick = (e: React.MouseEvent, action: () => void) => {
    if (dragDistance.current > 5) return;
    e.stopPropagation();
    action();
  };

  if (isLoading) return <Loading text='Загрузка таймлайна...' />;
  if (isError || !data) return <div className={styles.page} data-theme={theme}><div className={styles.noData}>Ошибка загрузки данных</div></div>;

  return (
    <>
    <div className={styles.page} data-theme={theme}>
      <div className={styles.bgOverlay} />
      
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTitles}>
            <h1 className={styles.pageTitle}>Таймлайн</h1>
            {/* <p className={styles.pageSubtitle}>График задач и постов</p> */}
          </div>
          
          <div className={styles.headerControls}>
            <div className={styles.zoomControl}>
              <button className={styles.zoomBtn} onClick={() => changeZoom(-1)} disabled={zoomIndex === 0} title="Уменьшить">
                <ZoomOut size={16} />
              </button>
              <span className={styles.zoomLabel}>{ZOOM_LABELS[zoomIndex]}</span>
              <button className={styles.zoomBtn} onClick={() => changeZoom(1)} disabled={zoomIndex === ZOOM_LEVELS.length - 1} title="Увеличить">
                <ZoomIn size={16} />
              </button>
            </div>

            <button className={styles.btnToday} onClick={scrollToToday}>
              <CalendarDays size={16} /> К сегодня
            </button>
            
            <div className={styles.filterGroup}>
              <button className={`${styles.filterBtn} ${!filterMy ? styles.active : ''}`} onClick={() => setFilterMy(false)}>Все</button>
              <button className={`${styles.filterBtn} ${filterMy ? styles.active : ''}`} onClick={() => setFilterMy(true)}>Мои</button>
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          {filteredData.posts.length === 0 && filteredData.tasks.length === 0 ? (
            <div className={styles.noData}>Нет активных элементов</div>
          ) : (
            <div 
              className={styles.scrollViewport} 
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={stopDragging}
              onMouseUp={stopDragging}
              onMouseMove={handleMouseMove}
            >
              <div className={styles.canvas} style={{ width: `${totalWidth}px` }}>
                
                <div className={styles.gridBackgrounds}>
                  {daysArray.map((day, idx) => {
                    const isWknd = day.getDay() === 0 || day.getDay() === 6;
                    const isTdy = isToday(day);
                    if (!isWknd && !isTdy) return null;
                    return (
                      <div 
                        key={`bg-${idx}`} 
                        className={`${styles.colBg} ${isWknd ? styles.bgWeekend : ''} ${isTdy ? styles.bgToday : ''}`}
                        style={{ left: `${idx * DAY_WIDTH}px`, width: `${DAY_WIDTH}px` }}
                      />
                    );
                  })}
                </div>

                <div className={styles.gridLines}>
                  {daysArray.map((_, idx) => (
                    <div key={`line-${idx}`} className={styles.gridLine} style={{ left: `${idx * DAY_WIDTH}px` }} />
                  ))}
                  <div className={styles.gridLine} style={{ left: `${totalWidth - 1}px` }} />
                </div>

                <div className={styles.gridHeader}>
                  {daysArray.map((day, idx) => {
                    const isWknd = day.getDay() === 0 || day.getDay() === 6;
                    const isTdy = isToday(day);
                    return (
                      <div 
                        key={`head-${idx}`} 
                        className={`${styles.headerCell} ${isWknd ? styles.headWeekend : ''} ${isTdy ? styles.headToday : ''}`}
                        style={{ left: `${idx * DAY_WIDTH}px`, width: `${DAY_WIDTH}px` }}
                      >
                        <span className={styles.dayNum}>{format(day, 'd')}</span>
                        {zoomIndex > 0 && <span className={styles.dayName}>{format(day, 'EEEEEE', { locale: ru })}</span>}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.canvasContent}>
                  {postsWithLanes.length > 0 && (
                    <div className={styles.section} style={{ height: `${postsSectionHeight}px` }}>
                      <div className={styles.sectionLabel}>
                        <div className={`${styles.icon} ${styles.iconPost}`}><Layers size={14} /></div>
                        Посты
                      </div>
                      {postsWithLanes.map(post => (
                        <div 
                          key={post.post_id} 
                          className={`${styles.card} ${styles.cardPost}`} 
                          style={{ ...post.style, height: `${CARD_HEIGHT}px` }} 
                          title={`${post.post_title}\nДедлайн: ${format(new Date(post.post_deadline), 'dd.MM.yyyy')}\nАвтор: ${post.user?.user_login || 'Нет автора'}`}
                          onClick={(e) => handleCardClick(e, () => setSelectedPostId(post.post_id))}                        >
                          <div className={styles.cardAccent} />
                          <div className={styles.cardText}>{post.post_title}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tasksWithLanes.length > 0 && (
                    <div className={styles.section} style={{ height: `${tasksSectionHeight}px` }}>
                      <div className={styles.sectionLabel}>
                        <div className={`${styles.icon} ${styles.iconTask}`}><CheckSquare size={14} /></div>
                        Задачи
                      </div>
                      {tasksWithLanes.map(task => (
                        <div 
                          key={task.task_id} 
                          className={`${styles.card} ${styles.cardTask}`} 
                          style={{ ...task.style, height: `${CARD_HEIGHT}px` }} 
                          title={`${task.title}\nДедлайн: ${format(new Date(task.end_time), 'dd.MM.yyyy')}\nИсполнители: ${task.assignees.map(a=>a.user.user_login).join(', ')}`}
                          onClick={(e) => handleCardClick(e, () => setSelectedTask({
                              task_id: task.task_id,
                              title: task.title,
                              description: null,
                              start_time: task.start_time,
                              end_time: task.end_time,
                              all_day: false,
                              priority: 0,
                              task_status: task.task_status,
                              completed_task: null,
                              created_at: task.start_time,
                              assignees: task.assignees.map(a => a.user),
                              tags: task.tags.map(t => t.tag),
                            }))}
                        >
                          <div className={styles.cardAccent} />
                          <div className={styles.cardText}>{task.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {selectedPostId !== null && (
        <PostDetailsWindow
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
      {selectedTask !== null && (
        <TaskDetailsWindow
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}