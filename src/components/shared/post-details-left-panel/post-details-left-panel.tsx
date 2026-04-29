'use client';

import { useMemo } from 'react';
import { CheckCircle, Globe, Edit2, X, Save, Trash2, ExternalLink } from 'lucide-react';
import { SOCIAL_CONFIG, TASK_CONFIG } from '../post-details-window/post-details-window';
import { getStatusColor } from '../../../lib/post-status';
import type { SocialLinks, Tag, PostData } from '../post-details-window/post-details-window';
import { DatePicker } from '../../ui/date-picker/date_picker';
import { AutoResizeTextarea } from '../../ui/auto-resize-textarea/auto-resize-textarea';
import { TagSelector } from '../../ui/tag-selector/tag-selector';
import styles from './PostDetailsLeftPanel.module.css';

import { ActionButton } from '../../ui/action-button/action-button';

interface PostDetailsLeftPanelProps {
  post: PostData;
  socialLinks: SocialLinks;
  onSocialLinkChange: (social: string, value: string) => void;
  canManageSocial: boolean;
  isSaving: boolean;
  isActionLoading: boolean;

  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  editedTitle: string;
  onTitleChange: (value: string) => void;
  editedDescription: string;
  onDescriptionChange: (value: string) => void;
  editedTzLink: string;
  onTzLinkChange: (value: string) => void;
  selectedTasks: boolean[];
  onTaskToggle: (taskId: number) => void;

  selectedTags: Tag[];
  availableTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onTagCreate: (name: string) => Promise<Tag | null>;
  isDisabled?: boolean;

  deadlineValue: Date;
  onDeadlineChange: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  datePickerRef: React.RefObject<HTMLDivElement | null>;

  onApprove?: () => void;
  onUnapprove?: () => void;
  onPublishToggle?: () => void;
  onDelete?: () => void;
  canApprove: boolean;
  canUnapprove: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canEditPost: boolean;

  onSaveChanges: () => void;
  hasChanges?: boolean;

  isPublished: boolean;
  approvedBy: { user_login: string } | null;
  localSocialLinks: SocialLinks;
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
  'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
] as const;

const WEEKDAY_NAMES = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
  'Четверг', 'Пятница', 'Суббота',
] as const;

