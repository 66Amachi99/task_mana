'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Calendar, User, Edit, Trash2, ExternalLink, CheckCircle, Save, Users } from 'lucide-react';
import { useUser } from '@/hooks/use-roles';
import { Task } from '../../../types/task';
import { AutoResizeTextarea } from '../ui/auto_resize_textarea';
import { DatePicker } from '../ui/date_picker';
import { useUpdateTask, usePatchTask, useDeleteTask } from '@/hooks/useTasks';
import styles from '../styles/TaskDetailsWindow.module.css';

// --- ИНТЕРФЕЙСЫ ---
interface TaskDetailsWindowProps {
  onClose: () => void;
  task: Task | null;
}

interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

interface UserType {
  user_id: number;
  user_login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
}

// Единый стейт для формы редактирования
interface FormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  priority: number;
  task_status: string;
  assignees: UserType[];
  tags: Tag[];
}

// --- КОНСТАНТЫ И УТИЛИТЫ ---
const PRIORITIES: Record<number, { label: string; className: string }> = {
  1: { label: 'Низкий', className: styles.priorityLow },
  2: { label: 'Средний', className: styles.priorityMedium },
  3: { label: 'Высокий', className: styles.priorityHigh },
};
const DEFAULT_PRIORITY = { label: 'Обычный', className: styles.priorityDefault };

const STATUS_CLASSES: Record<string, string> = {
  'Поставлена': styles.statusBadgeYellow,
  'В работе': styles.statusBadgeBlue,
  'Выполнена': styles.statusBadgeGreen,
};

const formatDisplayDate = (dateStr: string, allDay = false) => {
  const options: Intl.DateTimeFormatOptions = allDay
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleString('ru-RU', options);
};

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

