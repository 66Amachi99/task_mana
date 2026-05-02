'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { PostCard } from '@/components/shared/post-card/post-card';
import { TaskCard } from '@/components/shared/task-card/task-card';
import { SearchInput } from '@/components/ui/search-input/search-input';
import { usePosts } from '@/hooks/usePosts';
import { useTasks } from '@/hooks/useTasks';
import type { CalendarTask, CalendarPost } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useUser } from '@/hooks/use-roles';
import { RoleDropdown } from '@/components/shared/role-dropdown/role-dropdown';
import { Loading } from '@/components/ui/loading/loading';
import styles from './DashboardPage.module.css';

type ContentItem = CalendarPost | CalendarTask;
const ITEMS_PER_BATCH = 10;

export default function HomePage() {
  const [showPosts, setShowPosts] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_BATCH);
  const [serverLimit, setServerLimit] = useState(100);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const { filterPostByRole } = useUser();

  // 1. ЛОГИКА ДАТ: СТРОГО ОТ СЕГОДНЯ
  const fetchOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    if (showOverdueOnly) {
      return { endDate: todayISO, sort: 'desc' as const };
    }
    return { startDate: todayISO, sort: 'asc' as const };
  }, [showOverdueOnly]);

  const { data: postsData, isFetching: postsFetching } = usePosts(1, serverLimit, fetchOptions);
  const { data: tasksData, isFetching: tasksFetching } = useTasks(1, serverLimit, undefined, fetchOptions);

  // Сохраняем данные, чтобы список не обнулялся при подгрузке и не кидало наверх
  const [storedPosts, setStoredPosts] = useState<any[]>([]);
  const [storedTasks, setStoredTasks] = useState<any[]>([]);

  useEffect(() => {
    if (postsData?.posts) setStoredPosts(postsData.posts);
  }, [postsData]);

  useEffect(() => {
    if (tasksData?.tasks) setStoredTasks(tasksData.tasks);
  }, [tasksData]);

  useEffect(() => {
    setDisplayLimit(ITEMS_PER_BATCH);
  }, [showPosts, showTasks, showIncompleteOnly, showOverdueOnly, roleFilter, searchQuery]);

  const getItemDate = (item: ContentItem): Date => {
    if (item.type === 'post') return new Date(item.post_deadline);
    return new Date(item.end_time);
  };

  const allFilteredItems = useMemo(() => {
    const posts = showPosts ? storedPosts.map(p => ({ ...p, type: 'post' as const })) : [];
    const tasks = showTasks ? storedTasks.map(t => ({ ...t, type: 'task' as const })) : [];
    let items = [...posts, ...tasks] as ContentItem[];

    // Дополнительный клиентский фильтр даты (чтобы точно убрать старое)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (showOverdueOnly) {
      items = items.filter(i => getItemDate(i) < todayStart);
    } else {
      items = items.filter(i => getItemDate(i) >= todayStart);
    }

    if (showIncompleteOnly) {
      items = items.filter(i => i.type === 'post' 
        ? !['Завершен', 'Завершено'].includes(i.post_status)
        : !['Выполнена', 'Выполнено'].includes(i.task_status));
    }
    if (roleFilter) {
      items = items.filter(i => i.type === 'post' ? filterPostByRole(i, roleFilter) : true);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(i => (i.type === 'post' ? i.post_title : i.title).toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      const tA = getItemDate(a).getTime();
      const tB = getItemDate(b).getTime();
      return showOverdueOnly ? tB - tA : tA - tB;
    });
    return items;
  }, [storedPosts, storedTasks, showPosts, showTasks, showIncompleteOnly, showOverdueOnly, roleFilter, searchQuery, filterPostByRole]);

  const visibleGroups = useMemo(() => {
    const slice = allFilteredItems.slice(0, displayLimit);
    const groupsMap = new Map<string, { dateKey: string; displayDate: string; items: ContentItem[] }>();
    slice.forEach(item => {
      const d = getItemDate(item);
      const key = format(d, 'yyyy-MM-dd');
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { dateKey: key, displayDate: format(d, 'dd MMMM', { locale: ru }), items: [] });
      }
      groupsMap.get(key)!.items.push(item);
    });
    return Array.from(groupsMap.values());
  }, [allFilteredItems, displayLimit]);

  const hasMoreLocal = displayLimit < allFilteredItems.length;
  const hasMoreServer = (postsData?.totalPosts || 0) + (tasksData?.totalTasks || 0) > allFilteredItems.length;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) {
          setDisplayLimit(prev => prev + 10);
        } else if (hasMoreServer && !postsFetching && !tasksFetching) {
          setServerLimit(prev => prev + 100);
        }
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMoreLocal, hasMoreServer, postsFetching, tasksFetching]);

  // Загрузка только на абсолютно пустой экран
  if (allFilteredItems.length === 0 && (postsFetching || tasksFetching)) {
    return <Loading text="Загрузка..." />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.filterWrapper}>
        <div className={styles.filterGroup}>
          <button onClick={() => setShowPosts(!showPosts)} className={`${styles.filterButton} ${showPosts ? styles.filterButtonActive : ''}`}>Посты</button>
          <button onClick={() => setShowTasks(!showTasks)} className={`${styles.filterButton} ${showTasks ? styles.filterButtonActive : ''}`}>Задачи</button>
          <button onClick={() => setShowIncompleteOnly(!showIncompleteOnly)} className={`${styles.filterButton} ${showIncompleteOnly ? styles.filterButtonActive : styles.filterButtonInactive}`}>Не готовые</button>
          <button onClick={() => setShowOverdueOnly(!showOverdueOnly)} className={`${styles.filterButton} ${showOverdueOnly ? styles.filterButtonActive : styles.filterButtonInactive}`}>Просроченные</button>
          <RoleDropdown roleFilter={roleFilter} onRoleSelect={setRoleFilter} />
        </div>
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Поиск..." className={styles.mainSearch} />
      </div>

      <div className={styles.container}>
        <div className={styles.list}>
          {visibleGroups.map(group => (
            <div key={group.dateKey} className={styles.dayGroup}>
              <div className={styles.dayHeader}>{group.displayDate}</div>
              {group.items.map(item => (
                item.type === 'post' 
                  ? <PostCard key={`post-${item.post_id}`} post={item} /> 
                  : <TaskCard key={`task-${item.task_id}`} task={item} />
              ))}
            </div>
          ))}

          <div ref={loaderRef} style={{ height: '20px' }} />

          {(postsFetching || tasksFetching) && (
             <div style={{ textAlign: 'center', padding: '10px', color: '#888' }}>Обновление...</div>
          )}

          {visibleGroups.length === 0 && !postsFetching && !tasksFetching && (
            <div className={styles.emptyMessage}>Ничего не найдено</div>
          )}
        </div>
      </div>
    </div>
  );
}