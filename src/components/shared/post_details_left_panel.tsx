'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle, Globe, Link, Edit2, X, Save, Trash2 } from 'lucide-react';
import { SOCIAL_CONFIG, TASK_CONFIG, SocialLinks } from './post_details_window';

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

  // edit post (контент)
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

  // tags
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

  // deadline
  deadlineValue: Date;
  onDeadlineChange: (date: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  datePickerRef: React.RefObject<HTMLDivElement | null>;

  // actions
  onApprove?: () => void;
  onPublishToggle?: () => void;
  onDelete?: () => void;
  canApprove: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canEditPost: boolean;

  // единая кнопка сохранения
  onSaveChanges: () => void;
  hasChanges?: boolean;
}

const formatDeadline = (date: Date | null): string => {
  if (!date) return 'Не указана';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return formatter.format(date);
};

const DatePicker = ({ value, onChange }: { value: Date; onChange: (date: Date) => void }) => {
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="absolute z-50 mt-2 p-4 bg-white border rounded-lg shadow-xl">
      <input
        type="datetime-local"
        value={formatDateForInput(value)}
        onChange={e => onChange(new Date(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
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
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 mb-2 min-h-10 p-2 border rounded-lg bg-white">
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: tag.color,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {tag.name}
            <button type="button" onClick={() => onTagRemove(tag.tag_id)} className="hover:opacity-80 ml-1" disabled={disabled}>
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
          className="flex-1 min-w-30 outline-none text-sm"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => onTagSelect(tag)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div onClick={onCreateTag} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600">
              + Создать "{searchQuery}"
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500">Введите текст для поиска</div>
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
  onPublishToggle,
  onDelete,
  canApprove,
  canPublish,
  canDelete,
  canEditPost,
  onSaveChanges,
  hasChanges,
}: PostDetailsLeftPanelProps) => {
  const hasSavedSocialLinks = SOCIAL_CONFIG.some(s => post[s.publishedKey]);

  const taskButtons = TASK_CONFIG.map(cfg => ({
    id: cfg.id,
    label: cfg.label,
    isSelected: selectedTasks[cfg.id - 1] || false,
  }));

  return (
    <div className="flex flex-col space-y-6">
      {/* Дедлайн */}
      <div className="relative" ref={datePickerRef}>
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
            isEditing ? 'bg-blue-50 border-blue-200 hover:border-blue-400' : 'bg-red-50 border-red-200 hover:border-red-300'
          }`}
        >
          <span className={`text-sm block ${isEditing ? 'text-blue-600' : 'text-red-600'}`}>Дедлайн</span>
          <span className={`text-lg font-semibold ${isEditing ? 'text-blue-800' : 'text-red-800'}`}>
            {formatDeadline(deadlineValue)}
          </span>
        </button>

        {showDatePicker && (
          <DatePicker
            value={deadlineValue}
            onChange={date => {
              onDeadlineChange(date);
            }}
          />
        )}
      </div>

      {/* Заголовок */}
      <div>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full px-4 py-3 text-xl font-semibold border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Название поста"
          />
        ) : (
          <h2 className="text-2xl font-semibold text-gray-800">{post.post_title}</h2>
        )}
      </div>

      {/* Статус и теги */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Статус:</span>
          <span className="text-sm font-medium text-gray-800">{post.post_status}</span>

          {post.approved_by && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Согласовано</span>
            </div>
          )}

          {post.is_published && (
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
              <Globe className="w-4 h-4" />
              <span>Опубликовано</span>
            </div>
          )}
        </div>

        {/* Теги */}
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
          post.tags &&
          post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map(tag => (
                <span
                  key={tag.tag_id}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: tag.color,
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )
        )}
      </div>

      {/* Описание */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={e => onDescriptionChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Описание поста..."
          />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto p-4">
              <p className="text-sm text-gray-600 whitespace-pre-line">{post.post_description || 'Нет описания'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Ссылка на ТЗ */}
      <div>
        <h4 className="text-xs font-medium text-gray-700 mb-2">Ссылка на ТЗ</h4>
        {isEditing ? (
          <input
            type="text"
            value={editedTzLink}
            onChange={e => onTzLinkChange(e.target.value)}
            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/document"
          />
        ) : (
          post.tz_link && (
            <a
              href={post.tz_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Открыть ТЗ
            </a>
          )
        )}
      </div>

      {/* Задачи в виде кнопок */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Необходимые задачи</h4>
        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            {taskButtons.map(button => (
              <button
                key={button.id}
                onClick={() => onTaskToggle(button.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${button.isSelected ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}
                `}
              >
                {button.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {TASK_CONFIG.map(cfg => {
              if (post[cfg.needsKey]) {
                return (
                  <span key={cfg.id} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                    {cfg.label}
                  </span>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      {/* Соцсети (редактирование ссылок публикации) */}
      {post.is_published && canManageSocial && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                    onChange={e => onSocialLinkChange(social.key, e.target.value)}
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
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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

      {/* Ответственный */}
      {post.user && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">Ответственный</h4>
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm font-medium text-blue-700 truncate">{post.user.user_login}</p>
          </div>
        </div>
      )}

      {post.approved_by && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-1">Согласовано</h4>
          <div className="p-2 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-sm font-medium text-green-700 truncate flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {post.approved_by.user_login}
            </p>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
        {/* ЕДИНАЯ кнопка сохранения - только когда НЕ в режиме редактирования */}
        {!isEditing && (
          <button
            onClick={onSaveChanges}
            disabled={isSaving || isActionLoading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Сохранить изменения
          </button>
        )}

        {canEditPost && !isEditing && (
          <button
            onClick={onEditStart}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </button>
            <button
              onClick={onEditCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Отмена
            </button>
          </>
        )}

        {canApprove && !post.approved_by && !isEditing && (
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Согласовать
          </button>
        )}

        {canPublish && !isEditing && (
          <button
            onClick={onPublishToggle}
            className={`px-4 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 ${
              post.is_published ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            {post.is_published ? 'Снять с публикации' : 'Опубликовать'}
          </button>
        )}

        {canDelete && !isEditing && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};