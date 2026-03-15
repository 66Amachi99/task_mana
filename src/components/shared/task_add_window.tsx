'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-roles';
import { X } from 'lucide-react';
import { DatePicker } from '../ui/date_picker';
import { AutoResizeTextarea } from '../ui/auto_resize_textarea';
import { useCreateTask } from '@/hooks/useTasks'; // <-- импорт мутации
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
  // onTaskAdded больше не нужен, удаляем
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
  };

  const handleRemove = (userId: number) => {
    onChange(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <div className={styles.relative} ref={ref}>
      <div className={styles.tagSelectorContainer}>
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
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Поиск исполнителей..."
          disabled={disabled}
          className={styles.tagInput}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className={`${styles.dropdown} no-scrollbar`}>
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
        <div className={`${styles.dropdown} no-scrollbar`}>
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
            <div onClick={handleCreate} className={styles.createTagOption}>
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

export const TaskAddWindow = ({ onClose, initialDate }: TaskAddWindowProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);

  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    all_day: false,
    priority: '0', // Обычный по умолчанию
  });

  const createTask = useCreateTask(); // мутация

  // Массив настроек приоритета для рендера кнопок
  const priorityOptions = [
    { id: '0', label: 'Обычный', color: 'rgba(255, 255, 255, 0.4)' },
    { id: '1', label: 'Низкий', color: '#4ade80' },
    { id: '2', label: 'Средний', color: '#fbbf24' },
    { id: '3', label: 'Высокий', color: '#f87171' }
  ];

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setTags(data);
      } catch (error) { console.error('Ошибка загрузки тегов:', error); }
    };
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) { console.error('Ошибка загрузки пользователей:', error); }
      finally { setLoadingUsers(false); }
    };
    fetchTags();
    fetchUsers();
  }, []);

  useEffect(() => {
    let defaultDate = initialDate ? new Date(initialDate) : new Date();
    if (!initialDate) defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(12, 0, 0, 0);
    setStartDate(defaultDate);
    setEndDate(defaultDate);

    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [initialDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    if (endDate && date > endDate) setEndDate(date);
  };

  const handleEndDateChange = (date: Date) => {
    if (startDate && date < startDate) setEndDate(startDate);
    else setEndDate(date);
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
    } catch (error) { console.error('Ошибка создания тега:', error); }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !startDate || !endDate) {
      setError('Заполните обязательные поля');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        all_day: formData.all_day,
        priority: parseInt(formData.priority),
        assignee_ids: selectedAssignees.map(a => a.user_id),
        tag_ids: selectedTags.map(t => t.tag_id),
      });
      // После успешного создания просто закрываем окно
      onClose();
    } catch (error: any) {
      setError(error.message || 'Ошибка при создании задачи');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContainer} no-scrollbar`} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.header}>
            <h2 className={styles.headerTitle}>Новая задача</h2>
            <button type="button" onClick={onClose} className={styles.closeButton}>
              <X size={24} />
            </button>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="Что нужно сделать?"
            required
          />  

          <div className={styles.fieldGroup}>
            <TagSelector selectedTags={selectedTags} availableTags={tags} onChange={setSelectedTags} onCreate={handleCreateTag} disabled={isSubmitting} />
          </div>

          <AutoResizeTextarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Описание..."
            disabled={isSubmitting}
            className={styles.autoTextarea}
          />

          <div>
            <div className={styles.datesGrid}>
              <div>
                <DatePicker value={startDate} onChange={handleStartDateChange} showTimeSelect={!formData.all_day} />
              </div>
              <div>
                <DatePicker value={endDate} onChange={handleEndDateChange} minDate={startDate || undefined} showTimeSelect={!formData.all_day} />
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input type="checkbox" name="all_day" id="all_day" checked={formData.all_day} onChange={handleChange} className={styles.checkbox} />
              <label htmlFor="all_day" className={styles.checkboxLabel}>Весь день</label>
            </div>
          </div>

          {/* Приоритет в виде кнопок */}
          <div className={styles.fieldGroup}>
            <div className={styles.priorityContainer}>
              {priorityOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: opt.id }))}
                  className={`${styles.priorityButton} ${formData.priority === opt.id ? styles.priorityActive : ''}`}
                  style={{ '--accent-color': opt.color } as React.CSSProperties}
                >
                  <span className={styles.priorityDot} style={{ backgroundColor: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <AssigneesSelector selectedUsers={selectedAssignees} users={users} onChange={setSelectedAssignees} disabled={isSubmitting || loadingUsers} />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.buttonCancel}`}>Отмена</button>
            <button type="submit" disabled={isSubmitting} className={`${styles.button} ${styles.buttonSubmit}`}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};