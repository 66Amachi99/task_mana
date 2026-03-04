'use client';

import { PostDetailsButton } from '../ui/post_details_button';
import { getPostStatus, getStatusColor } from '../../lib/post-status';
import { ExternalLink, CheckCircle, Globe } from 'lucide-react';

interface PostWithRelations {
  post_id: number;
  post_title: string;
  post_description: string;
  post_status: string;
  is_published: boolean;
  telegram_published?: string | null;
  vkontakte_published?: string | null;
  MAX_published?: string | null;
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
  
  // Поля для фидбэка
  post_feedback_mini_video_smm?: string | null;
  post_feedback_video?: string | null;
  post_feedback_cover_photo?: string | null;
  post_feedback_photo_cards?: string | null;
  post_feedback_photogallery?: string | null;
  post_feedback_mini_gallery?: string | null;
  post_feedback_text?: string | null;
  
  // Поля для комментариев
  comments?: Array<{
    id: number;
    text: string;
    status: string;
    created_at: string;
    task_type_id?: number;
  }>;
  
  post_date: Date | null;
  post_deadline: Date;
  
  responsible_person_id: number | null;
  approved_by_id?: number | null;
  
  user?: {
    user_login: string;
  } | null;
  approved_by?: {
    user_login: string;
  } | null;
  tags?: Array<{
    tag_id: number;
    name: string;
    color: string;
  }>;
  
  // Добавляем сигнатуру индекса
  [key: string]: unknown;
}

interface PostListProps {
  posts: PostWithRelations[];
  onPostUpdate: () => Promise<void>;
}

export function PostList({ posts, onPostUpdate }: PostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-6 md:py-10">
        <p className="text-gray-500 text-sm md:text-base">Нет постов для отображения</p>
      </div>
    );
  }

  const handleTzLinkClick = (url: string | null | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!url) return;
    
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    
    try {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Ошибка при открытии ссылки:', error);
    }
  };

  const getRequiredTasks = (post: PostWithRelations) => {
    const tasks = [];
    
    if (post.post_needs_mini_video_smm) {
      const hasLink = post.post_done_link_mini_video_smm && post.post_done_link_mini_video_smm.trim() !== '';
      tasks.push({ 
        name: 'Мини-видео для SMM', 
        role: 'smm',
        field: 'post_needs_mini_video_smm',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_video) {
      const hasLink = post.post_done_link_video && post.post_done_link_video.trim() !== '';
      tasks.push({ 
        name: 'Видео', 
        role: 'photographer',
        field: 'post_needs_video',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_text) {
      const hasLink = post.post_done_link_text && post.post_done_link_text.trim() !== '';
      tasks.push({ 
        name: 'Текст', 
        role: 'text',
        field: 'post_needs_text',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_photogallery) {
      const hasLink = post.post_done_link_photogallery && post.post_done_link_photogallery.trim() !== '';
      tasks.push({ 
        name: 'Фотогалерея', 
        role: 'photographer',
        field: 'post_needs_photogallery',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_cover_photo) {
      const hasLink = post.post_done_link_cover_photo && post.post_done_link_cover_photo.trim() !== '';
      tasks.push({ 
        name: 'Обложка', 
        role: 'designer',
        field: 'post_needs_cover_photo',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_photo_cards) {
      const hasLink = post.post_done_link_photo_cards && post.post_done_link_photo_cards.trim() !== '';
      tasks.push({ 
        name: 'Фотокарточки', 
        role: 'designer',
        field: 'post_needs_photo_cards',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_mini_gallery) {
      const hasLink = post.post_done_link_mini_gallery && post.post_done_link_mini_gallery.trim() !== '';
      tasks.push({ 
        name: 'Мини-фотогалерея', 
        role: 'smm',
        field: 'post_needs_mini_gallery',
        isCompleted: hasLink
      });
    }
    
    return tasks;
  };

  const getBorderStyle = (post: PostWithRelations) => {
    if (post.is_published === true) {
      return { border: '2px solid #3b82f6' };
    }
    if (post.approved_by) {
      return { border: '2px solid #22c55e' };
    }
    return { border: '2px solid #e5e7eb' };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {posts.map((post) => {
        const requiredTasks = getRequiredTasks(post);
        const postStatus = post.post_status;
        const statusColor = getStatusColor(postStatus);
        const borderStyle = getBorderStyle(post);
        
        return (
          <div
            key={post.post_id}
            style={borderStyle}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate" title={post.post_title}>
                    {post.post_title}
                  </h2>
                  
                  <div className="flex items-center gap-1">
                    {post.approved_by && (
                      <span className="text-green-600" title={`Согласовано: ${post.approved_by.user_login}`}>
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    )}
                    {post.is_published && (
                      <span className="text-blue-600" title="Опубликовано">
                        <Globe className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Иконки соцсетей */}
                  {(post.telegram_published || post.vkontakte_published || post.MAX_published) && (
                    <div className="flex items-center gap-1 ml-1">
                      {post.telegram_published && (
                        <img 
                          src="/icons/telegram.svg" 
                          alt="Telegram" 
                          className="w-4 h-4"
                          title="Опубликовано в Telegram"
                        />
                      )}
                      {post.vkontakte_published && (
                        <img 
                          src="/icons/vk.svg" 
                          alt="VK" 
                          className="w-4 h-4"
                          title="Опубликовано в VK"
                        />
                      )}
                      {post.MAX_published && (
                        <img 
                          src="/icons/max.svg" 
                          alt="MAX" 
                          className="w-4 h-4"
                          title="Опубликовано в MAX"
                        />
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-sm md:text-base text-gray-600 mt-2 line-clamp-2 md:line-clamp-3" title={post.post_description}>
                  {post.post_description}
                </p>
                
                {/* Статус и теги в одной строке */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {/* Статус поста */}
                  <span className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full whitespace-nowrap ${statusColor}`}>
                    {postStatus}
                  </span>
                  
                  {/* Все теги без ограничений */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map(tag => (
                        <span
                          key={tag.tag_id}
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: tag.color,
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-left md:text-right shrink-0 text-xs md:text-sm">
                <p className="text-gray-500">
                  Создан: {post.post_date ? new Date(post.post_date).toLocaleDateString('ru-RU') : 'Не указана'}
                </p>
                <p className="text-gray-500 mt-1">
                  Дедлайн: {new Date(post.post_deadline).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {post.user && (
              <div className="mb-4 p-2 md:p-3 bg-gray-50 rounded border">
                <p className="text-xs md:text-sm text-gray-600">
                  Ответственный: <span className="font-medium">{post.user.user_login}</span>
                </p>
              </div>
            )}

            {post.feedback_comment && (
              <div className="mb-4 p-2 md:p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs md:text-sm text-yellow-800">
                  <span className="font-medium">Комментарий:</span> {post.feedback_comment}
                </p>
              </div>
            )}

            {requiredTasks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">Требуемые задачи:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                  {requiredTasks.map((task, index) => {
                    return (
                      <div
                        key={index}
                        className="border rounded p-2 md:p-3 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            {task.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.isCompleted ? 'Выполнено' : 'Ожидает выполнения'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 md:mt-6 pt-4 border-t flex items-center justify-end gap-2">
              {post.tz_link && (
                <button
                  onClick={(e) => handleTzLinkClick(post.tz_link, e)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                  title="Открыть техническое задание"
                >
                  <ExternalLink className="w-4 h-4" />
                  ТЗ
                </button>
              )}
              
              <PostDetailsButton post={post} onPostUpdate={onPostUpdate} />
            </div>
          </div>
        );
      })}
    </div>
  );
}