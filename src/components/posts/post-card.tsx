'use client';

import { PostDetailsButton } from '../ui/post_details_button';
import { getStatusColor } from '../../lib/post-status';
import { ExternalLink, CheckCircle, Globe } from 'lucide-react';
import styles from '../styles/PostList.module.css';

interface PostWithRelations {
  post_id: number;
  post_title: string;
  post_description: string | null;
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
  
  post_feedback_mini_video_smm?: string | null;
  post_feedback_video?: string | null;
  post_feedback_cover_photo?: string | null;
  post_feedback_photo_cards?: string | null;
  post_feedback_photogallery?: string | null;
  post_feedback_mini_gallery?: string | null;
  post_feedback_text?: string | null;
  
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
  
  [key: string]: unknown;
}

interface PostCardProps {
  post: PostWithRelations;
}

const TASK_DEFINITIONS = [
  { field: 'post_needs_mini_video_smm', linkField: 'post_done_link_mini_video_smm', name: 'Мини-видео', role: 'smm' },
  { field: 'post_needs_video', linkField: 'post_done_link_video', name: 'Видео', role: 'photographer' },
  { field: 'post_needs_text', linkField: 'post_done_link_text', name: 'Текст', role: 'text' },
  { field: 'post_needs_photogallery', linkField: 'post_done_link_photogallery', name: 'Фотогалерея', role: 'photographer' },
  { field: 'post_needs_cover_photo', linkField: 'post_done_link_cover_photo', name: 'Обложка', role: 'designer' },
  { field: 'post_needs_photo_cards', linkField: 'post_done_link_photo_cards', name: 'Фотокарточки', role: 'designer' },
  { field: 'post_needs_mini_gallery', linkField: 'post_done_link_mini_gallery', name: 'Мини-фотогалерея', role: 'smm' },
] as const;

export function PostCard({ post }: PostCardProps) {
  if (!post) return null;

  const firstTag = post.tags && post.tags.length > 0 ? post.tags[0] : null;
  
  const bgGradient = firstTag
    ? `radial-gradient(100% 100% at 50% 0%, color-mix(in srgb, ${firstTag.color}, transparent 70%) 0%, rgba(72, 200, 132, 0) 100%)`
    : undefined;

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

  const getRequiredTasks = () => {
    return TASK_DEFINITIONS
      .filter(def => post[def.field])
      .map(def => {
        const linkValue = post[def.linkField];
        const isCompleted = Boolean(typeof linkValue === 'string' && linkValue.trim() !== '');
        
        return {
          name: def.name,
          role: def.role,
          field: def.field,
          isCompleted
        };
      });
  };

  const requiredTasks = getRequiredTasks();
  const postStatus = post.post_status;
  const statusColor = getStatusColor(postStatus);

  return (
    <div 
      className={styles.card}
      style={bgGradient ? { backgroundImage: bgGradient } : undefined}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleBlock}>
          <div className={styles.titleRow}>
            <h2 className={styles.title} title={post.post_title}>
              {post.post_title}
            </h2>
            
            <div className={styles.iconGroup}>
              {post.approved_by && (
                <span className={styles.iconGreen} title={`Согласовано: ${post.approved_by.user_login}`}>
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
              {post.is_published && (
                <span className={styles.iconBlue} title="Опубликовано">
                  <Globe className="w-4 h-4" />
                </span>
              )}
            </div>

            {(post.telegram_published || post.vkontakte_published || post.MAX_published) && (
              <div className={styles.socialIcons}>
                {post.telegram_published && (
                  <img 
                    src="/icons/telegram.svg" 
                    alt="Telegram" 
                    className={styles.socialIconImg}
                    title="Опубликовано в Telegram"
                  />
                )}
                {post.vkontakte_published && (
                  <img 
                    src="/icons/vk.svg" 
                    alt="VK" 
                    className={styles.socialIconImg}
                    title="Опубликовано в VK"
                  />
                )}
                {post.MAX_published && (
                  <img 
                    src="/icons/max.svg" 
                    alt="MAX" 
                    className={styles.socialIconImg}
                    title="Опубликовано в MAX"
                  />
                )}
              </div>
            )}
          </div>
          
          <p className={styles.description} title={post.post_description ?? ''}>
            {post.post_description ?? 'Нет описания'}
          </p>
          
          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${statusColor}`}>
              {postStatus}
            </span>
            
            {post.tags && post.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {post.tags.map(tag => (
                  <span
                    key={tag.tag_id}
                    className={styles.tag}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.dateColumn}>
          <p className={styles.dateText}>
            Создан: {post.post_date ? new Date(post.post_date).toLocaleDateString('ru-RU') : 'Не указана'}
          </p>
          <p className={styles.dateText}>
            Дедлайн: {post.post_deadline ? new Date(post.post_deadline).toLocaleDateString('ru-RU') : 'Не указан'}
          </p>
        </div>
      </div>

      {post.user && (
        <div className={styles.responsibleBlock}>
          <p className={styles.responsibleText}>
            Ответственный: <span className={styles.responsibleName}>{post.user.user_login}</span>
          </p>
        </div>
      )}

      {post.feedback_comment && (
        <div className={styles.feedbackBlock}>
          <p className={styles.feedbackText}>
            <span className={styles.feedbackLabel}>Комментарий:</span> {post.feedback_comment}
          </p>
        </div>
      )}

      {requiredTasks.length > 0 && (
        <div className={styles.tasksSection}>
          <h3 className={styles.tasksTitle}>Требуемые задачи:</h3>
          <div className={styles.tasksGrid}>
            {requiredTasks.map((task, index) => (
              <div
                key={index}
                className={styles.taskCard}
              >
                <div className={styles.taskRow}>
                  <span className={styles.taskName}>
                    {task.name}
                  </span>
                  <span className={`${styles.taskStatus} ${
                    task.isCompleted ? styles.taskStatusCompleted : styles.taskStatusPending
                  }`}>
                    {task.isCompleted ? 'Выполнено' : 'Ожидает выполнения'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        {post.tz_link && (
          <button
            onClick={(e) => handleTzLinkClick(post.tz_link, e)}
            className={styles.Button}
            title="Открыть техническое задание"
          >
            <ExternalLink className="w-4 h-4" />
            ТЗ
          </button>
        )}
        
        <PostDetailsButton post={post} />
      </div>
    </div>
  );
}