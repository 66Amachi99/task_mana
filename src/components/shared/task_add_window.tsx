'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-roles';
import { X, Users } from 'lucide-react';

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

interface TaskAddWindowProps {
  onClose: () => void;
  onTaskAdded: () => Promise<void>;
  initialDate?: Date;
}

// Хук для закрытия дропдаунов по клику вне
const useOutsideClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [callback]);
  return ref;
};

// Компонент выбора нескольких исполнителей
const AssigneesSelector = ({ selectedUsers, users, onChange, disabled }: {
  selectedUsers: User[];
  users: User[];
  onChange: (users: User[]) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = users.filter(u => 
    u.user_login.toLowerCase().includes(search.toLowerCase()) && 
    !selectedUsers.some(selected => selected.user_id === u.user_id)
  );

  const handleSelect = (user: User) => {
    onChange([...selectedUsers, user]);
    setSearch('');
    // Не закрываем дропдаун, чтобы можно было выбрать нескольких
  };

  const handleRemove = (userId: number) => {
    onChange(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <div className="relative" ref={ref}>
      {/* Выбранные пользователи */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map(user => (
            <span key={user.user_id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {user.user_login}
              <button type="button" onClick={() => handleRemove(user.user_id)} disabled={disabled} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Поле поиска */}
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Поиск исполнителей..."
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      
      {/* Выпадающий список */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(user => (
            <div
              key={user.user_id}
              onClick={() => handleSelect(user)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">{user.user_login}</div>
              <div className="text-xs text-gray-500">
                {[
                  user.admin_role && 'Админ',
                  user.coordinator_role && 'Координатор',
                  user.designer_role && 'Дизайнер',
                  user.SMM_role && 'SMM',
                  user.photographer_role && 'Фотограф'
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Пустой результат */}
      {isOpen && filtered.length === 0 && search.trim() && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-gray-500">
          Пользователи не найдены
        </div>
      )}
    </div>
  );
};

// Компонент выбора тегов
const TagSelector = ({ selectedTags, availableTags, onChange, onCreate, disabled }: {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreate: (name: string) => Promise<Tag | null>;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = availableTags.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) && 
    !selectedTags.some(st => st.tag_id === t.tag_id)
  );

  const handleSelect = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setSearch('');
    setIsOpen(false);
  };

  const handleCreate = async () => {
    if (!search.trim()) return;
    const newTag = await onCreate(search);
    if (newTag) handleSelect(newTag);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onChange(selectedTags.filter(t => t.tag_id !== tag.tag_id))}
              disabled={disabled}
              className="hover:opacity-80 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Поиск или создание тега..."
          disabled={disabled}
          className="flex-1 min-w-[140px] outline-none text-sm bg-transparent py-1"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => handleSelect(tag)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : search.trim() ? (
            <div
              onClick={handleCreate}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600"
            >
              + Создать "{search}"
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500">Введите текст для поиска</div>
          )}
        </div>
      )}
    </div>
  );
};

export const TaskAddWindow = ({ onClose, onTaskAdded, initialDate }: TaskAddWindowProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Состояния формы
  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    all_day: false,
    priority: '0',
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

  // Загрузка пользователей
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

  // Форматирование даты для input
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Установка начальных дат
  const getDefaultDateTime = (): string => {
    if (initialDate) {
      const date = new Date(initialDate);
      date.setHours(12, 0, 0, 0);
      return formatDateForInput(date);
    }
    
    const now = new Date();
    const defaultDate = new Date(now);
    defaultDate.setDate(now.getDate() + 1);
    defaultDate.setHours(12, 0, 0, 0);
    return formatDateForInput(defaultDate);
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      start_time: getDefaultDateTime(),
      end_time: getDefaultDateTime()
    }));
  }, [initialDate]);

  // Блокировка скролла
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

  const handleCreateTag = async (name: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        const newTag = await response.json();
        setTags(prev => [...prev, newTag]);
        return newTag;
      }
    } catch (error) {
      console.error('Ошибка создания тега:', error);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          all_day: formData.all_day,
          priority: parseInt(formData.priority),
          assignee_ids: selectedAssignees.map(a => a.user_id), // Массив ID
          tag_ids: selectedTags.map(t => t.tag_id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании задачи');
      }

      await onTaskAdded();
      onClose();

    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
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
            <h2 className="text-2xl font-bold text-gray-800">Создание новой задачи</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Закрыть"
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
            {/* Название задачи */}
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

            {/* Описание */}
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

            {/* Даты */}
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

            {/* Весь день */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="all_day"
                id="all_day"
                checked={formData.all_day}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="all_day" className="text-sm text-gray-700">
                Весь день
              </label>
            </div>

            {/* Приоритет */}
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

            {/* Исполнители - ОБНОВЛЕНО: множественный выбор */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Исполнители
              </label>
              <AssigneesSelector
                selectedUsers={selectedAssignees}
                users={users}
                onChange={setSelectedAssignees}
                disabled={isSubmitting || loadingUsers}
              />
            </div>

            {/* Теги */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Теги
              </label>
              <TagSelector
                selectedTags={selectedTags}
                availableTags={tags}
                onChange={setSelectedTags}
                onCreate={handleCreateTag}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Кнопки */}
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
              {isSubmitting ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};