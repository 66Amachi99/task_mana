'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { Search, X } from 'lucide-react';

interface User {
  user_id: number;
  user_login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
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
  user?: {
    user_login: string;
  } | null;
  approved_by?: {
    user_login: string;
  } | null;
  tags?: Tag[];
}

interface EditPostWindowProps {
  onClose: () => void;
  post: PostData;
  onSuccess: () => Promise<void>;
}

export const EditPostWindow = ({ onClose, post, onSuccess }: EditPostWindowProps) => {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(post.tags || []);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    post_title: '',
    post_description: '',
    tz_link: '',
    post_deadline: '',
    responsible_person_id: '',
    post_needs_mini_video_smm: false,
    post_needs_video: false,
    post_needs_cover_photo: false,
    post_needs_photo_cards: false,
    post_needs_photogallery: false,
    post_needs_mini_gallery: false,
    // post_needs_text всегда true, не редактируется
  });

  // Загрузка тегов
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setTags(data);
      } catch (error) {
        console.error('Ошибка загрузки тегов:', error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (post) {
      const deadline = new Date(post.post_deadline);
      const year = deadline.getFullYear();
      const month = String(deadline.getMonth() + 1).padStart(2, '0');
      const day = String(deadline.getDate()).padStart(2, '0');
      const hours = String(deadline.getHours()).padStart(2, '0');
      const minutes = String(deadline.getMinutes()).padStart(2, '0');
      const formattedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData({
        post_title: post.post_title || '',
        post_description: post.post_description || '',
        tz_link: post.tz_link || '',
        post_deadline: formattedDeadline,
        responsible_person_id: post.responsible_person_id?.toString() || '',
        post_needs_mini_video_smm: post.post_needs_mini_video_smm || false,
        post_needs_video: post.post_needs_video || false,
        post_needs_cover_photo: post.post_needs_cover_photo || false,
        post_needs_photo_cards: post.post_needs_photo_cards || false,
        post_needs_photogallery: post.post_needs_photogallery || false,
        post_needs_mini_gallery: post.post_needs_mini_gallery || false,
      });

      if (post.responsible_person_id && users.length > 0) {
        const user = users.find(u => u.user_id === post.responsible_person_id);
        if (user) {
          setSelectedUser(user);
          setSearchQuery(user.user_login);
        }
      }
    }
  }, [post, users]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      responsible_person_id: user.user_id.toString()
    }));
    setSearchQuery(user.user_login);
    setIsDropdownOpen(false);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setFormData(prev => ({
      ...prev,
      responsible_person_id: ''
    }));
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
    
    if (!value.trim()) {
      setSelectedUser(null);
      setFormData(prev => ({
        ...prev,
        responsible_person_id: ''
      }));
    }
  };

  // Теги
  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.find(t => t.tag_id === tag.tag_id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchQuery('');
    setIsTagDropdownOpen(false);
  };

  const handleTagRemove = (tagId: number) => {
    setSelectedTags(selectedTags.filter(t => t.tag_id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!tagSearchQuery.trim()) return;
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagSearchQuery }),
      });
      
      if (response.ok) {
        const newTag = await response.json();
        setTags([...tags, newTag]);
        setSelectedTags([...selectedTags, newTag]);
        setTagSearchQuery('');
        setIsTagDropdownOpen(false);
      }
    } catch (error) {
      console.error('Ошибка создания тега:', error);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.find(t => t.tag_id === tag.tag_id)
  );

  const filteredUsers = users.filter(user =>
    user.user_login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.post_title.trim() || !formData.post_deadline) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const deadlineDate = new Date(formData.post_deadline);
      
      const response = await fetch('/api/posts/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.post_id,
          data: {
            post_title: formData.post_title,
            post_description: formData.post_description || null,
            tz_link: formData.tz_link || null,
            post_deadline: deadlineDate.toISOString(),
            responsible_person_id: formData.responsible_person_id || null,
            post_needs_mini_video_smm: formData.post_needs_mini_video_smm,
            post_needs_video: formData.post_needs_video,
            post_needs_cover_photo: formData.post_needs_cover_photo,
            post_needs_photo_cards: formData.post_needs_photo_cards,
            post_needs_photogallery: formData.post_needs_photogallery,
            post_needs_mini_gallery: formData.post_needs_mini_gallery,
            tag_ids: selectedTags.map(t => t.tag_id),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении поста');
      }

      await onSuccess();
      onClose();

    } catch (error) {
      console.error('Ошибка при обновлении поста:', error);
      setError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Редактирование поста</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название поста *
                </label>
                <input
                  type="text"
                  name="post_title"
                  value={formData.post_title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Введите название поста"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  name="post_description"
                  value={formData.post_description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Опишите детали поста (необязательно)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на ТЗ
                </label>
                <input
                  type="text"
                  name="tz_link"
                  value={formData.tz_link}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Введите ссылку..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Теги
                </label>
                <div className="relative" ref={tagDropdownRef}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.tag_id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag.tag_id)}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => {
                      setTagSearchQuery(e.target.value);
                      setIsTagDropdownOpen(true);
                    }}
                    onFocus={() => setIsTagDropdownOpen(true)}
                    placeholder="Поиск или создание тега..."
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  {isTagDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTags.length > 0 ? (
                        filteredTags.map(tag => (
                          <div
                            key={tag.tag_id}
                            onClick={() => handleTagSelect(tag)}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        ))
                      ) : tagSearchQuery.trim() ? (
                        <div
                          onClick={handleCreateTag}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600"
                        >
                          + Создать "{tagSearchQuery}"
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-gray-500">Введите текст для поиска</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ответственный
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Поиск ответственного..."
                      disabled={isSubmitting || loadingUsers}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={clearSelectedUser}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && !loadingUsers && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <div
                          key={user.user_id}
                          onClick={() => handleUserSelect(user)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                            selectedUser?.user_id === user.user_id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="font-medium">{user.user_login}</div>
                          <div className="text-xs text-gray-500">
                            {user.admin_role && 'Админ '}
                            {user.coordinator_role && 'Координатор '}
                            {user.designer_role && 'Дизайнер '}
                            {user.SMM_role && 'SMM '}
                            {user.photographer_role && 'Фотограф'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {loadingUsers && (
                  <p className="text-sm text-gray-500 mt-1">Загрузка пользователей...</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дедлайн (дата и время) *
                </label>
                <div className="space-y-4">
                  <input
                    type="datetime-local"
                    name="post_deadline"
                    value={formData.post_deadline}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Необходимые задачи
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_mini_video_smm"
                      checked={formData.post_needs_mini_video_smm}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Мини-видео для SMM</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_video"
                      checked={formData.post_needs_video}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Видео</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_cover_photo"
                      checked={formData.post_needs_cover_photo}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Обложка</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_photo_cards"
                      checked={formData.post_needs_photo_cards}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Фотокарточки</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_photogallery"
                      checked={formData.post_needs_photogallery}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Фотогалерея</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_mini_gallery"
                      checked={formData.post_needs_mini_gallery}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Мини-фотогалерея</span>
                  </label>

                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-32"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};