'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PostCard } from '@/components/shared/post-card/post-card';
import { TaskCard } from '@/components/shared/task-card/task-card';
import { SearchInput } from '@/components/ui/search-input/search-input';
import { usePosts } from '@/hooks/usePosts';
import { useTasks } from '@/hooks/useTasks';
import { useUser } from '@/hooks/use-roles';
import { useDashboardFilter } from '@/hooks/use-dashboard-filter';
import { RoleDropdown } from '@/components/shared/role-dropdown/role-dropdown';
import { Loading } from '@/components/ui/loading/loading';
import styles from './DashboardPage.module.css';

const ITEMS_PER_BATCH = 10;
const INITIAL_SERVER_LIMIT = 100;

export default function HomePage() {
  const [showPosts, setShowPosts] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_BATCH);
  const [serverLimit, setServerLimit] = useState(INITIAL_SERVER_LIMIT);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const { filterPostByRole } = useUser();

  // Логика переключения Постов (не дает выключить всё)
  const togglePosts = () => {
    if (showPosts && !showTasks) {
      setShowPosts(false);
      setShowTasks(true);
    } else {
      setShowPosts(!showPosts);
    }
  };

  // Логика переключения Задач (не дает выключить всё)
  const toggleTasks = () => {
    if (showTasks && !showPosts) {
      setShowTasks(false);
      setShowPosts(true);
    } else {
      setShowTasks(!showTasks);
    }
  };

  const fetchOptions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    return showOverdueOnly ? { endDate: todayISO, sort: 'desc' as const } : { startDate: todayISO, sort: 'asc' as const };
  }, [showOverdueOnly]);

  const { data: postsData, isFetching: postsFetching } = usePosts(1, serverLimit, fetchOptions);
  const { data: tasksData, isFetching: tasksFetching } = useTasks(1, serverLimit, undefined, fetchOptions);

  const [storedPosts, setStoredPosts] = useState<any[]>([]);
  const [storedTasks, setStoredTasks] = useState<any[]>([]);

  useEffect(() => { if (postsData !== undefined && tasksData !== undefined) setInitialLoadDone(true); }, [postsData, tasksData]);
  useEffect(() => { if (postsData?.posts) setStoredPosts(postsData.posts); }, [postsData]);
  useEffect(() => { if (tasksData?.tasks) setStoredTasks(tasksData.tasks); }, [tasksData]);

  // Вызов хука
  const { filteredCount, getGroupedItems } = useDashboardFilter({
    posts: storedPosts,
    tasks: storedTasks,
    showPosts,
    showTasks,
    showIncompleteOnly,
    showOverdueOnly,
    roleFilter,
    searchQuery,
    filterPostByRole,
  });

  const visibleGroups = useMemo(() => getGroupedItems(displayLimit), [getGroupedItems, displayLimit]);

  useEffect(() => { setDisplayLimit(ITEMS_PER_BATCH); }, [showPosts, showTasks, showIncompleteOnly, showOverdueOnly, roleFilter, searchQuery]);

  const hasMoreLocal = displayLimit < filteredCount;
  const hasMoreServer = (postsData?.totalPosts ?? 0) > storedPosts.length || (tasksData?.totalTasks ?? 0) > storedTasks.length;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (hasMoreLocal) setDisplayLimit(p => p + 10);
        else if (hasMoreServer && !postsFetching && !tasksFetching && filteredCount > 0) setServerLimit(p => p + 100);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMoreLocal, hasMoreServer, postsFetching, tasksFetching, filteredCount]);

  if (!initialLoadDone) return <Loading text="Загрузка..." />;

  return (
    <div className={styles.page}>
      <div className={styles.filterWrapper}>
        <div className={styles.filterGroup}>
          <button onClick={togglePosts} className={`${styles.filterButton} ${showPosts ? styles.filterButtonActive : ''}`}>Посты</button>
          <button onClick={toggleTasks} className={`${styles.filterButton} ${showTasks ? styles.filterButtonActive : ''}`}>Задачи</button>
          <button onClick={() => setShowIncompleteOnly(!showIncompleteOnly)} className={`${styles.filterButton} ${showIncompleteOnly ? styles.filterButtonActive : styles.filterButtonInactive}`}>Не готовые</button>
          <button onClick={() => setShowOverdueOnly(!showOverdueOnly)} className={`${styles.filterButton} ${showOverdueOnly ? styles.filterButtonActive : styles.filterButtonInactive}`}>Просроченные</button>
          <RoleDropdown roleFilter={roleFilter} onRoleSelect={setRoleFilter} />
        </div>
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Поиск по названию или #тегу" className={styles.mainSearch} />
      </div>

      <div className={styles.container}>
        <div className={styles.list}>
          {visibleGroups.map(group => (
            <div key={group.dateKey} className={styles.dayGroup}>
              <div className={styles.dayHeader}>{group.displayDate}</div>
              {group.items.map(item => item.type === 'post' ? <PostCard key={`post-${item.post_id}`} post={item} /> : <TaskCard key={`task-${item.task_id}`} task={item} />)}
            </div>
          ))}
          <div ref={loaderRef} style={{ height: '20px' }} />
          {(postsFetching || tasksFetching) && <div style={{ textAlign: 'center', padding: '10px', color: '#888' }}>Обновление...</div>}
          {visibleGroups.length === 0 && !postsFetching && !tasksFetching && <div className={styles.emptyMessage}>Ничего не найдено</div>}
        </div>
      </div>
    </div>
  );
}