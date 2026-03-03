'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Lock, ExternalLink, CheckCircle, Globe, Trash2, MessageSquare, Link, Plus, Circle } from 'lucide-react';
import { EditPostWindow } from './edit_post_window';
import { useUser } from '../../hooks/use-roles';
import { getPostStatus, getStatusColor } from '../../lib/post-status';

// Конфигурация задач — вынесена за пределы компонента
const TASK_CONFIG = [
  { id: 1, name: 'mini_video_smm', label: 'Мини-видео для SMM', needsKey: 'post_needs_mini_video_smm', linkKey: 'post_done_link_mini_video_smm', role: 'smm' },
  { id: 2, name: 'video', label: 'Видео', needsKey: 'post_needs_video', linkKey: 'post_done_link_video', role: 'photographer' },
  { id: 3, name: 'text', label: 'Текст', needsKey: 'post_needs_text', linkKey: 'post_done_link_text', role: 'text' },
  { id: 4, name: 'photogallery', label: 'Фотогалерея', needsKey: 'post_needs_photogallery', linkKey: 'post_done_link_photogallery', role: 'photographer' },
  { id: 5, name: 'cover_photo', label: 'Обложка', needsKey: 'post_needs_cover_photo', linkKey: 'post_done_link_cover_photo', role: 'designer' },
  { id: 6, name: 'photo_cards', label: 'Фотокарточки', needsKey: 'post_needs_photo_cards', linkKey: 'post_done_link_photo_cards', role: 'designer' },
  { id: 7, name: 'mini_gallery', label: 'Мини-фотогалерея', needsKey: 'post_needs_mini_gallery', linkKey: 'post_done_link_mini_gallery', role: 'smm' },
] as const;

// Конфигурация соцсетей
const SOCIAL_CONFIG = [
  { key: 'telegram', label: 'Telegram', icon: '/icons/telegram.svg', placeholder: 'https://t.me/...', publishedKey: 'telegram_published' },
  { key: 'vkontakte', label: 'VK', icon: '/icons/vk.svg', placeholder: 'https://vk.com/...', publishedKey: 'vkontakte_published' },
  { key: 'max', label: 'MAX', icon: '/icons/max.svg', placeholder: 'https://max.ru/...', publishedKey: 'MAX_published' },
] as const;

// Статусы комментариев
const COMMENT_STATUS = {
  RED: '#FF4C4C33',   // Новый комментарий
  YELLOW: '#FFD70033', // Выполнен работником
  GREEN: '#4CAF5033',  // Подтвержден админом/SMM
} as const;

type SocialKey = typeof SOCIAL_CONFIG[number]['key'];
type SocialLinks = Record<SocialKey, string>;

interface CommentData {
  id: number;
  text: string;
  status: string;
  created_at: string;
  task_type_id?: number;
}

