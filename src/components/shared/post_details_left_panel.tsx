'use client';

import { ExternalLink, CheckCircle, Globe, Link } from 'lucide-react';
import { SOCIAL_CONFIG, SocialLinks, SocialKey } from './post_details_window';

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
  [key: string]: unknown;
}

interface PostDetailsLeftPanelProps {
  post: PostData;
  socialLinks: SocialLinks;
  onSocialLinkChange: (social: string, value: string) => void;
  canManageSocial: boolean;
  isSaving: boolean;
  isActionLoading: boolean;
}

// Утилиты
const formatDate = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return date ? 'Неверная дата' : 'Не указана';
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

export const PostDetailsLeftPanel = ({
  post,
  socialLinks,
  onSocialLinkChange,
  canManageSocial,
  isSaving,
  isActionLoading
}: PostDetailsLeftPanelProps) => {
  const hasSavedSocialLinks = SOCIAL_CONFIG.some(s => post[s.publishedKey]);

  return (
    <div className="flex flex-col">
      {/* Статус и теги */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
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

      {/* Описание */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="h-32 overflow-y-auto p-3">
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {post.post_description || 'Нет описания'}
            </p>
          </div>
        </div>
      </div>

      {/* Ссылка на ТЗ */}
      {post.tz_link && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Ссылка на ТЗ</h4>
          <a href={post.tz_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ExternalLink className="w-4 h-4" />
            Открыть ТЗ
          </a>
        </div>
      )}

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

      {/* Мета-информация */}
      <div className="space-y-3 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Дедлайн</h4>
            <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm font-medium text-red-700">{formatDate(post.post_deadline)}</p>
              <p className="text-xs text-red-500 mt-1">{formatTime(post.post_deadline)}</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Создан</h4>
            <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{formatDate(post.post_date)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatTime(post.post_date)}</p>
            </div>
          </div>
        </div>

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

        {post.feedback_comment && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Комментарий</h4>
            <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-800">{post.feedback_comment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};