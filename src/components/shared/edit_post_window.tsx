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
  videomaker_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
}

interface PostData {
  post_id: number;
  post_title: string;
  post_description: string;
  post_needs_video_smm: boolean;
  post_needs_video_maker: boolean;
  post_needs_text: boolean;
  post_needs_photogallery: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_date: Date | null;
  post_deadline: Date;
  post_type: string;
  responsible_person_id: number | null;
  user?: {
    user_login: string;
  } | null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    post_title: '',
    post_description: '',
    post_type: '',
    post_deadline: '',
    responsible_person_id: '',
    post_needs_video_smm: false,
    post_needs_video_maker: false,
    post_needs_text: false,
    post_needs_photogallery: false,
    post_needs_cover_photo: false,
    post_needs_photo_cards: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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

  const setTasksByPostType = (postType: string) => {
    const baseState = {
      post_needs_video_smm: false,
      post_needs_video_maker: false,
      post_needs_text: false,
      post_needs_photogallery: false,
      post_needs_cover_photo: false,
      post_needs_photo_cards: false,
    };

    switch (postType) {
      case 'Видео':
        return {
          ...baseState,
          post_needs_video_maker: true
        };
      case 'Фотопост':
        return {
          ...baseState,
          post_needs_photo_cards: true,
          post_needs_photogallery: true,
          post_needs_cover_photo: true
        };
      case 'Афиша':
        return {
          ...baseState,
          post_needs_cover_photo: true,
          post_needs_video_smm: true
        };
      case 'Светлана Юрьевна':
        return {
          ...baseState,
          post_needs_video_smm: true
        };
      case 'Рубрика':
        return {
          ...baseState,
          post_needs_text: true
        };
      case 'ЧЕ':
        return {
          post_needs_video_smm: true,
          post_needs_video_maker: true,
          post_needs_text: true,
          post_needs_photogallery: true,
          post_needs_cover_photo: true,
          post_needs_photo_cards: true
        };
      default:
        return baseState;
    }
  };

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
        post_type: post.post_type || '',
        post_deadline: formattedDeadline,
        responsible_person_id: post.responsible_person_id?.toString() || '',
        post_needs_video_smm: post.post_needs_video_smm || false,
        post_needs_video_maker: post.post_needs_video_maker || false,
        post_needs_text: post.post_needs_text || false,
        post_needs_photogallery: post.post_needs_photogallery || false,
        post_needs_cover_photo: post.post_needs_cover_photo || false,
        post_needs_photo_cards: post.post_needs_photo_cards || false,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      if (name === 'post_type') {
        const tasks = setTasksByPostType(value);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          ...tasks
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
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

  const filteredUsers = users.filter(user =>
    user.user_login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.post_title.trim() || !formData.post_type || !formData.post_deadline) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const deadlineDate = new Date(formData.post_deadline);
      
      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.post_id,
          data: {
            post_title: formData.post_title,
            post_description: formData.post_description || null,
            post_type: formData.post_type,
            post_deadline: deadlineDate.toISOString(),
            responsible_person_id: formData.responsible_person_id || null,
            post_needs_video_smm: formData.post_needs_video_smm,
            post_needs_video_maker: formData.post_needs_video_maker,
            post_needs_text: formData.post_needs_text,
            post_needs_photogallery: formData.post_needs_photogallery,
            post_needs_cover_photo: formData.post_needs_cover_photo,
            post_needs_photo_cards: formData.post_needs_photo_cards,
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

  const formatDateTimeDisplay = (dateTimeString: string) => {
    if (!dateTimeString) return 'Не указано';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
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
                  Тип поста *
                </label>
                <select
                  name="post_type"
                  value={formData.post_type}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Выберите тип</option>
                  <option value="Видео">Видео</option>
                  <option value="Фотопост">Фотопост</option>
                  <option value="Афиша">Афиша</option>
                  <option value="Светлана Юрьевна">Светлана Юрьевна</option>
                  <option value="Рубрика">Рубрика</option>
                  <option value="ЧЕ">ЧЕ</option>
                </select>
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
                            {user.videomaker_role && 'Видеомейкер '}
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
                      name="post_needs_video_smm"
                      checked={formData.post_needs_video_smm}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Видео для SMM</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_video_maker"
                      checked={formData.post_needs_video_maker}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Видео для видеомейкера</span>
                  </label>

                  <label className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      name="post_needs_text"
                      checked={formData.post_needs_text}
                      onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                      disabled={isSubmitting}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-700">Текст</span>
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