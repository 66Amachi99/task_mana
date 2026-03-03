'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { EditPostWindow } from './edit_post_window';
import { useUser } from '../../hooks/use-roles';
import { PostDetailsLeftPanel } from './post_details_left_panel';
import { PostDetailsRightPanel } from './post_details_right_panel';
import { PostDetailsActions } from './post_details_actions';

// Конфигурация задач
export const TASK_CONFIG = [
  { id: 1, name: 'mini_video_smm', label: 'Мини-видео для SMM', needsKey: 'post_needs_mini_video_smm', linkKey: 'post_done_link_mini_video_smm', role: 'smm' },
  { id: 2, name: 'video', label: 'Видео', needsKey: 'post_needs_video', linkKey: 'post_done_link_video', role: 'photographer' },
  { id: 3, name: 'text', label: 'Текст', needsKey: 'post_needs_text', linkKey: 'post_done_link_text', role: 'text' },
  { id: 4, name: 'photogallery', label: 'Фотогалерея', needsKey: 'post_needs_photogallery', linkKey: 'post_done_link_photogallery', role: 'photographer' },
  { id: 5, name: 'cover_photo', label: 'Обложка', needsKey: 'post_needs_cover_photo', linkKey: 'post_done_link_cover_photo', role: 'designer' },
  { id: 6, name: 'photo_cards', label: 'Фотокарточки', needsKey: 'post_needs_photo_cards', linkKey: 'post_done_link_photo_cards', role: 'designer' },
  { id: 7, name: 'mini_gallery', label: 'Мини-фотогалерея', needsKey: 'post_needs_mini_gallery', linkKey: 'post_done_link_mini_gallery', role: 'smm' },
] as const;

// Конфигурация соцсетей
export const SOCIAL_CONFIG = [
  { key: 'telegram', label: 'Telegram', icon: '/icons/telegram.svg', placeholder: 'https://t.me/...', publishedKey: 'telegram_published' },
  { key: 'vkontakte', label: 'VK', icon: '/icons/vk.svg', placeholder: 'https://vk.com/...', publishedKey: 'vkontakte_published' },
  { key: 'max', label: 'MAX', icon: '/icons/max.svg', placeholder: 'https://max.ru/...', publishedKey: 'MAX_published' },
] as const;

// Статусы комментариев
export const COMMENT_STATUS = {
  RED: '#FF4C4C33',
  YELLOW: '#FFD70033',
  GREEN: '#4CAF5033',
} as const;

export type SocialKey = typeof SOCIAL_CONFIG[number]['key'];
export type SocialLinks = Record<SocialKey, string>;

export interface CommentData {
  id: number;
  text: string;
  status: string;
  created_at: string;
  task_type_id?: number;
}

export interface TaskWithComments {
  id: number;
  name: string;
  label: string;
  link: string;
  required: boolean;
  role: string;
  linkKey: string;
  comments: CommentData[];
  newCommentText: string;
}

export interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

export interface PostData {
  post_id: number;
  post_title: string;
  post_description: string | null;
  tz_link?: string | null;
  post_status: string;
  is_published: boolean;
  telegram_published?: string | null;
  vkontakte_published?: string | null;
  MAX_published?: string | null;
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
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  tags?: Tag[];
  comments?: CommentData[];
  [key: string]: unknown;
}

interface PostDetailsWindowProps {
  onClose: () => void;
  post: PostData | null;
  onSuccess: () => Promise<void>;
}

// Получение комментариев для конкретной задачи
export const getCommentsForTask = (post: PostData | null, taskTypeId: number): CommentData[] => {
  if (!post || !post.comments) return [];
  return post.comments.filter(c => c.task_type_id === taskTypeId);
};

