'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Lock, ExternalLink, CheckCircle, Send, Globe, Trash2, MessageSquare, Link, Plus } from 'lucide-react';
import { EditPostWindow } from './edit_post_window';
import { useUser } from '../../hooks/use-roles';
import { getPostStatus, getStatusColor, isPostCompleted } from '../../lib/post-status';

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

interface TaskField {
  id: number;
  name: string;
  label: string;
  link: string;
  feedback: string;
  required: boolean;
  role: string;
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
  
  post_feedback_mini_video_smm?: string | null;
  post_feedback_video?: string | null;
  post_feedback_cover_photo?: string | null;
  post_feedback_photo_cards?: string | null;
  post_feedback_photogallery?: string | null;
  post_feedback_mini_gallery?: string | null;
  post_feedback_text?: string | null;
  
  post_date: Date | null;
  post_deadline: Date;
  responsible_person_id: number | null;
  user?: {
    user_login: string;
  } | null;
  approved_by?: {
    user_login: string;
  } | null;
  tags?: Tag[];
}

interface PostDetailsWindowProps {
  onClose: () => void;
  post: PostData | null;
  onSuccess: () => Promise<void>;
}

export const PostDetailsWindow = ({ onClose, post, onSuccess }: PostDetailsWindowProps) => {
  const { user, canEditTask, canApprove, canPublish } = useUser();
  const [tasks, setTasks] = useState<TaskField[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);
  const [postStatus, setPostStatus] = useState<string>('');
  const [socialLinks, setSocialLinks] = useState({
    telegram: '',
    vkontakte: '',
    max: ''
  });
  const [originalSocialLinks, setOriginalSocialLinks] = useState({
    telegram: '',
    vkontakte: '',
    max: ''
  });

  const canEditPost = user && (user.admin_role || user.SMM_role);
  const canDelete = user && (user.admin_role || user.SMM_role);
  const canManageSocial = user && (user.admin_role || user.SMM_role);

  const getTaskFeedback = (taskName: string): string => {
    if (!post) return '';
    
    switch (taskName) {
      case 'mini_video_smm': return post.post_feedback_mini_video_smm || '';
      case 'video': return post.post_feedback_video || '';
      case 'text': return post.post_feedback_text || '';
      case 'photogallery': return post.post_feedback_photogallery || '';
      case 'cover_photo': return post.post_feedback_cover_photo || '';
      case 'photo_cards': return post.post_feedback_photo_cards || '';
      case 'mini_gallery': return post.post_feedback_mini_gallery || '';
      default: return '';
    }
  };

  useEffect(() => {
    if (post) {
      const taskFields: TaskField[] = [
        { 
          id: 1, 
          name: 'mini_video_smm', 
          label: 'Мини-видео для SMM', 
          link: post.post_done_link_mini_video_smm || '', 
          feedback: getTaskFeedback('mini_video_smm'),
          required: post.post_needs_mini_video_smm,
          role: 'smm'
        },
        { 
          id: 2, 
          name: 'video', 
          label: 'Видео', 
          link: post.post_done_link_video || '', 
          feedback: getTaskFeedback('video'),
          required: post.post_needs_video,
          role: 'photographer'
        },
        { 
          id: 3, 
          name: 'text', 
          label: 'Текст', 
          link: post.post_done_link_text || '', 
          feedback: getTaskFeedback('text'),
          required: post.post_needs_text,
          role: 'text'
        },
        { 
          id: 4, 
          name: 'photogallery', 
          label: 'Фотогалерея', 
          link: post.post_done_link_photogallery || '', 
          feedback: getTaskFeedback('photogallery'),
          required: post.post_needs_photogallery,
          role: 'photographer'
        },
        { 
          id: 5, 
          name: 'cover_photo', 
          label: 'Обложка', 
          link: post.post_done_link_cover_photo || '', 
          feedback: getTaskFeedback('cover_photo'),
          required: post.post_needs_cover_photo,
          role: 'designer'
        },
        { 
          id: 6, 
          name: 'photo_cards', 
          label: 'Фотокарточки', 
          link: post.post_done_link_photo_cards || '', 
          feedback: getTaskFeedback('photo_cards'),
          required: post.post_needs_photo_cards,
          role: 'designer'
        },
        { 
          id: 7, 
          name: 'mini_gallery', 
          label: 'Мини-фотогалерея', 
          link: post.post_done_link_mini_gallery || '', 
          feedback: getTaskFeedback('mini_gallery'),
          required: post.post_needs_mini_gallery,
          role: 'smm'
        },
      ];
      
      const requiredTasks = taskFields.filter(task => task.required);
      setTasks(requiredTasks);
      setOriginalTasks(JSON.parse(JSON.stringify(requiredTasks)));
      setPostStatus(getPostStatus(post));
      
      const socialData = {
        telegram: post.telegram_published || '',
        vkontakte: post.vkontakte_published || '',
        max: post.MAX_published || ''
      };
      setSocialLinks(socialData);
      setOriginalSocialLinks(socialData);
    }
  }, [post]);

  const handleLinkChange = (id: number, value: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, link: value } : task
      )
    );
  };

  const handleFeedbackChange = (id: number, value: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, feedback: value } : task
      )
    );
  };

  const handleSocialLinkChange = (social: string, value: string) => {
    setSocialLinks(prev => ({
      ...prev,
      [social]: value
    }));
  };

  const hasChanges = () => {
    // Проверяем изменения в ссылках задач
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].link !== originalTasks[i]?.link) {
        return true;
      }
    }
    // Проверяем изменения в комментариях
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].feedback !== originalTasks[i]?.feedback) {
        return true;
      }
    }
    // Проверяем изменения в соцсетях
    if (socialLinks.telegram !== originalSocialLinks.telegram ||
        socialLinks.vkontakte !== originalSocialLinks.vkontakte ||
        socialLinks.max !== originalSocialLinks.max) {
      return true;
    }
    return false;
  };

  const handleSaveAll = async () => {
    if (!post) return;

    setIsSaving(true);

    try {
      // Собираем изменения в ссылках задач
      const linksData: Record<string, string> = {};
      const feedbackData: Record<string, string> = {};
      
      tasks.forEach(task => {
        if (canEditTask(task.role)) {
          if (task.link !== originalTasks.find(t => t.id === task.id)?.link) {
            linksData[task.name] = task.link.trim();
          }
          if (task.feedback !== originalTasks.find(t => t.id === task.id)?.feedback) {
            feedbackData[task.name] = task.feedback.trim();
          }
        }
      });

      // Собираем изменения в соцсетях (отдельные запросы через PATCH)
      const socialPromises = [];
      
      if (socialLinks.telegram !== originalSocialLinks.telegram) {
        if (socialLinks.telegram) {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'add_social_link',
                social: 'telegram',
                link: socialLinks.telegram.trim()
              })
            })
          );
        } else {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'remove_social_link',
                social: 'telegram'
              })
            })
          );
        }
      }

      if (socialLinks.vkontakte !== originalSocialLinks.vkontakte) {
        if (socialLinks.vkontakte) {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'add_social_link',
                social: 'vkontakte',
                link: socialLinks.vkontakte.trim()
              })
            })
          );
        } else {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'remove_social_link',
                social: 'vkontakte'
              })
            })
          );
        }
      }

      if (socialLinks.max !== originalSocialLinks.max) {
        if (socialLinks.max) {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'add_social_link',
                social: 'max',
                link: socialLinks.max.trim()
              })
            })
          );
        } else {
          socialPromises.push(
            fetch('/api/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: post.post_id,
                action: 'remove_social_link',
                social: 'max'
              })
            })
          );
        }
      }

      // Отправляем запрос на обновление задач, если есть изменения
      if (Object.keys(linksData).length > 0 || Object.keys(feedbackData).length > 0) {
        const response = await fetch('/api/posts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: post.post_id,
            links: linksData,
            feedback: feedbackData,
          }),
        });

        if (!response.ok) {
          throw new Error('Ошибка при сохранении задач');
        }
      }

      // Отправляем все запросы на обновление соцсетей
      if (socialPromises.length > 0) {
        await Promise.all(socialPromises);
      }

      await onSuccess();
      onClose();
      
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!post) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.post_id,
          action: 'approve'
        }),
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при согласовании');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.post_id,
          action: post.is_published ? 'unpublish' : 'publish'
        }),
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при изменении статуса публикации');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    
    const isConfirmed = window.confirm('Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.');
    
    if (!isConfirmed) return;
    
    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/posts?id=${post.post_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении поста');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditPost = () => {
    setIsClosingDetails(true);
    setTimeout(() => {
      setShowEditModal(true);
    }, 100);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleSuccessEdit = async () => {
    await onSuccess();
    setShowEditModal(false);
    onClose();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Не указана';
    
    try {
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Ошибка даты';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    
    try {
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    
    try {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!post) {
    return null;
  }

  const hasEditableTasks = tasks.some(task => canEditTask(task.role));
  
  const hasValidLink = (link: string | null | undefined): boolean => {
    return link !== null && link !== undefined && link.trim() !== '';
  };

  const allTasksCompletedInDB = (): boolean => {
    if (!post) return false;
    
    return (
      (!post.post_needs_mini_video_smm || hasValidLink(post.post_done_link_mini_video_smm)) &&
      (!post.post_needs_video || hasValidLink(post.post_done_link_video)) &&
      (!post.post_needs_text || hasValidLink(post.post_done_link_text)) &&
      (!post.post_needs_photogallery || hasValidLink(post.post_done_link_photogallery)) &&
      (!post.post_needs_cover_photo || hasValidLink(post.post_done_link_cover_photo)) &&
      (!post.post_needs_photo_cards || hasValidLink(post.post_done_link_photo_cards)) &&
      (!post.post_needs_mini_gallery || hasValidLink(post.post_done_link_mini_gallery))
    );
  };

  const statusColor = getStatusColor(postStatus);
  const canShowApprove = canApprove && !post.approved_by && allTasksCompletedInDB();
  const canShowPublish = canPublish;

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] p-3 md:p-6 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
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
                
                {/* Теги */}
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
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0"
                aria-label="Закрыть"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Блок управления ссылками на соцсети - ТОЛЬКО ДЛЯ ОПУБЛИКОВАННЫХ ПОСТОВ и для админа/SMM */}
            {post.is_published === true && canManageSocial && (
              <div className="mb-4 p-4 bg-gray-10 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Ссылки на посты в соцсетях
                </h3>
                <div className="space-y-3">
                  {/* Telegram */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                      <img src="/icons/telegram.svg" alt="Telegram" className="w-5 h-5" />
                      <span>Telegram</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={socialLinks.telegram}
                        onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                        placeholder="https://t.me/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSaving || isActionLoading}
                      />
                    </div>
                  </div>

                  {/* VK */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                      <img src="/icons/vk.svg" alt="VK" className="w-5 h-5" />
                      <span>VK</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={socialLinks.vkontakte}
                        onChange={(e) => handleSocialLinkChange('vkontakte', e.target.value)}
                        placeholder="https://vk.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSaving || isActionLoading}
                      />
                    </div>
                  </div>

                  {/* MAX */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600 flex items-center gap-2">
                      <img src="/icons/max.svg" alt="MAX" className="w-5 h-5" />
                      <span>MAX</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={socialLinks.max}
                        onChange={(e) => handleSocialLinkChange('max', e.target.value)}
                        placeholder="https://max.ru/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSaving || isActionLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Отображение уже сохраненных соцсетей для всех пользователей (только для опубликованных постов) */}
            {post.is_published === true && (post.telegram_published || post.vkontakte_published || post.MAX_published) && !canManageSocial && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Опубликовано в:</h3>
                <div className="flex items-center gap-4">
                  {post.telegram_published && (
                    <a
                      href={post.telegram_published}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-500 transition-colors"
                    >
                      <img src="/icons/telegram.svg" alt="Telegram" className="w-5 h-5" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {post.vkontakte_published && (
                    <a
                      href={post.vkontakte_published}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <img src="/icons/vk.svg" alt="VK" className="w-5 h-5" />
                      <span>VK</span>
                    </a>
                  )}
                  {post.MAX_published && (
                    <a
                      href={post.MAX_published}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-purple-600 transition-colors"
                    >
                      <img src="/icons/max.svg" alt="MAX" className="w-5 h-5" />
                      <span>MAX</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
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
                      <a
                        href={post.tz_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
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
                          <p className="text-xs md:text-sm font-medium text-red-700">
                            {formatDate(post.post_deadline)}
                          </p>
                          <p className="text-xs text-red-500 mt-1 hidden md:block">
                            {formatTime(post.post_deadline)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Создан</h4>
                        <div className="p-2 md:p-3 bg-gray-50 border border-gray-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-gray-700">
                            {formatDate(post.post_date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 hidden md:block">
                            {formatTime(post.post_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {post.user && (
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Ответственный</h4>
                        <div className="p-2 md:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-blue-700 truncate">
                            {post.user.user_login}
                          </p>
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

                    {post.feedback_comment && (
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Комментарий</h4>
                        <div className="p-2 md:p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <p className="text-xs md:text-sm text-yellow-800">
                            {post.feedback_comment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:w-3/5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm md:text-lg font-medium text-gray-700">Задачи</h3>
                    <span className="text-xs md:text-sm text-gray-500">
                      {tasks.length} {tasks.length === 1 ? 'задача' : 
                                     tasks.length >= 2 && tasks.length <= 4 ? 'задачи' : 'задач'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[40vh] md:max-h-none overflow-y-auto pr-1">
                    {tasks.length > 0 ? (
                      tasks.map((task) => {
                        const originalLink = task.name === 'mini_video_smm' ? post.post_done_link_mini_video_smm :
                                           task.name === 'video' ? post.post_done_link_video :
                                           task.name === 'text' ? post.post_done_link_text :
                                           task.name === 'photogallery' ? post.post_done_link_photogallery :
                                           task.name === 'cover_photo' ? post.post_done_link_cover_photo :
                                           task.name === 'photo_cards' ? post.post_done_link_photo_cards :
                                           post.post_done_link_mini_gallery;
                        
                        const hasLink = originalLink && originalLink.trim() !== '';
                        const userCanEdit = canEditTask(task.role);
                        
                        return (
                          <div 
                            key={task.id} 
                            className={`border rounded-lg p-4 transition-shadow ${userCanEdit ? 'hover:shadow-md' : 'bg-gray-50'}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                              <div className="sm:w-1/4">
                                <h4 className="font-medium text-gray-800 text-base md:text-base flex items-center gap-1">
                                  {task.label}
                                  {!userCanEdit && (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                </h4>
                              </div>
                              <div className="sm:w-3/4">
                                {userCanEdit ? (
                                  <input
                                    type="text"
                                    value={task.link}
                                    onChange={(e) => handleLinkChange(task.id, e.target.value)}
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
                            
                            <div className="mt-2 pt-2 border-t">
                              {hasLink ? (
                                <>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="text-xs text-gray-500 shrink-0">Ссылка:</span>
                                      <p className="text-sm text-blue-600 truncate" title={originalLink || ''}>
                                        {originalLink}
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => handleLinkClick(originalLink || '', e)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium shrink-0 ml-2 cursor-pointer"
                                      title="Открыть в новой вкладке"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Открыть
                                    </button>
                                  </div>
                                  
                                  {/* Комментарий к задаче с auto-resize */}
                                  {userCanEdit && (
                                    <div className="mt-3 pt-3 border-t border-dashed">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-gray-400 mt-2 shrink-0" />
                                        <div className="flex-1">
                                          <AutoResizeTextarea
                                            value={task.feedback}
                                            onChange={(e) => handleFeedbackChange(task.id, e.target.value)}
                                            placeholder="Добавить комментарий..."
                                            disabled={isSaving || isActionLoading}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {!userCanEdit && task.feedback && (
                                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                                      <span className="font-medium text-gray-700">Комментарий:</span> {task.feedback}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span>Задача ещё не выполнена</span>
                                </div>
                              )}
                            </div>
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

            {/* Нижняя панель с кнопками */}
            <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {canEditPost && (
                  <button
                    onClick={handleEditPost}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Изменить
                  </button>
                )}
                
                {canShowApprove && (
                  <button
                    onClick={handleApprove}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    title="Согласовать пост (все задачи выполнены)"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Согласовать
                  </button>
                )}

                {canShowPublish && (
                  <button
                    onClick={handlePublish}
                    disabled={isActionLoading}
                    className={`px-4 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 ${
                      post.is_published 
                        ? 'bg-gray-500 hover:bg-gray-600' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    <Globe className="w-4 h-4" />
                    {post.is_published ? 'Снять с публикации' : 'Опубликовать'}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 ml-2"
                    title="Удалить пост"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                )}
              </div>

              {(hasEditableTasks || (canManageSocial && post.is_published === true)) && hasChanges() && (
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
        <EditPostWindow 
          post={post} 
          onClose={handleCloseEditModal} 
          onSuccess={handleSuccessEdit}
        />
      )}
    </>
  );
};