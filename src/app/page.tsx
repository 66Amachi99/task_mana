'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { PostList } from '../components/posts/PostList';
import { TaskCard } from '../components/tasks/task_card';
import { Pagination } from '../components/ui/pagination';
import { useUser } from '../hooks/use-roles';
import { Task } from '../../types/task';
import { Header } from '../components/layout/Header/Header';
import styles from '../components/styles/HomePage.module.css';

interface PostWithRelations {
  post_id: number;
  post_title: string;
  post_description: string;
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
type ViewMode = 'all' | 'posts' | 'tasks';

export default function HomePage() {
  const [allPosts, setAllPosts] = useState<PostWithRelations[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const { filterPostByRole } = useUser();

  const fetchAllContent = useCallback(async () => {
    try {
      setLoading(true);
      const postsResponse = await fetch(`/api/posts?limit=100`);
      const postsData = await postsResponse.json();
      const tasksResponse = await fetch('/api/tasks?limit=100');
      const tasksData = await tasksResponse.json();

      const postsWithDates = (postsData.posts || []).map((post: any) => ({
        ...post,
        post_date: post.post_date ? new Date(post.post_date) : null,
        post_deadline: new Date(post.post_deadline),
        type: 'post' as const,
      }));

      const tasksWithDates = (tasksData.tasks || []).map((task: any) => ({
        ...task,
        type: 'task' as const,
      }));

      setAllPosts(postsWithDates);
      setAllTasks(tasksWithDates);
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

  const filteredContent = useMemo(() => {
    let filtered: ContentItem[] = [];

    if (viewMode === 'posts') filtered = [...allPosts];
    else if (viewMode === 'tasks') filtered = [...allTasks];
    else filtered = [...allPosts, ...allTasks];

    if (selectedRoleFilter && viewMode !== 'tasks') {
      filtered = filtered.filter(item => {
        if (item.type === 'post') {
          return filterPostByRole(item, selectedRoleFilter);
        }
        return true;
      });
    }

    filtered.sort((a, b) => {
      const dateA = a.type === 'post'
        ? (a.post_date?.getTime() || 0)
        : new Date(a.created_at).getTime();
      const dateB = b.type === 'post'
        ? (b.post_date?.getTime() || 0)
        : new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [viewMode, selectedRoleFilter, allPosts, allTasks, filterPostByRole]);

  useEffect(() => {
    const total = Math.ceil(filteredContent.length / itemsPerPage);
    setTotalPages(total || 1);
    setCurrentPage(1);
  }, [filteredContent]);

  const currentItems = useMemo(() => {
    return filteredContent.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredContent, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className={styles.contentWrapper}>
        <div className={styles.container}>
          <div className={styles.list}>
            {currentItems.map((item) => {
              if (item.type === 'post') {
                return (
                  <PostList
                    key={`post-${item.post_id}`}
                    posts={[item]}
                    onPostUpdate={fetchAllContent}
                  />
                );
              } else {
                return (
                  <TaskCard
                    key={`task-${item.task_id}`}
                    task={item}
                    onTaskUpdate={fetchAllContent}
                  />
                );
              }
            })}
            {currentItems.length === 0 && (
              <div className={styles.emptyMessage}>
                <p>
                  {viewMode === 'posts' && 'Нет постов для отображения'}
                  {viewMode === 'tasks' && 'Нет задач для отображения'}
                  {viewMode === 'all' && 'Нет элементов для отображения'}
                </p>
              </div>
            )}
          </div>
          {filteredContent.length > itemsPerPage && (
            <div className={styles.pagination}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
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