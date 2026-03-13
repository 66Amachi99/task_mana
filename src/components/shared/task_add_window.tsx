'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-roles';
import { X, Users } from 'lucide-react';
import { DatePicker } from '../ui/date_picker';
import styles from '../styles/TaskAddWindow.module.css';

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

// Компонент выбора нескольких исполнителей (без изменений)
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
  };

  const handleRemove = (userId: number) => {
    onChange(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <div className={styles.relative} ref={ref}>
      {selectedUsers.length > 0 && (
        <div className={styles.selectedAssignees}>
          {selectedUsers.map(user => (
            <span key={user.user_id} className={styles.assigneeChip}>
              {user.user_login}
              <button
                type="button"
                onClick={() => handleRemove(user.user_id)}
                disabled={disabled}
                className={styles.assigneeChipRemove}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Поиск исполнителей..."
        disabled={disabled}
        className={styles.assigneeInput}
      />
      
      {isOpen && filtered.length > 0 && (
        <div className={styles.dropdown}>
          {filtered.map(user => (
            <div
              key={user.user_id}
              onClick={() => handleSelect(user)}
              className={styles.dropdownItem}
            >
              <div className={styles.dropdownItemName}>{user.user_login}</div>
              <div className={styles.dropdownItemRoles}>
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
      
      {isOpen && filtered.length === 0 && search.trim() && (
        <div className={styles.emptyResult}>
          Пользователи не найдены
        </div>
      )}
    </div>
  );
};

// Компонент выбора тегов (без изменений)
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
    <div className={styles.relative} ref={ref}>
      <div className={styles.tagSelectorContainer}>
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className={styles.tag}
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => onChange(selectedTags.filter(t => t.tag_id !== tag.tag_id))}
              disabled={disabled}
              className={styles.tagRemove}
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
          className={styles.tagInput}
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {filtered.length > 0 ? (
            filtered.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => handleSelect(tag)}
                className={styles.tagOption}
              >
                <span className={styles.tagColorDot} style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : search.trim() ? (
            <div
              onClick={handleCreate}
              className={styles.createTagOption}
            >
              + Создать "{search}"
            </div>
          ) : (
            <div className={styles.noTagsMessage}>Введите текст для поиска</div>
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
  
  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // Состояния для дат как объекты Date
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    all_day: false,
    priority: '0',
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

  // Инициализация дат
  useEffect(() => {
    let defaultDate: Date;
    if (initialDate) {
      defaultDate = new Date(initialDate);
      defaultDate.setHours(12, 0, 0, 0);
    } else {
      defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      defaultDate.setHours(12, 0, 0, 0);
    }
    setStartDate(defaultDate);
    setEndDate(defaultDate);
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
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(date);
    }
  };

  const handleEndDateChange = (date: Date) => {
    if (startDate && date < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(date);
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
    
    if (!formData.title.trim() || !startDate || !endDate) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (endDate < startDate) {
      setError('Дата окончания не может быть раньше даты начала');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          all_day: formData.all_day,
          priority: parseInt(formData.priority),
          assignee_ids: selectedAssignees.map(a => a.user_id),
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Создание новой задачи</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={styles.closeButton}
              aria-label="Закрыть"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Название задачи */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Название задачи *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={styles.input}
                placeholder="Введите название задачи"
              />
            </div>

            {/* Описание */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={4}
                className={styles.textarea}
                placeholder="Опишите детали задачи..."
              />
            </div>

            {/* Даты с новым DatePicker */}
            <div className={styles.datesGrid}>
              <div>
                <label className={styles.label}>Дата и время начала *</label>
                <DatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  showTimeSelect={!formData.all_day}
                />
              </div>
              <div>
                <label className={styles.label}>Дата и время окончания *</label>
                <DatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate || undefined}
                  showTimeSelect={!formData.all_day}
                />
              </div>
            </div>

            {/* Весь день */}
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="all_day"
                id="all_day"
                checked={formData.all_day}
                onChange={handleChange}
                disabled={isSubmitting}
                className={styles.checkbox}
              />
              <label htmlFor="all_day" className={styles.checkboxLabel}>
                Весь день
              </label>
            </div>

            {/* Приоритет */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Приоритет</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                className={styles.select}
              >
                <option value="0">Обычный</option>
                <option value="1">Низкий</option>
                <option value="2">Средний</option>
                <option value="3">Высокий</option>
              </select>
            </div>

            {/* Исполнители */}
            <div className={styles.fieldGroup}>
              <label className={`${styles.label} ${styles.labelWithIcon}`}>
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
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Теги</label>
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
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonCancel}`}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonSubmit}`}
            >
              {isSubmitting ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};