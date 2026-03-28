'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { PostCard } from '../components/shared/post-card/post-card';
import { TaskCard } from '../components/shared/task-card/task-card';
import { Header } from '../components/header/header';
import { usePosts } from '@/hooks/usePosts';
import { useTasks } from '@/hooks/useTasks';
import type { CalendarTask, CalendarPost } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useUser } from '../hooks/use-roles';
import { RoleDropdown } from '../components/shared/role-dropdown/role-dropdown';
import styles from '../components/styles/HomePage.module.css';

type ContentItem = CalendarPost | CalendarTask;

const ITEMS_PER_BATCH = 10;

export default function HomePage() {
  const [showPosts, setShowPosts] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_BATCH);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { filterPostByRole } = useUser();

  const { data: postsData, isLoading: postsLoading } = usePosts(1, 100);
  const { data: tasksData, isLoading: tasksLoading } = useTasks(1, 100);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_BATCH);
  }, [showPosts, showTasks, showIncompleteOnly, showOverdueOnly, roleFilter]);

  const allPosts = useMemo(() => {
    return (postsData?.posts || []).map((post) => ({
      ...post,
      post_date: post.post_date ? new Date(post.post_date) : null,
      post_deadline: new Date(post.post_deadline),
      type: 'post' as const,
    }));
  }, [postsData]);

  const allTasks = useMemo(() => {
    return (tasksData?.tasks || []).map((task) => ({
      ...task,
      type: 'task' as const,
    }));
  }, [tasksData]);

  const loading = postsLoading || tasksLoading;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handlePostsClick = () => {
    if (showPosts) {
      if (showTasks) {
        setShowPosts(false);
      } else {
        setShowPosts(false);
        setShowTasks(true);
      }
    } else {
      setShowPosts(true);
    }

    scrollToTop();
  };

  const handleTasksClick = () => {
    if (showTasks) {
      if (showPosts) {
        setShowTasks(false);
      } else {
        setShowTasks(false);
        setShowPosts(true);
      }
    } else {
      setShowTasks(true);
    }

    scrollToTop();
  };

  const handleIncompleteClick = () => {
    setShowIncompleteOnly((prev) => !prev);
    scrollToTop();
  };

  const handleOverdueClick = () => {
    setShowOverdueOnly((prev) => !prev);
    scrollToTop();
  };

  const isPostCompleted = (status: string) => ['Завершен', 'Завершено'].includes(status);
  const isTaskCompleted = (status: string) => ['Выполнена', 'Выполнено'].includes(status);

  const itemDate = (item: ContentItem) => {
    return item.type === 'post' ? item.post_deadline : new Date(item.end_time);
  };

  const allFilteredItems = useMemo(() => {
    let items: ContentItem[] = [];

    if (showPosts) items.push(...allPosts);
    if (showTasks) items.push(...allTasks);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (showIncompleteOnly) {
      items = items.filter((item) => {
        if (item.type === 'post') return !isPostCompleted(item.post_status);
        return !isTaskCompleted(item.task_status);
      });
    }

    if (showOverdueOnly) {
      items = items.filter((item) => {
        if (item.type === 'post') {
          return item.post_deadline < todayStart && !isPostCompleted(item.post_status);
        }
        return new Date(item.end_time) < todayStart && !isTaskCompleted(item.task_status);
      });
    } else {
      items = items.filter((item) => {
        const date = itemDate(item);
        return date >= todayStart;
      });
    }

    if (roleFilter) {
      items = items.filter((item) => {
        if (item.type === 'post') return filterPostByRole(item, roleFilter);
        return true;
      });
    }

    items.sort((a, b) => {
      const dateA = itemDate(a).getTime();
      const dateB = itemDate(b).getTime();
      return showOverdueOnly ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [
    allPosts,
    allTasks,
    showPosts,
    showTasks,
    showIncompleteOnly,
    showOverdueOnly,
    roleFilter,
    filterPostByRole,
  ]);

  const visibleItems = useMemo(() => {
    return allFilteredItems.slice(0, displayedCount);
  }, [allFilteredItems, displayedCount]);

  const visibleGroups = useMemo(() => {
    const groupsMap = new Map<string, { dateKey: string; displayDate: string; items: ContentItem[] }>();

    for (const item of visibleItems) {
      const date = itemDate(item);
      const dateKey = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'dd MMMM', { locale: ru });

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, { dateKey, displayDate, items: [] });
      }

      groupsMap.get(dateKey)!.items.push(item);
    }

    const groups = Array.from(groupsMap.values());

    return groups.sort((a, b) => {
      return showOverdueOnly
        ? b.dateKey.localeCompare(a.dateKey)
        : a.dateKey.localeCompare(b.dateKey);
    });
  }, [visibleItems, showOverdueOnly]);

  const hasMore = displayedCount < allFilteredItems.length;

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) => prev + ITEMS_PER_BATCH);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  const handleRoleSelect = (role: string | null) => {
    setRoleFilter(role);
    scrollToTop();
  };

  if (loading && allPosts.length === 0 && allTasks.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingInner}>
            <p>Загрузка...</p>
          </div>
        </div>
        <div className={styles.headerFixed}>
          <Header />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.filterWrapper}>
        <button
          onClick={handlePostsClick}
          className={`${styles.filterButton} ${showPosts ? styles.filterButtonActive : ''}`}
        >
          Посты
        </button>

        <button
          onClick={handleTasksClick}
          className={`${styles.filterButton} ${showTasks ? styles.filterButtonActive : ''}`}
        >
          Задачи
        </button>

        <button
          onClick={handleIncompleteClick}
          className={`${styles.filterButton} ${
            showIncompleteOnly ? styles.filterButtonActive : styles.filterButtonInactive
          }`}
        >
          Не готовые
        </button>

        <button
          onClick={handleOverdueClick}
          className={`${styles.filterButton} ${
            showOverdueOnly ? styles.filterButtonActive : styles.filterButtonInactive
          }`}
        >
          Просроченные
        </button>

        <RoleDropdown roleFilter={roleFilter} onRoleSelect={handleRoleSelect} />
      </div>

      <div className={styles.container}>
        <div className={styles.list}>
          {visibleGroups.map((group) => (
            <div key={group.dateKey} className={styles.dayGroup}>
              <div className={styles.dayHeader}>{group.displayDate}</div>

              {group.items.map((item) => {
                if (item.type === 'post') {
                  return <PostCard key={`post-${item.post_id}`} post={item} />;
                }

                return <TaskCard key={`task-${item.task_id}`} task={item} />;
              })}
            </div>
          ))}

          {visibleGroups.length === 0 && !loading && (
            <div className={styles.emptyMessage}>
              <p>
                {!showPosts && !showTasks && 'Выберите хотя бы один тип элементов'}
                {(showPosts || showTasks) && 'Нет элементов для отображения'}
              </p>
            </div>
          )}

          {hasMore && (
            <div ref={loaderRef} className={styles.loader}>
              Загрузка...
            </div>
          )}
        </div>
      </div>

      <div className={styles.headerFixed}>
        <Header />
      </div>
    </div>
  );
}