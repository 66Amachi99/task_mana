'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle, Globe, Edit2, X, Save, Trash2 } from 'lucide-react';
import { SOCIAL_CONFIG, TASK_CONFIG, SocialLinks } from './post_details_window';
import { DatePicker } from '../ui/date_picker';
import styles from '../styles/PostDetailsLeftPanel.module.css';
import { AutoResizeTextarea } from '../ui/auto_resize_textarea';

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
  post_date: Date | null;
  post_deadline: Date;
  responsible_person_id: number | null;
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  tags?: Tag[];
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_photogallery: boolean;
  post_needs_mini_gallery: boolean;
  post_needs_text: boolean;
  [key: string]: unknown;
}

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

  availableTags: Tag[];
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagRemove: (tagId: number) => void;
  onTagSearchChange: (value: string) => void;
  tagSearchQuery: string;
  onTagCreate: () => Promise<void>;
  filteredTags: Tag[];
  showTagDropdown: boolean;
  setShowTagDropdown: (show: boolean) => void;
  tagDropdownRef: React.RefObject<HTMLDivElement | null>;

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

  // Актуальные состояния после действий
  isPublished: boolean;
  approvedBy: { user_login: string } | null;
  localSocialLinks: SocialLinks; // для отображения соцсетей
}

const formatDeadline = (date: Date | null): string => {
  if (!date) return 'Не указана';

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const month = monthNames[date.getMonth()];
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

  const weekdayNames = [
    'воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'
  ];
  const weekday = weekdayNames[date.getDay()];
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${monthCapitalized} ${weekdayCapitalized} ${hours}:${minutes}`;
};

const TagSelector = ({
  selectedTags,
  onTagSelect,
  onTagRemove,
  onSearchChange,
  searchQuery,
  onCreateTag,
  filteredTags,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  disabled,
}: {
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagRemove: (tagId: number) => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
  onCreateTag: () => void;
  filteredTags: Tag[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
}) => {
  return (
    <div className={styles.tagSelector} ref={dropdownRef}>
      <div className={styles.tagSelectorInputContainer}>
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className={styles.tagChipEditable}
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onTagRemove(tag.tag_id)}
              className={styles.tagRemoveButton}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            onSearchChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 120);
          }}
          placeholder="Поиск тегов..."
          disabled={disabled}
          className={styles.tagSearchInput}
        />
      </div>

      {showDropdown && (
        <div className={`${styles.tagDropdown} no-scrollbar`}>
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => onTagSelect(tag)}
                className={styles.tagOption}
              >
                <span className={styles.tagColorDot} style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div onClick={onCreateTag} className={styles.createTagOption}>
              + Создать "{searchQuery}"
            </div>
          ) : (
            <div className={styles.noTagsMessage}>Введите текст для поиска</div>
          )}
        </div>
      )}
    </div>
  );
};

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
  availableTags,
  selectedTags,
  onTagSelect,
  onTagRemove,
  onTagSearchChange,
  tagSearchQuery,
  onTagCreate,
  filteredTags,
  showTagDropdown,
  setShowTagDropdown,
  tagDropdownRef,
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
  const hasSavedSocialLinks = SOCIAL_CONFIG.some(s => localSocialLinks[s.key]?.trim() !== '');

  const taskButtons = TASK_CONFIG.map(cfg => ({
    id: cfg.id,
    label: cfg.label,
    isSelected: selectedTasks[cfg.id - 1] || false,
  }));

  const deadlineButtonClass = isEditing ? styles.deadlineButtonEditing : styles.deadlineButtonDefault;
  const deadlineValueClass = isEditing ? styles.deadlineValueEditing : styles.deadlineValueDefault;

  return (
    <div className={styles.panel}>
      {/* Дедлайн */}
      <div className={styles.deadlineContainer} ref={datePickerRef}>
        {isEditing ? (
          <DatePicker value={deadlineValue} onChange={onDeadlineChange} />
        ) : (
          <div className={deadlineButtonClass}>
            <span className={deadlineValueClass}>
              {formatDeadline(deadlineValue)}
            </span>
          </div>
        )}
      </div>

      {/* Заголовок */}
      <div>
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
      </div>

      {/* Теги */}
      <div>
        {isEditing ? (
          <TagSelector
            selectedTags={selectedTags}
            onTagSelect={onTagSelect}
            onTagRemove={onTagRemove}
            onSearchChange={onTagSearchChange}
            searchQuery={tagSearchQuery}
            onCreateTag={onTagCreate as any}
            filteredTags={filteredTags}
            showDropdown={showTagDropdown}
            setShowDropdown={setShowTagDropdown}
            dropdownRef={tagDropdownRef}
            disabled={isSaving || isActionLoading}
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
                  #{tag.name}
                </span>
              ))}
            </div>
          )
        )}
      </div>

      {/* Описание */}
      <div>
        {isEditing ? (
          <AutoResizeTextarea
            value={editedDescription}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder="Описание поста..."
            disabled={isSaving || isActionLoading}
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
      </div>

      {/* Ссылка на ТЗ */}
      <div>
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
            <a
              href={editedTzLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tzLink}
            >
              Открыть ТЗ
            </a>
          )
        )}
      </div>

      {/* Задачи в виде кнопок */}
      {isEditing && (
        <div>
          <h4 className={styles.tasksTitle}>Необходимые задачи</h4>
          <div className={styles.taskButtons}>
            {taskButtons.map(button => (
              <button
                key={button.id}
                onClick={() => onTaskToggle(button.id)}
                className={button.isSelected ? styles.taskButtonSelected : styles.taskButtonDefault}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Соцсети (редактирование ссылок публикации) */}
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
                    disabled={isSaving || isActionLoading}
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
            <button
              onClick={onUnapprove}
              className={`${styles.button} ${styles.buttonGray}`}
              disabled={isActionLoading}
            >
              Снять согласование
            </button>
          )}
        </div>
      )}

      {/* Кнопки действий */}
      <div className={styles.actions}>
        {!isEditing && (
          <button
            onClick={onSaveChanges}
            disabled={isSaving || isActionLoading || !hasChanges}
            className={`${styles.button} ${styles.buttonBlue}`}
          >
            <Save className="w-4 h-4" />
            Сохранить изменения
          </button>
        )}

        {canEditPost && !isEditing && (
          <button
            onClick={onEditStart}
            className={`${styles.button} ${styles.buttonGray}`}
          >
            <Edit2 className="w-4 h-4" />
            Редактировать
          </button>
        )}

        {isEditing && (
          <>
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`${styles.button} ${styles.buttonGreen}`}
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
            <button
              onClick={onEditCancel}
              className={`${styles.button} ${styles.buttonLightGray}`}
            >
              <X className="w-4 h-4" />
              Отмена
            </button>
          </>
        )}

        {canApprove && !approvedBy && !isEditing && (
          <button
            onClick={onApprove}
            className={`${styles.button} ${styles.buttonGreen}`}
          >
            <CheckCircle className="w-4 h-4" />
            Согласовать
          </button>
        )}

        {canPublish && !isEditing && (
          <button
            onClick={onPublishToggle}
            className={`${styles.button} ${
              isPublished ? styles.publishButtonPublished : styles.publishButtonUnpublished
            }`}
          >
            <Globe className="w-4 h-4" />
            {isPublished ? 'Снять с публикации' : 'Опубликовать'}
          </button>
        )}

        {canDelete && !isEditing && (
          <button
            onClick={onDelete}
            className={`${styles.button} ${styles.buttonRed}`}
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};