export const PostDetailsWindow = ({ onClose, post, onSuccess }: PostDetailsWindowProps) => {
  const { user, canEditTask, canApprove, canPublish } = useUser();
  const [tasks, setTasks] = useState<TaskWithComments[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskWithComments[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ telegram: '', vkontakte: '', max: '' });
  const [originalSocialLinks, setOriginalSocialLinks] = useState<SocialLinks>({ telegram: '', vkontakte: '', max: '' });

  // Приводим значения к boolean, так как они могут быть null
  const canEditPost = !!(user && (user.admin_role || user.SMM_role));
  const canDelete = !!(user && (user.admin_role || user.SMM_role));
  const canManageSocial = !!(user && (user.admin_role || user.SMM_role));

  // Инициализация данных
  useEffect(() => {
    if (!post) return;

    const tasksWithComments = TASK_CONFIG
      .filter(cfg => post[cfg.needsKey] as boolean)
      .map(cfg => ({
        id: cfg.id,
        name: cfg.name,
        label: cfg.label,
        link: (post[cfg.linkKey] as string) || '',
        required: true,
        role: cfg.role,
        linkKey: cfg.linkKey,
        comments: getCommentsForTask(post, cfg.id),
        newCommentText: '',
      }));

    setTasks(tasksWithComments);
    setOriginalTasks(tasksWithComments.map(t => ({ ...t, comments: [...t.comments] })));

    const social = {
      telegram: post.telegram_published || '',
      vkontakte: post.vkontakte_published || '',
      max: post.MAX_published || '',
    };
    setSocialLinks(social);
    setOriginalSocialLinks({ ...social });
  }, [post]);

  // Функция для обновления данных поста из БД
  const refreshPostData = useCallback(async () => {
    if (!post?.post_id) return;
    
    try {
      const response = await fetch(`/api/posts?id=${post.post_id}`);
      if (response.ok) {
        const data = await response.json();
        const updatedPost = data.posts[0];
        if (updatedPost) {
          const updatedTasks = TASK_CONFIG
            .filter(cfg => updatedPost[cfg.needsKey] as boolean)
            .map(cfg => ({
              id: cfg.id,
              name: cfg.name,
              label: cfg.label,
              link: (updatedPost[cfg.linkKey] as string) || '',
              required: true,
              role: cfg.role,
              linkKey: cfg.linkKey,
              comments: getCommentsForTask(updatedPost, cfg.id),
              newCommentText: '',
            }));
          
          setTasks(updatedTasks);
          setOriginalTasks(updatedTasks.map(t => ({ ...t, comments: [...t.comments] })));

          const social = {
            telegram: updatedPost.telegram_published || '',
            vkontakte: updatedPost.vkontakte_published || '',
            max: updatedPost.MAX_published || '',
          };
          setSocialLinks(social);
          setOriginalSocialLinks({ ...social });
        }
      }
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    }
  }, [post?.post_id]);

  const handleLinkChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, link: value } : t));
  }, []);

  const handleNewCommentChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, newCommentText: value } : t));
  }, []);

  const handleAddComment = useCallback((taskId: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (!t.newCommentText.trim()) return t;
      
      const newComment: CommentData = {
        id: Date.now(),
        text: t.newCommentText,
        status: COMMENT_STATUS.RED,
        created_at: new Date().toISOString(),
        task_type_id: taskId,
      };
      
      return {
        ...t,
        comments: [...t.comments, newComment],
        newCommentText: '',
      };
    }));
  }, []);

  const handleCommentStatusChange = useCallback((commentId: number, newStatus: string) => {
    setTasks(prev => prev.map(t => ({
      ...t,
      comments: t.comments.map(c => 
        c.id === commentId ? { ...c, status: newStatus } : c
      ),
    })));
  }, []);

  const handleSocialLinkChange = useCallback((social: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [social]: value }));
  }, []);

  const handleSaveAll = useCallback(async () => {
    if (!post) return;
    setIsSaving(true);

    try {
      const promises: Promise<Response>[] = [];

      tasks.forEach(task => {
        const originalTask = originalTasks.find(t => t.id === task.id);
        if (!originalTask) return;
        
        if (task.link !== originalTask.link) {
          promises.push(
            fetch('/api/posts/update', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                postId: post.post_id, 
                links: { [task.name]: task.link.trim() } 
              }),
            })
          );
        }
        
        const newComments = task.comments.filter(c => 
          !originalTask.comments.some(oc => oc.id === c.id)
        );
        
        newComments.forEach(comment => {
          promises.push(
            fetch('/api/comments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                taskTypeId: task.id,
                text: comment.text,
              }),
            })
          );
        });
        
        task.comments.forEach(comment => {
          const originalComment = originalTask.comments.find(oc => oc.id === comment.id);
          if (originalComment && originalComment.status !== comment.status) {
            promises.push(
              fetch('/api/comments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  commentId: comment.id,
                  status: comment.status,
                }),
              })
            );
          }
        });
      });

      (Object.keys(socialLinks) as SocialKey[]).forEach(key => {
        if (socialLinks[key] === originalSocialLinks[key]) return;
        promises.push(
          fetch('/api/posts/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: post.post_id,
              action: socialLinks[key] ? 'add_social_link' : 'remove_social_link',
              social: key,
              ...(socialLinks[key] ? { link: socialLinks[key].trim() } : {}),
            }),
          })
        );
      });

      await Promise.all(promises);
      await refreshPostData();
      await onSuccess();
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
    } finally {
      setIsSaving(false);
    }
  }, [post, tasks, originalTasks, socialLinks, originalSocialLinks, onSuccess, refreshPostData]);

  const handleAction = useCallback(async (action: string, confirmMsg?: string) => {
    if (!post) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setIsActionLoading(true);
    try {
      const isDelete = action === 'delete';
      const response = await fetch(
        isDelete ? `/api/posts/delete?id=${post.post_id}` : '/api/posts/update',
        isDelete
          ? { method: 'DELETE' }
          : { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.post_id, action }) }
      );

      if (response.ok) {
        if (action !== 'delete') {
          await refreshPostData();
          await onSuccess();
        } else {
          await onSuccess();
          onClose();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsActionLoading(false);
    }
  }, [post, onSuccess, onClose, refreshPostData]);

  const handleEditPost = useCallback(() => {
    setIsClosingDetails(true);
    setTimeout(() => setShowEditModal(true), 100);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setTimeout(() => onClose(), 100);
  }, [onClose]);

  const handleSuccessEdit = useCallback(async () => {
    await refreshPostData();
    await onSuccess();
    setShowEditModal(false);
  }, [onSuccess, refreshPostData]);

  if (!post) return null;

  const hasChanges = tasks.some((task, i) => {
    const original = originalTasks[i];
    if (!original) return true;
    if (task.link !== original.link) return true;
    if (task.comments.length !== original.comments.length) return true;
    for (let j = 0; j < task.comments.length; j++) {
      if (task.comments[j].status !== original.comments[j]?.status) return true;
    }
    return false;
  }) || (Object.keys(socialLinks) as SocialKey[]).some(key => socialLinks[key] !== originalSocialLinks[key]);

  const hasEditableTasks = tasks.some(task => canEditTask(task.role));
  const canShowApprove = !!(canApprove && !post.approved_by && TASK_CONFIG.every(cfg => !post[cfg.needsKey] || (post[cfg.linkKey] as string)?.trim()));

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок - фиксированный */}
            <div className="flex justify-between items-start px-6 py-4 border-b shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 truncate pr-2" title={post.post_title}>
                  {post.post_title}
                </h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0" aria-label="Закрыть">
                <X size={24} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Основной контент с двумя независимыми скроллами */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Левая панель с собственным скроллом */}
              <div className="lg:w-2/5 overflow-y-auto px-6 py-4 border-r">
                <div className="space-y-6">
                  <PostDetailsLeftPanel
                    post={post}
                    socialLinks={socialLinks}
                    onSocialLinkChange={handleSocialLinkChange}
                    canManageSocial={canManageSocial}
                    isSaving={isSaving}
                    isActionLoading={isActionLoading}
                  />
                </div>
              </div>

              {/* Правая панель с собственным скроллом */}
              <div className="lg:w-3/5 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  <PostDetailsRightPanel
                    tasks={tasks}
                    post={post}
                    canEditTask={canEditTask}
                    onLinkChange={handleLinkChange}
                    onNewCommentChange={handleNewCommentChange}
                    onAddComment={handleAddComment}
                    onCommentStatusChange={handleCommentStatusChange}
                    isSaving={isSaving}
                    isActionLoading={isActionLoading}
                  />
                </div>
              </div>
            </div>

            {/* Нижняя панель с кнопками - фиксированная */}
            <div className="px-6 py-4 border-t shrink-0">
              <PostDetailsActions
                canEditPost={canEditPost}
                canShowApprove={canShowApprove}
                canShowPublish={!!canPublish}
                canDelete={canDelete}
                canManageSocial={canManageSocial}
                post={post}
                hasChanges={hasChanges}
                hasEditableTasks={hasEditableTasks}
                isSaving={isSaving}
                isActionLoading={isActionLoading}
                onEdit={handleEditPost}
                onApprove={() => handleAction('approve')}
                onPublishToggle={() => handleAction(post.is_published ? 'unpublish' : 'publish')}
                onDelete={() => handleAction('delete', 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')}
                onSave={handleSaveAll}
              />
            </div>
          </div>
        </div>
      )}

      {showEditModal && post && (
        <EditPostWindow post={post} onClose={handleCloseEditModal} onSuccess={handleSuccessEdit} />
      )}
    </>
  );
};