// Компонент кастомного селекта
const CustomSelect = ({ value, options, onChange, disabled }: {
  value: string | number;
  options: { value: string | number; label: string; className?: string }[];
  onChange: (value: string | number) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useOutsideClick(() => setIsOpen(false));

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={styles.customSelect} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={styles.customSelectButton}
      >
        {selectedOption?.label}
        <svg className={`${styles.customSelectArrow} ${isOpen ? styles.open : ''}`} width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className={styles.customSelectDropdown}>
          {options.map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`${styles.customSelectOption} ${opt.className || ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- КОМПОНЕНТЫ-ПОМОЩНИКИ ---
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
    t.name.toLowerCase().includes(search.toLowerCase()) && !selectedTags.some(st => st.tag_id === t.tag_id)
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
    <div className={styles.tagSelector} ref={ref}>
      <div className={styles.tagSelectorInputContainer}>
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
          placeholder="Поиск тегов..."
          disabled={disabled}
          className={styles.tagSelectorInput}
        />
      </div>
      {isOpen && (
        <div className={`${styles.tagSelectorDropdown} no-scrollbar`}>
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

const AssigneesSelector = ({ selectedUsers, users, onChange, disabled }: {
  selectedUsers: UserType[];
  users: UserType[];
  onChange: (users: UserType[]) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = users.filter(u =>
    u.user_login.toLowerCase().includes(search.toLowerCase()) &&
    !selectedUsers.some(selected => selected.user_id === u.user_id)
  );

  const handleSelect = (user: UserType) => {
    onChange([...selectedUsers, user]);
    setSearch('');
  };

  const handleRemove = (userId: number) => {
    onChange(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <div className={styles.assigneesSelector} ref={ref}>
      <div className={styles.tagSelectorInputContainer}>
        {selectedUsers.map(user => (
          <span
            key={user.user_id}
            className={styles.assigneeChip}
          >
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
          className={styles.assigneeSearchInput}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className={styles.assigneeDropdown}>
          {filtered.map(user => (
            <div
              key={user.user_id}
              onClick={() => handleSelect(user)}
              className={styles.assigneeOption}
            >
              <div className={styles.assigneeName}>{user.user_login}</div>
              <div className={styles.assigneeRoles}>
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

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export const TaskDetailsWindow = ({ onClose, task }: TaskDetailsWindowProps) => {
  const { user } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState({ data: true, action: false });
  const [users, setUsers] = useState<UserType[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  const [completedTaskInput, setCompletedTaskInput] = useState('');
  const [savedCompletedTask, setSavedCompletedTask] = useState('');
  const [isSavingCompleted, setIsSavingCompleted] = useState(false);
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);

  const updateTask = useUpdateTask();
  const patchTask = usePatchTask();
  const deleteTask = useDeleteTask();

  const canDelete = user?.admin_role || task?.created_by_id === user?.id;

  useEffect(() => {
    if (!task) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/tags').then(r => r.json())
    ])
    .then(([usersData, tagsData]) => {
      setUsers(usersData);
      setAvailableTags(tagsData);
    })
    .catch(err => console.error('Ошибка загрузки данных:', err))
    .finally(() => setIsLoading(prev => ({ ...prev, data: false })));
  }, []);

  useEffect(() => {
    if (!task || isLoading.data) return;

    const assignees = task.assignees?.length 
      ? users.filter(u => task.assignees!.some(a => a.user_id === u.user_id))
      : [];
    
    setCompletedTaskInput(task.completed_task || '');
    setSavedCompletedTask(task.completed_task || '');
    
    const state: FormData = {
      title: task.title || '',
      description: task.description || '',
      start_time: task.start_time,
      end_time: task.end_time,
      all_day: task.all_day || false,
      priority: task.priority || 0,
      task_status: task.task_status || 'Поставлена',
      assignees,
      tags: task.tags || []
    };

    setFormData(state);
    setInitialData(state);
  }, [task, users, isLoading.data]);

  const handleStartDateChange = (date: Date) => {
    if (!formData) return;
    const newStart = date.toISOString();
    handleChange('start_time', newStart);
    if (new Date(formData.end_time) < date) {
      handleChange('end_time', newStart);
    }
  };

  const handleEndDateChange = (date: Date) => {
    if (!formData) return;
    const newEnd = date.toISOString();
    if (date < new Date(formData.start_time)) return;
    handleChange('end_time', newEnd);
  };

  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const hasChanges = useMemo(() => {
    if (!formData || !initialData) return false;
    
    const sortIds = (items: any[]) => items.map(i => i.user_id || i.tag_id).sort();
    
    const current = {
      ...formData,
      assignees: sortIds(formData.assignees),
      tags: sortIds(formData.tags)
    };
    const initial = {
      ...initialData,
      assignees: sortIds(initialData.assignees),
      tags: sortIds(initialData.tags)
    };
    
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [formData, initialData]);

  const handleCreateTag = async (name: string) => {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags(prev => [...prev, newTag]);
        return newTag;
      }
    } catch (err) {
      console.error('Ошибка создания тега:', err);
    }
    return null;
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    const fullUrl = url.trim().match(/^https?:\/\//) ? url.trim() : `https://${url.trim()}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveCompleted = async () => {
    if (!task) return;
    
    setIsSavingCompleted(true);
    try {
      const result = await patchTask.mutateAsync({
        taskId: task.task_id,
        completed_task: completedTaskInput.trim() || undefined,
      });
      if (result?.task) {
        const updatedTask = result.task;
        setSavedCompletedTask(updatedTask.completed_task || '');
        setCompletedTaskInput(updatedTask.completed_task || '');
        // Обновить formData, если нужно
      }
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
      alert('Не удалось сохранить результат выполнения');
    } finally {
      setIsSavingCompleted(false);
    }
  };

  const handleSave = async () => {
    if (!task || !formData) return;
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      return alert('Пожалуйста, заполните все обязательные поля');
    }

    if (new Date(formData.end_time) < new Date(formData.start_time)) {
      return alert('Дата окончания не может быть раньше даты начала');
    }

    setIsLoading(prev => ({ ...prev, action: true }));
    try {
      const result = await updateTask.mutateAsync({
        taskId: task.task_id,
        data: {
          title: formData.title,
          description: formData.description || null,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          all_day: formData.all_day,
          priority: Number(formData.priority),
          task_status: formData.task_status,
          assignee_ids: formData.assignees.map(a => a.user_id),
          tag_ids: formData.tags.map(t => t.tag_id),
        },
      });
      if (result?.task) {
        const updatedTask = result.task;
        // Обновляем локальные стейты из updatedTask
        const assignees = users.filter(u => updatedTask.assignees?.some((a: any) => a.user_id === u.user_id));
        const newFormData: FormData = {
          title: updatedTask.title,
          description: updatedTask.description || '',
          start_time: updatedTask.start_time,
          end_time: updatedTask.end_time,
          all_day: updatedTask.all_day,
          priority: updatedTask.priority,
          task_status: updatedTask.task_status,
          assignees,
          tags: updatedTask.tags || [],
        };
        setFormData(newFormData);
        setInitialData(newFormData);
        setSavedCompletedTask(updatedTask.completed_task || '');
        setCompletedTaskInput(updatedTask.completed_task || '');
        setIsEditing(false);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) return;
    
    setIsLoading(prev => ({ ...prev, action: true }));
    try {
      await deleteTask.mutateAsync(task.task_id);
      onClose(); // при удалении закрываем
    } catch (err) {
      console.error('Ошибка удаления:', err);
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  if (!task || !formData) return null;

  const hasCompletedChanges = completedTaskInput !== savedCompletedTask;
  const statusClass = STATUS_CLASSES[formData.task_status] || styles.statusBadgeGray;
  const priorityClass = PRIORITIES[formData.priority]?.className || DEFAULT_PRIORITY.className;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContainer} no-scrollbar`} onClick={e => e.stopPropagation()}>
        
        {/* ХЕДЕР */}
        <div className={styles.header}>
          {isEditing ? (
            <input
              type="text"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              className={styles.headerTitleInput}
              placeholder="Название задачи"
            />
          ) : (
            <h2 className={styles.headerTitle} title={formData.title}>
              {formData.title}
            </h2>
          )}
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className={`${styles.content} no-scrollbar`}>
          <div className={styles.contentInner}>
            
            {/* Статус и приоритет */}
            <div className={styles.statusPriority}>
              {isEditing ? (
                <>
                  <CustomSelect
                    value={formData.task_status}
                    onChange={(val) => handleChange('task_status', val as string)}
                    options={Object.keys(STATUS_CLASSES).map(s => ({ value: s, label: s }))}
                    disabled={isLoading.action}
                  />
                  <CustomSelect
                    value={formData.priority}
                    onChange={(val) => handleChange('priority', Number(val))}
                    options={[
                      { value: 0, label: 'Обычный' },
                      { value: 1, label: 'Низкий' },
                      { value: 2, label: 'Средний' },
                      { value: 3, label: 'Высокий' }
                    ]}
                    disabled={isLoading.action}
                  />
                </>
              ) : (
                <>
                  <span className={`${styles.statusBadge} ${statusClass}`}>
                    {formData.task_status}
                  </span>
                  <span className={`${styles.priorityBadge} ${priorityClass}`}>
                    {PRIORITIES[formData.priority]?.label || DEFAULT_PRIORITY.label}
                  </span>
                </>
              )}
            </div>

            {/* Теги */}
            {isEditing ? (
              <TagSelector
                selectedTags={formData.tags}
                availableTags={availableTags}
                onChange={tags => handleChange('tags', tags)}
                onCreate={handleCreateTag}
                disabled={isLoading.action}
              />
            ) : formData.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {formData.tags.map(t => (
                  <span
                    key={t.tag_id}
                    className={styles.tag}
                    style={{ backgroundColor: t.color }}
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            )}

            {/* Описание */}
            <div>
              {isEditing ? (
                <AutoResizeTextarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Описание задачи..."
                  disabled={isLoading.action}
                  className={styles.descriptionTextarea}
                />
              ) : (
                <div className={styles.descriptionBox}>
                  <div className={styles.descriptionPreview}>
                    <p className={styles.descriptionPreviewText}>
                      {formData.description || 'Нет описания'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Даты */}
            <div className={styles.datesGrid}>
              <div className={styles.dateItem}>
                {isEditing ? (
                  <DatePicker
                    value={new Date(formData.start_time)}
                    onChange={handleStartDateChange}
                    showTimeSelect={!formData.all_day}
                  />
                ) : (
                  <div className={styles.dateDisplay}>
                    <Calendar className={styles.dateIcon} />
                    <span className={styles.dateText}>
                      {formatDisplayDate(formData.start_time, formData.all_day)}
                    </span>
                  </div>
                )}
              </div>
              <div className={styles.dateItem}>
                {isEditing ? (
                  <DatePicker
                    value={new Date(formData.end_time)}
                    onChange={handleEndDateChange}
                    minDate={new Date(formData.start_time)}
                    showTimeSelect={!formData.all_day}
                  />
                ) : (
                  <div className={styles.dateDisplay}>
                    <Calendar className={styles.dateIcon} />
                    <span className={styles.dateText}>
                      {formatDisplayDate(formData.end_time, formData.all_day)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Весь день */}
            {isEditing && (
              <div className={styles.allDayCheckbox}>
                <input
                  type="checkbox"
                  id="edit_all_day"
                  checked={formData.all_day}
                  onChange={e => handleChange('all_day', e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="edit_all_day" className={styles.checkboxLabel}>
                  Весь день
                </label>
              </div>
            )}

            {/* Исполнители */}
            <div>
              <div className={styles.assigneesSectionHeader}>
                <Users className="w-4 h-4" />
                Исполнители
              </div>
              {isEditing ? (
                <AssigneesSelector
                  selectedUsers={formData.assignees}
                  users={users}
                  onChange={assignees => handleChange('assignees', assignees)}
                  disabled={isLoading.action || isLoading.data}
                />
              ) : formData.assignees.length > 0 ? (
                <div className={styles.assigneesList}>
                  {formData.assignees.map(assignee => (
                    <div key={assignee.user_id} className={styles.assigneeCard}>
                      <User className={styles.assigneeCardIcon} />
                      <span className={styles.assigneeCardName}>{assignee.user_login}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`${styles.textGray500} ${styles.italic}`}>Не назначены</p>
              )}
            </div>

            {/* Результат выполнения */}
            <div className={styles.resultSection}>
              <AutoResizeTextarea
                value={completedTaskInput}
                onChange={(e) => setCompletedTaskInput(e.target.value)}
                placeholder="Введите результат выполнения..."
                disabled={isSavingCompleted}
                className={styles.resultTextarea}
              />
              
              {hasCompletedChanges && (
                <div className={styles.saveResultButtonContainer}>
                  <button
                    onClick={handleSaveCompleted}
                    disabled={isSavingCompleted}
                    className={styles.saveResultButton}
                  >
                    <Save className="w-4 h-4" />
                    {isSavingCompleted ? 'Сохранение...' : 'Сохранить результат'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ФУТЕР */}
        <div className={styles.footer}>
          <div className={styles.actions}>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading.action}
                  className={styles.button}
                >
                  <Edit className="w-4 h-4"/> Изменить
                </button>
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isLoading.action}
                    className={`${styles.button} ${styles.buttonRed} ml-2`}
                  >
                    <Trash2 className="w-4 h-4"/> Удалить
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading.action || !hasChanges}
                  className={`${styles.button} ${hasChanges ? styles.buttonGreen : styles.buttonGray}`}
                >
                  <Save className="w-4 h-4"/>
                  {isLoading.action ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={() => { 
                    setFormData(initialData); 
                    setIsEditing(false); 
                  }}
                  disabled={isLoading.action}
                  className={`${styles.button} ${styles.buttonCancel}`}
                >
                  <X className="w-4 h-4"/> Отмена
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};