'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { PostCard } from '../components/posts/post-card';
import { TaskCard } from '../components/tasks/task_card';
import { Header } from '../components/layout/Header/Header';
import { useUser } from '../hooks/use-roles';
import { usePosts } from '@/hooks/usePosts';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '../../types/task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ROLE_FILTERS } from '@/hooks/use-roles';
import styles from '../components/styles/HomePage.module.css';

interface PostWithRelations {
  post_id: number;
  post_title: string;
  post_description: string | null;
  post_status: string;
  is_published: boolean;
  tz_link?: string | null;
  feedback_comment?: string | null;
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_photogallery: boolean;
  post_needs_mini_gallery: boolean;
  post_needs_text: boolean;
  post_done_link_mini_video_smm?: string | null;
  post_done_link_video?: string | null;
  post_done_link_cover_photo?: string | null;
  post_done_link_photo_cards?: string | null;
  post_done_link_photogallery?: string | null;
  post_done_link_mini_gallery?: string | null;
  post_done_link_text?: string | null;
  post_date: Date | null;
  post_deadline: Date;
  responsible_person_id: number | null;
  approved_by_id?: number | null;
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  tags?: Array<{ tag_id: number; name: string; color: string }>;
  type: 'post';
  [key: string]: unknown;
}

type ContentItem = PostWithRelations | Task;

const ITEMS_PER_BATCH = 10;

export default function HomePage() {
  const [showPosts, setShowPosts] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_BATCH);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { filterPostByRole } = useUser();

  const { data: postsData, isLoading: postsLoading } = usePosts(1, 100);
  const { data: tasksData, isLoading: tasksLoading } = useTasks(1, 100);

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_BATCH);
  }, [showPosts, showTasks, showIncompleteOnly, roleFilter]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  };

  const allFilteredItems = useMemo(() => {
    let items: ContentItem[] = [];
    if (showPosts) items.push(...allPosts);
    if (showTasks) items.push(...allTasks);

    // Фильтр "Не готовые"
    if (showIncompleteOnly) {
      items = items.filter(item => {
        if (item.type === 'post') return item.post_status !== 'Завершен';
        return item.task_status !== 'Выполнена';
      });
    }

    // Фильтр по роли (только для постов)
    if (roleFilter) {
      items = items.filter(item => {
        if (item.type === 'post') return filterPostByRole(item, roleFilter);
        return true;
      });
    }

    // Фильтр: только текущие и будущие (начиная с сегодня)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    items = items.filter(item => {
      const date = item.type === 'post' ? item.post_deadline : new Date(item.end_time);
      return date >= todayStart;
    });

    // Сортировка по дате (от ближайших к дальним)
    items.sort((a, b) => {
      const dateA = a.type === 'post' ? a.post_deadline.getTime() : new Date(a.end_time).getTime();
      const dateB = b.type === 'post' ? b.post_deadline.getTime() : new Date(b.end_time).getTime();
      return dateA - dateB;
    });

    return items;
  }, [allPosts, allTasks, showPosts, showTasks, showIncompleteOnly, roleFilter, filterPostByRole]);

  const visibleItems = useMemo(() => {
    return allFilteredItems.slice(0, displayedCount);
  }, [allFilteredItems, displayedCount]);

  const visibleGroups = useMemo(() => {
    const groupsMap = new Map<string, { dateKey: string; displayDate: string; items: ContentItem[] }>();

    for (const item of visibleItems) {
      const date = item.type === 'post' ? item.post_deadline : new Date(item.end_time);
      const dateKey = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'dd MMMM', { locale: ru });

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, { dateKey, displayDate, items: [] });
      }
      groupsMap.get(dateKey)!.items.push(item);
    }

    return Array.from(groupsMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [visibleItems]);

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
    setIsRoleDropdownOpen(false);
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
          className={`${styles.statsRowPosts} ${showPosts ? styles.active : ''}`}
        >
          Посты
        </button>
        <button
          onClick={handleTasksClick}
          className={`${styles.statsRowTasks} ${showTasks ? styles.active : ''}`}
        >
          Задачи
        </button>
        <button
          onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
          className={`${styles.filterButton} ${showIncompleteOnly ? styles.filterButtonActive : styles.filterButtonInactive
            }`}
        >
          Не готовые
        </button>
        <div className={styles.roleDropdown} ref={roleDropdownRef}>
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={styles.roleDropdownButton}
          >
            <img
              src={isRoleDropdownOpen ? '/icons/filter_on.svg' : '/icons/filter.svg'}
              alt="filter"
              className={styles.filterIcon}
            />
          </button>
          {isRoleDropdownOpen && (
            <div className={styles.roleDropdownMenu}>
              <button
                onClick={() => handleRoleSelect(null)}
                className={`${styles.roleMenuItem} ${!roleFilter ? styles.active : ''}`}
              >
                Все посты
              </button>
              <div className={styles.menuDivider}></div>
              {ROLE_FILTERS.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`${styles.roleMenuItem} ${roleFilter === role.id ? styles.active : ''}`}
                >
                  <span className={styles.roleIcon}>
                    {role.id === 'smm' && '📹'}
                    {role.id === 'photographer' && '📷'}
                    {role.id === 'designer' && '✏️'}
                  </span>
                  {role.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.list}>
          {visibleGroups.map((group) => (
            <div key={group.dateKey} className={styles.dayGroup}>
              <div className={styles.dayHeader}>{group.displayDate}</div>
              {group.items.map((item) => {
                if (item.type === 'post') {
                  return <PostCard key={`post-${item.post_id}`} post={item} />;
                } else {
                  return <TaskCard key={`task-${item.task_id}`} task={item} />;
                }
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