'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-roles';
import { Search, X } from 'lucide-react';
import { Task } from '../../../types/task';

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

interface EditTaskWindowProps {
  onClose: () => void;
  task: Task;
  onSuccess: () => Promise<void>;
}

export const EditTaskWindow = ({ onClose, task, onSuccess }: EditTaskWindowProps) => {
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(task.tags || []);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    priority: '0',
    task_status: '',
  });

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
    const startDate = new Date(task.start_time);
    const endDate = new Date(task.end_time);
    
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      title: task.title || '',
      description: task.description || '',
      start_time: formatDateForInput(startDate),
      end_time: formatDateForInput(endDate),
      all_day: task.all_day || false,
      priority: task.priority.toString(),
      task_status: task.task_status || 'Поставлена',
    });

    if (task.assignees && task.assignees.length > 0 && users.length > 0) {
      const assigneeUser = users.find(u => u.user_id === task.assignees[0].user_id);
      if (assigneeUser) {
        setSelectedAssignee(assigneeUser);
        setSearchQuery(assigneeUser.user_login);
      }
    }
  }, [task, users]);

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

  const handleAssigneeSelect = (user: User) => {
    setSelectedAssignee(user);
    setSearchQuery(user.user_login);
    setIsDropdownOpen(false);
  };

  const clearAssignee = () => {
    setSelectedAssignee(null);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
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
    user.user_login.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedAssignee || user.user_id !== selectedAssignee.user_id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.task_id,
          data: {
            title: formData.title,
            description: formData.description || null,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            all_day: formData.all_day,
            priority: parseInt(formData.priority),
            task_status: formData.task_status,
            assignee_id: selectedAssignee?.user_id || null,
            tag_ids: selectedTags.map(t => t.tag_id),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении задачи');
      }

      await onSuccess();
      onClose();

    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
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
            <h2 className="text-2xl font-bold text-gray-800">Редактирование задачи</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название задачи *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Введите название задачи"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                placeholder="Опишите детали задачи..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата и время начала *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата и время окончания *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="all_day"
                id="edit_all_day"
                checked={formData.all_day}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="edit_all_day" className="text-sm text-gray-700">
                Весь день
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                name="task_status"
                value={formData.task_status}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Поставлена">Поставлена</option>
                <option value="В работе">В работе</option>
                <option value="На проверке">На проверке</option>
                <option value="Выполнена">Выполнена</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Приоритет
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="0">Обычный</option>
                <option value="1">Низкий</option>
                <option value="2">Средний</option>
                <option value="3">Высокий</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Исполнитель
              </label>
              <div className="relative" ref={dropdownRef}>
                {selectedAssignee && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {selectedAssignee.user_login}
                      <button
                        type="button"
                        onClick={clearAssignee}
                        className="hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Поиск исполнителя..."
                  disabled={isSubmitting || loadingUsers}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
                {isDropdownOpen && !loadingUsers && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div
                        key={user.user_id}
                        onClick={() => handleAssigneeSelect(user)}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
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
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: tag.color, color: tag.color }}
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