interface TaskWithComments {
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

interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

interface PostData {
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

// Компонент для автоматического изменения высоты textarea
const AutoResizeTextarea = ({ value, onChange, placeholder, disabled, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden ${className || ''}`}
      rows={1}
    />
  );
};

// Компонент отдельного комментария
const CommentItem = ({ comment, onStatusChange, userCanEdit }: {
  comment: CommentData;
  onStatusChange: (commentId: number, newStatus: string) => void;
  userCanEdit: boolean;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.RED: return 'bg-red-50 border-red-200';
      case COMMENT_STATUS.YELLOW: return 'bg-yellow-50 border-yellow-200';
      case COMMENT_STATUS.GREEN: return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.RED: return <Circle className="w-3 h-3 text-red-500 fill-red-500" />;
      case COMMENT_STATUS.YELLOW: return <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500" />;
      case COMMENT_STATUS.GREEN: return <CheckCircle className="w-3 h-3 text-green-500" />;
      default: return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Форматируем дату: "3 февраля 18:25"
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return formatter.format(date);
  };

  const canChangeStatus = () => {
    if (comment.status === COMMENT_STATUS.RED && userCanEdit) return true;
    if (comment.status === COMMENT_STATUS.YELLOW && userCanEdit) return true;
    return false;
  };

  const handleStatusClick = () => {
    if (comment.status === COMMENT_STATUS.RED) {
      onStatusChange(comment.id, COMMENT_STATUS.YELLOW);
    } else if (comment.status === COMMENT_STATUS.YELLOW) {
      onStatusChange(comment.id, COMMENT_STATUS.GREEN);
    }
  };

  return (
    <div className={`mt-2 p-3 rounded-lg border ${getStatusColor(comment.status)}`}>
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-1">
          {getStatusIcon(comment.status)}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.text}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCommentDate(comment.created_at)}
          </p>
        </div>
        {canChangeStatus() && (
          <button
            onClick={handleStatusClick}
            className="shrink-0 px-2 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={comment.status === COMMENT_STATUS.RED ? "Отметить как выполненное" : "Подтвердить"}
          >
            {comment.status === COMMENT_STATUS.RED ? "✓ Выполнено" : "✓ Подтвердить"}
          </button>
        )}
      </div>
    </div>
  );
};

// Утилиты
const hasValidLink = (link: string | null | undefined): boolean =>
  link !== null && link !== undefined && link.trim() !== '';

const formatDate = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return date ? 'Неверная дата' : 'Не указана';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : 'https://' + trimmed;
};

const pluralizeTasks = (count: number): string => {
  if (count === 1) return 'задача';
  if (count >= 2 && count <= 4) return 'задачи';
  return 'задач';
};

// Получение комментариев для конкретной задачи
const getCommentsForTask = (post: PostData | null, taskTypeId: number): CommentData[] => {
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

  const canEditPost = user && (user.admin_role || user.SMM_role);
  const canDelete = user && (user.admin_role || user.SMM_role);
  const canManageSocial = user && (user.admin_role || user.SMM_role);

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

  const postStatus = useMemo(() => (post ? getPostStatus(post) : ''), [post]);
  const statusColor = useMemo(() => getStatusColor(postStatus), [postStatus]);

  const allTasksCompletedInDB = useMemo(() => {
    if (!post) return false;
    return TASK_CONFIG.every(cfg => !post[cfg.needsKey] || hasValidLink(post[cfg.linkKey] as string | null));
  }, [post]);

  const hasChanges = useMemo(() => {
    const tasksChanged = tasks.some((task, i) => {
      const original = originalTasks[i];
      if (!original) return true;
      
      if (task.link !== original.link) return true;
      if (task.comments.length !== original.comments.length) return true;
      
      for (let j = 0; j < task.comments.length; j++) {
        if (task.comments[j].status !== original.comments[j]?.status) return true;
      }
      
      return false;
    });
    
    const socialChanged = (Object.keys(socialLinks) as SocialKey[]).some(
      key => socialLinks[key] !== originalSocialLinks[key]
    );
    return tasksChanged || socialChanged;
  }, [tasks, originalTasks, socialLinks, originalSocialLinks]);

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
      onClose();
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
    } finally {
      setIsSaving(false);
    }
  }, [post, tasks, originalTasks, socialLinks, originalSocialLinks, onSuccess, onClose, refreshPostData]);

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
        await refreshPostData();
        await onSuccess();
        onClose();
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

  const handleLinkClick = useCallback((url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    try {
      window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

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
    onClose();
  }, [onSuccess, onClose, refreshPostData]);

  if (!post) return null;

  const hasEditableTasks = tasks.some(task => canEditTask(task.role));
  const canShowApprove = canApprove && !post.approved_by && allTasksCompletedInDB;
  const canShowPublish = canPublish;
  const hasSavedSocialLinks = SOCIAL_CONFIG.some(s => post[s.publishedKey]);

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] p-3 md:p-6 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex justify-between items-start mb-3 md:mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-2xl font-semibold text-gray-800 truncate pr-2" title={post.post_title}>
                    {post.post_title}
                  </h2>
                  <span className={`px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium rounded-full whitespace-nowrap ${statusColor}`}>
                    {postStatus}
                  </span>
                  {post.approved_by && (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      <span>Согласовано</span>
                    </div>
                  )}
                  {post.is_published && (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium shrink-0">
                      <Globe className="w-4 h-4" />
                      <span>Опубликовано</span>
                    </div>
                  )}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.map(tag => (
                      <span
                        key={tag.tag_id}
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0" aria-label="Закрыть">
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Соцсети — редактирование */}
            {post.is_published && canManageSocial && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Ссылки на посты в соцсетях
                </h3>
                <div className="space-y-3">
                  {SOCIAL_CONFIG.map(social => (
                    <div key={social.key} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                        <img src={social.icon} alt={social.label} className="w-5 h-5" />
                        <span>{social.label}</span>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={socialLinks[social.key]}
                          onChange={e => handleSocialLinkChange(social.key, e.target.value)}
                          placeholder={social.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isSaving || isActionLoading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Соцсети — только просмотр */}
            {post.is_published && hasSavedSocialLinks && !canManageSocial && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Опубликовано в:</h3>
                <div className="flex items-center gap-4">
                  {SOCIAL_CONFIG.map(social => {
                    const url = post[social.publishedKey] as string | undefined;
                    if (!url) return null;
                    return (
                      <a
                        key={social.key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 transition-colors"
                      >
                        <img src={social.icon} alt={social.label} className="w-5 h-5" />
                        <span>{social.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Основной контент */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
                {/* Левая колонка */}
                <div className="lg:w-2/5 flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <h3 className="text-sm md:text-lg font-medium text-gray-700 mb-2">Описание</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-32 md:h-48 overflow-y-auto p-3 md:p-4">
                        <p className="text-xs md:text-base text-gray-600 whitespace-pre-line">
                          {post.post_description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {post.tz_link && (
                    <div className="mb-4">
                      <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Ссылка на ТЗ</h4>
                      <a href={post.tz_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        Открыть ТЗ
                      </a>
                    </div>
                  )}

                  <div className="space-y-3 md:space-y-4">
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Дедлайн</h4>
                        <div className="p-2 md:p-3 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-red-700">{formatDate(post.post_deadline)}</p>
                          <p className="text-xs text-red-500 mt-1 hidden md:block">{formatTime(post.post_deadline)}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Создан</h4>
                        <div className="p-2 md:p-3 bg-gray-50 border border-gray-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-gray-700">{formatDate(post.post_date)}</p>
                          <p className="text-xs text-gray-500 mt-1 hidden md:block">{formatTime(post.post_date)}</p>
                        </div>
                      </div>
                    </div>

                    {post.user && (
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Ответственный</h4>
                        <div className="p-2 md:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-blue-700 truncate">{post.user.user_login}</p>
                        </div>
                      </div>
                    )}

                    {post.approved_by && (
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Согласовано</h4>
                        <div className="p-2 md:p-3 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-green-700 truncate flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {post.approved_by.user_login}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая колонка — задачи с комментариями */}
                <div className="lg:w-3/5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm md:text-lg font-medium text-gray-700">Задачи</h3>
                    <span className="text-xs md:text-sm text-gray-500">
                      {tasks.length} {pluralizeTasks(tasks.length)}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[40vh] md:max-h-none overflow-y-auto pr-1">
                    {tasks.length > 0 ? (
                      tasks.map(task => {
                        const originalLink = (post[task.linkKey] as string) || '';
                        const hasLink = originalLink.trim() !== '';
                        const userCanEdit = canEditTask(task.role);

                        return (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                              <div className="sm:w-1/4">
                                <h4 className="font-medium text-gray-800 text-base flex items-center gap-1">
                                  {task.label}
                                  {!userCanEdit && <Lock className="w-4 h-4 text-gray-400" />}
                                </h4>
                              </div>
                              <div className="sm:w-3/4">
                                {userCanEdit ? (
                                  <input
                                    type="text"
                                    value={task.link}
                                    onChange={e => handleLinkChange(task.id, e.target.value)}
                                    placeholder="Вставьте ссылку..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={isSaving || isActionLoading}
                                  />
                                ) : (
                                  <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-base text-gray-500 truncate">
                                    {task.link || 'Нет доступа к редактированию'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {hasLink && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs text-gray-500 shrink-0">Ссылка:</span>
                                    <p className="text-sm text-blue-600 truncate" title={originalLink}>{originalLink}</p>
                                  </div>
                                  <button
                                    onClick={e => handleLinkClick(originalLink, e)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium shrink-0 ml-2 cursor-pointer"
                                    title="Открыть в новой вкладке"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Открыть
                                  </button>
                                </div>
                              </div>
                            )}

                            {task.comments.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {task.comments.map(comment => (
                                  <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    onStatusChange={handleCommentStatusChange}
                                    userCanEdit={userCanEdit}
                                  />
                                ))}
                              </div>
                            )}

                            {userCanEdit && (
                              <div className="mt-3 pt-3 border-t border-dashed">
                                <div className="flex items-start gap-2">
                                  <Plus className="w-4 h-4 text-gray-400 mt-2 shrink-0" />
                                  <div className="flex-1">
                                    <AutoResizeTextarea
                                      value={task.newCommentText}
                                      onChange={e => handleNewCommentChange(task.id, e.target.value)}
                                      placeholder="Добавить комментарий..."
                                      disabled={isSaving || isActionLoading}
                                    />
                                    {task.newCommentText.trim() && (
                                      <div className="flex justify-end mt-2">
                                        <button
                                          onClick={() => handleAddComment(task.id)}
                                          disabled={isSaving || isActionLoading}
                                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium"
                                        >
                                          Добавить комментарий
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 border rounded-lg bg-gray-50">
                        <p className="text-gray-500">Нет задач для этого поста</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя панель */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {canEditPost && (
                  <button onClick={handleEditPost} disabled={isActionLoading} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Изменить
                  </button>
                )}

                {canShowApprove && (
                  <button onClick={() => handleAction('approve')} disabled={isActionLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50" title="Согласовать пост">
                    <CheckCircle className="w-4 h-4" />
                    Согласовать
                  </button>
                )}

                {canShowPublish && (
                  <button
                    onClick={() => handleAction(post.is_published ? 'unpublish' : 'publish')}
                    disabled={isActionLoading}
                    className={`px-4 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
                      post.is_published ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    {post.is_published ? 'Снять с публикации' : 'Опубликовать'}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={() => handleAction('delete', 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 ml-2"
                    title="Удалить пост"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                )}
              </div>

              {(hasEditableTasks || (canManageSocial && post.is_published)) && hasChanges && (
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving || isActionLoading}
                  className={`px-6 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 ${
                    isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Сохранить изменения
                    </>
                  )}
                </button>
              )}
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