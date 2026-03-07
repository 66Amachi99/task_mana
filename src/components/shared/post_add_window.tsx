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

interface PostAddWindowProps {
  onClose: () => void;
  onPostAdded: () => Promise<void>;
  initialDate?: Date;
}

// Доступные статусы для поста
const POST_STATUSES = [
  { value: 'В работе', label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Завершен', label: 'Завершен', color: 'bg-green-100 text-green-800' },
];

export const PostAddWindow = ({ onClose, onPostAdded, initialDate }: PostAddWindowProps) => {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  // Устанавливаем false по умолчанию, чтобы избежать мгновенного появления текста загрузки
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
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
    post_status: 'В работе', // Статус по умолчанию
    responsible_person_id: '',
    post_needs_mini_video_smm: false,
    post_needs_video: false,
    post_needs_cover_photo: false,
    post_needs_photo_cards: false,
    post_needs_photogallery: false,
    post_needs_mini_gallery: false,
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

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultDateTime = (): string => {
    if (initialDate) {
      const date = new Date(initialDate);
      date.setHours(12, 0, 0, 0);
      return formatDateForInput(date);
    }
    
    const now = new Date();
    const defaultDate = new Date(now);
    defaultDate.setDate(now.getDate() + 7);
    defaultDate.setHours(12, 0, 0, 0);
    return formatDateForInput(defaultDate);
  };

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
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
        
        if (currentUser && data.length > 0) {
          const currentUserInList = data.find((u: User) => u.user_login === currentUser.login);
          if (currentUserInList) {
            setSelectedUser(currentUserInList);
            setFormData(prev => ({
              ...prev,
              responsible_person_id: currentUserInList.user_id.toString()
            }));
            setSearchQuery(currentUserInList.user_login);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      post_deadline: getDefaultDateTime()
    }));
  }, [initialDate]);

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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          post_deadline: deadlineDate.toISOString(),
          post_description: formData.post_description || null,
          tz_link: formData.tz_link || null,
          responsible_person_id: formData.responsible_person_id || null,
          tag_ids: selectedTags.map(t => t.tag_id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании поста');
      }

      await onPostAdded();

    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      setError(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Добавление нового поста</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название поста *</label>
                <input
                  type="text"
                  name="post_title"
                  value={formData.post_title}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="Введите название поста"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  name="post_description"
                  value={formData.post_description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-gray-100"
                  placeholder="Опишите детали поста"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ссылка на ТЗ</label>
                <input
                  type="text"
                  name="tz_link"
                  value={formData.tz_link}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  placeholder="https://example.com/document"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Теги</label>
                <div className="relative" ref={tagDropdownRef}>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[46px] p-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
                    {selectedTags.map(tag => (
                      <span key={tag.tag_id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm" style={{ backgroundColor: tag.color }}>
                        {tag.name}
                        <button type="button" onClick={() => handleTagRemove(tag.tag_id)} className="hover:opacity-80 ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => { setTagSearchQuery(e.target.value); setIsTagDropdownOpen(true); }}
                      onFocus={() => setIsTagDropdownOpen(true)}
                      placeholder="Поиск или создание..."
                      className="flex-1 min-w-[120px] outline-none text-sm py-1"
                    />
                  </div>
                  {isTagDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredTags.map(tag => (
                        <div key={tag.tag_id} onClick={() => handleTagSelect(tag)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </div>
                      ))}
                      {tagSearchQuery && filteredTags.length === 0 && (
                        <div onClick={handleCreateTag} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600 font-medium">
                          + Создать "{tagSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative min-h-[80px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ответственный</label>
                <div ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Поиск ответственного..."
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {selectedUser && (
                      <button type="button" onClick={clearSelectedUser} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Надпись загрузки теперь не сдвигает контент, а накладывается или заменяет текст поиска только при активном процессе */}
                  {loadingUsers && users.length === 0 && (
                    <span className="absolute right-10 top-[42px] text-xs text-blue-500 animate-pulse">Загрузка...</span>
                  )}

                  {isDropdownOpen && filteredUsers.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <div
                          key={user.user_id}
                          onClick={() => handleUserSelect(user)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${selectedUser?.user_id === user.user_id ? 'bg-blue-50' : ''}`}
                        >
                          <div className="font-medium text-gray-900">{user.user_login}</div>
                          <div className="text-xs text-gray-500">
                            {[user.admin_role && 'Админ', user.coordinator_role && 'Координатор', user.designer_role && 'Дизайнер', user.SMM_role && 'SMM', user.photographer_role && 'Фотограф'].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дедлайн (дата и время) *</label>
                <input
                  type="datetime-local"
                  name="post_deadline"
                  value={formData.post_deadline}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Необходимые задачи</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'post_needs_mini_video_smm', label: 'Мини-видео для SMM' },
                    { id: 'post_needs_video', label: 'Видео' },
                    { id: 'post_needs_cover_photo', label: 'Обложка' },
                    { id: 'post_needs_photo_cards', label: 'Фотокарточки' },
                    { id: 'post_needs_photogallery', label: 'Фотогалерея' },
                    { id: 'post_needs_mini_gallery', label: 'Мини-фотогалерея' },
                  ].map((task) => (
                    <label key={task.id} className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg transition-colors cursor-pointer ${isSubmitting ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        name={task.id}
                        checked={(formData as any)[task.id]}
                        onChange={(e) => handleCheckboxChange(e.target.name, e.target.checked)}
                        disabled={isSubmitting}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 text-sm font-medium">{task.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {isSubmitting ? 'Создание...' : 'Создать пост'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};