function formatDeadline(date: Date | null): string {
  if (!date) return 'Не указана';

  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${weekday} ${hours}:${minutes}`;
}

// ─── Основной компонент ──────────────────────────────────────────────────────

export const PostDetailsLeftPanel = ({
  post,
  socialLinks,
  onSocialLinkChange,
  canManageSocial,
  isSaving,
  isActionLoading,
  isEditing,
  onEditStart,
  onEditCancel,
  onSave,
  editedTitle,
  onTitleChange,
  editedDescription,
  onDescriptionChange,
  editedTzLink,
  onTzLinkChange,
  selectedTasks,
  onTaskToggle,
  selectedTags,
  availableTags,
  onTagsChange,
  onTagCreate,
  deadlineValue,
  onDeadlineChange,
  showDatePicker,
  setShowDatePicker,
  datePickerRef,
  onApprove,
  onUnapprove,
  onPublishToggle,
  onDelete,
  canApprove,
  canUnapprove,
  canPublish,
  canDelete,
  canEditPost,
  onSaveChanges,
  hasChanges,
  isPublished,
  approvedBy,
  localSocialLinks,
}: PostDetailsLeftPanelProps) => {
  const isDisabled = isSaving || isActionLoading;

  const hasSavedSocialLinks = useMemo(
    () => SOCIAL_CONFIG.some(s => localSocialLinks[s.key]?.trim() !== ''),
    [localSocialLinks],
  );

  const taskButtons = useMemo(
    () =>
      TASK_CONFIG.map(cfg => ({
        id: cfg.id,
        label: cfg.label,
        isSelected: selectedTasks[cfg.id - 1] || false,
      })),
    [selectedTasks],
  );

  const postStatus = post.post_status || 'В работе';
  const statusColor = getStatusColor(postStatus);

  return (
    <div className={styles.panel}>
      {/* Дедлайн */}
      <div className={styles.deadlineContainer} ref={datePickerRef}>
        {isEditing ? (
          <DatePicker value={deadlineValue} onChange={onDeadlineChange} />
        ) : (
          <div className={styles.deadlineButtonDefault}>
            <span className={styles.deadlineValueDefault}>
              {formatDeadline(deadlineValue)}
            </span>
          </div>
        )}
      </div>

      {/* Заголовок */}
      {isEditing ? (
        <input
          type="text"
          value={editedTitle}
          onChange={e => onTitleChange(e.target.value)}
          className={styles.titleInput}
          placeholder="Название поста"
        />
      ) : (
        <h2 className={styles.titleDisplay}>{editedTitle}</h2>
      )}

      {/* Статус поста — скрывается в режиме редактирования */}
      {!isEditing && (
        <div className={styles.statusRow}>
          <div className={`${styles.statusBadge} ${statusColor}`}>
            {postStatus}
          </div>
        </div>
      )}

      {/* Теги */}
      {isEditing ? (
        <TagSelector
          selectedTags={selectedTags}
          availableTags={availableTags}
          onChange={onTagsChange}
          onCreate={onTagCreate}
          disabled={isDisabled}
        />
      ) : (
        selectedTags.length > 0 && (
          <div className={styles.tagsView}>
            {selectedTags.map(tag => (
              <span
                key={tag.tag_id}
                className={styles.tagChip}
                style={{ backgroundColor: tag.color }}
              >
                <span style={{ opacity: 0.4, marginRight: '4px' }}>#</span>
                {tag.name}
              </span>
            ))}
          </div>
        )
      )}

      {/* Описание */}
      {isEditing ? (
        <AutoResizeTextarea
          value={editedDescription}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder="Описание поста..."
          disabled={isDisabled}
          className={styles.descriptionTextarea}
        />
      ) : (
        <div className={styles.descriptionBox}>
          <div className={styles.descriptionPreview}>
            <p className={styles.descriptionPreviewText}>
              {editedDescription || 'Нет описания'}
            </p>
          </div>
        </div>
      )}

      {/* Ссылка на ТЗ */}
      {isEditing ? (
        <input
          type="text"
          value={editedTzLink}
          onChange={e => onTzLinkChange(e.target.value)}
          className={styles.tzInput}
          placeholder="https://example.com/document"
        />
      ) : (
        editedTzLink && (
          <ActionButton
            onClick={() => window.open(editedTzLink, '_blank', 'noopener, noreferrer')}
            variant="fit"
            icon={ExternalLink}
          >
            Открыть ТЗ
          </ActionButton>
        )
      )}

      {/* Задачи в виде кнопок */}
      {isEditing && (
        <div>
          <div className={styles.taskButtons}>
            {taskButtons.map(btn => (
              <button
                key={btn.id}
                onClick={() => onTaskToggle(btn.id)}
                className={btn.isSelected ? styles.taskButtonSelected : styles.taskButtonDefault}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Соцсети — редактирование ссылок публикации */}
      {isPublished && canManageSocial && (
        <div className={styles.socialSection}>
          <div className={styles.socialList}>
            {SOCIAL_CONFIG.map(social => (
              <div key={social.key} className={styles.socialItem}>
                <div className={styles.socialLabel}>
                  <img src={social.icon} alt={social.label} className={styles.socialIcon} />
                  <span>{social.label}</span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={socialLinks[social.key]}
                    onChange={e => onSocialLinkChange(social.key, e.target.value)}
                    placeholder={social.placeholder}
                    className={styles.socialInput}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Соцсети — только просмотр */}
      {isPublished && hasSavedSocialLinks && !canManageSocial && (
        <div className={styles.socialViewSection}>
          <h3 className={styles.socialViewTitle}>Опубликовано в:</h3>
          <div className={styles.socialLinksRow}>
            {SOCIAL_CONFIG.map(social => {
              const url = localSocialLinks[social.key];
              if (!url) return null;
              return (
                <a
                  key={social.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <img src={social.icon} alt={social.label} className={styles.socialIcon} />
                  <span>{social.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Согласование */}
      {approvedBy && (
        <div className={styles.approvedContainer}>
          <div className={styles.approvedBox}>
            <p className={styles.approvedName}>
              <CheckCircle className="w-4 h-4" />
              <span>Согласовано: </span>
              {approvedBy.user_login}
            </p>
          </div>
          {canUnapprove && !isEditing && (
            <ActionButton
              onClick={onUnapprove}
              variant="base"
              disabled={isActionLoading}
            >
              Снять согласование
            </ActionButton>
          )}
        </div>
      )}

      {/* Кнопки действий */}
      <div className={styles.actions}>
        {!isEditing && (
          <ActionButton
            onClick={onSaveChanges}
            disabled={isDisabled || !hasChanges}
            variant="base"
            icon={Save}
          >
            Сохранить
          </ActionButton>
        )}

        {canEditPost && !isEditing && (
          <ActionButton
            onClick={onEditStart}
            variant="base"
            icon={Edit2}
          >
            Изменить
          </ActionButton>
        )}

        {isEditing && (
          <>
            <ActionButton
              onClick={onSave}
              disabled={isSaving}
              variant="base"
              icon={Save}
            >
              Сохранить
            </ActionButton>
            <ActionButton
              onClick={onEditCancel}
              variant="lightGray"
              icon={X}
            >
              Отмена
            </ActionButton>
          </>
        )}

        {canApprove && !approvedBy && !isEditing && (
          <ActionButton
            onClick={onApprove}
            variant="base"
            icon={CheckCircle}
          >
            Согласовать
          </ActionButton>
        )}

        {canPublish && !isEditing && (
          <ActionButton
            onClick={onPublishToggle}
            variant="publish"
            icon={Globe}
            isPublished={isPublished}
          >
            {isPublished ? 'Снять с публикации' : 'Опубликовать'}
          </ActionButton>
        )}

        {canDelete && !isEditing && (
          <ActionButton
            onClick={onDelete}
            variant="red"
            icon={Trash2}
          >
            Удалить
          </ActionButton>
        )}
      </div>
    </div>
  );
};