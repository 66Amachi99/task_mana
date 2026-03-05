'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Calendar, User, Edit, Trash2, ExternalLink, CheckCircle, Save } from 'lucide-react';
import { useUser } from '@/hooks/use-roles';
import { Task } from '../../../types/task';

// --- ИНТЕРФЕЙСЫ ---
interface TaskDetailsWindowProps {
  onClose: () => void;
  task: Task | null;
  onSuccess: () => Promise<void>;
}

interface Tag { tag_id: number; name: string; color: string; }
interface UserType {
  user_id: number; user_login: string; admin_role: boolean;
  SMM_role: boolean; designer_role: boolean;
  coordinator_role: boolean; photographer_role: boolean;
}

// Единый стейт для формы редактирования
interface FormData {
  title: string; description: string; start_time: string; end_time: string;
  all_day: boolean; priority: number; task_status: string;
  completed_task: string; assignee: UserType | null; tags: Tag[];
}

// --- КОНСТАНТЫ И УТИЛИТЫ ---
const PRIORITIES: Record<number, { label: string; color: string }> = {
  1: { label: 'Низкий', color: 'text-blue-600 bg-blue-50' },
  2: { label: 'Средний', color: 'text-yellow-600 bg-yellow-50' },
  3: { label: 'Высокий', color: 'text-red-600 bg-red-50' },
};
const DEFAULT_PRIORITY = { label: 'Обычный', color: 'text-gray-600 bg-gray-50' };

const STATUS_COLORS: Record<string, string> = {
  'Поставлена': 'bg-yellow-100 text-yellow-800',
  'В работе': 'bg-blue-100 text-blue-800',
  'Выполнена': 'bg-green-100 text-green-800',
};

const formatDisplayDate = (dateStr: string, allDay = false) => {
  const options: Intl.DateTimeFormatOptions = allDay
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr).toLocaleString('ru-RU', options);
};

const formatDateForInput = (dateStr: string | Date) => {
  const d = new Date(dateStr);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
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

// --- КОМПОНЕНТЫ-ПОМОЩНИКИ ---

const TagSelector = ({ selectedTags, availableTags, onChange, onCreate, disabled }: {
  selectedTags: Tag[]; availableTags: Tag[]; onChange: (tags: Tag[]) => void;
  onCreate: (name: string) => Promise<Tag | null>; disabled: boolean;
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
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 border rounded-lg bg-white">
        {selectedTags.map(tag => (
          <span key={tag.tag_id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm" style={{ backgroundColor: tag.color }}>
            {tag.name}
            <button type="button" onClick={() => onChange(selectedTags.filter(t => t.tag_id !== tag.tag_id))} disabled={disabled} className="hover:opacity-80 ml-1">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)} placeholder="Поиск тегов..." disabled={disabled}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? filtered.map(tag => (
            <div key={tag.tag_id} onClick={() => handleSelect(tag)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />{tag.name}
            </div>
          )) : search.trim() ? (
            <div onClick={handleCreate} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600">+ Создать "{search}"</div>
          ) : <div className="px-4 py-2 text-gray-500">Введите текст для поиска</div>}
        </div>
      )}
    </div>
  );
};

const UserSelector = ({ selectedUser, users, onChange, disabled }: {
  selectedUser: UserType | null; users: UserType[]; onChange: (user: UserType | null) => void; disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = users.filter(u => 
    u.user_login.toLowerCase().includes(search.toLowerCase()) && u.user_id !== selectedUser?.user_id
  );

  return (
    <div className="relative" ref={ref}>
      {selectedUser && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {selectedUser.user_login}
            <button type="button" onClick={() => onChange(null)} disabled={disabled} className="hover:opacity-70"><X className="w-3 h-3" /></button>
          </span>
        </div>
      )}
      <input
        type="text" value={search} onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)} placeholder="Поиск исполнителя..." disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.map(user => (
            <div key={user.user_id} onClick={() => { onChange(user); setSearch(''); setIsOpen(false); }} className="px-4 py-2 cursor-pointer hover:bg-blue-50">
              <div className="font-medium">{user.user_login}</div>
              <div className="text-xs text-gray-500">
                {[user.admin_role && 'Админ', user.coordinator_role && 'Координатор', user.designer_role && 'Дизайнер', user.SMM_role && 'SMM', user.photographer_role && 'Фотограф'].filter(Boolean).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- ГЛАВНЫЙ КОМПОНЕНТ ---

export const TaskDetailsWindow = ({ onClose, task, onSuccess }: TaskDetailsWindowProps) => {
  const { user } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState({ data: true, action: false });
  const [users, setUsers] = useState<UserType[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  // Единое состояние формы
  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);

  const canDelete = user?.admin_role || task?.created_by_id === user?.id;

  // Блокировка скролла
  useEffect(() => {
    if (!task) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  // Загрузка справочников
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

  // Инициализация данных
  useEffect(() => {
    if (!task || isLoading.data) return;

    const assignee = task.assignees?.length ? users.find(u => u.user_id === task.assignees![0].user_id) || null : null;
    
    const state: FormData = {
      title: task.title || '', description: task.description || '',
      start_time: formatDateForInput(task.start_time), end_time: formatDateForInput(task.end_time),
      all_day: task.all_day || false, priority: task.priority || 0,
      task_status: task.task_status || 'Поставлена', completed_task: task.completed_task || '',
      assignee, tags: task.tags || []
    };

    setFormData(state);
    setInitialData(state);
  }, [task, users, isLoading.data]);

  const handleChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Вычисление изменений (сортируем ID тегов для корректного сравнения массивов)
  const hasChanges = useMemo(() => {
    if (!formData || !initialData) return false;
    const current = { ...formData, tags: formData.tags.map(t => t.tag_id).sort() };
    const initial = { ...initialData, tags: initialData.tags.map(t => t.tag_id).sort() };
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, [formData, initialData]);

  const handleCreateTag = async (name: string) => {
    try {
      const res = await fetch('/api/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags(prev => [...prev, newTag]);
        return newTag;
      }
    } catch (err) { console.error('Ошибка создания тега:', err); }
    return null;
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    const fullUrl = url.trim().match(/^https?:\/\//) ? url.trim() : `https://${url.trim()}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    if (!task || !formData) return;
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      return alert('Пожалуйста, заполните все обязательные поля');
    }

    setIsLoading(prev => ({ ...prev, action: true }));
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.task_id,
          data: {
            title: formData.title, description: formData.description || null,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            all_day: formData.all_day, priority: Number(formData.priority),
            task_status: formData.task_status, assignee_id: formData.assignee?.user_id || null,
            tag_ids: formData.tags.map(t => t.tag_id), completed_task: formData.completed_task.trim() || null,
          },
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Ошибка обновления');
      
      await onSuccess();
      setInitialData(formData);
      setIsEditing(false);
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
      const res = await fetch(`/api/tasks/delete?id=${task.task_id}`, { method: 'DELETE' });
      if (res.ok) {
        await onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Ошибка удаления:', err);
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  if (!task || !formData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* ХЕДЕР (Заголовок) */}
        <div className="flex justify-between items-start px-6 py-4 border-b shrink-0">
          {isEditing ? (
            <input
              type="text" value={formData.title} onChange={e => handleChange('title', e.target.value)}
              className="text-xl font-semibold text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 w-full mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Название задачи"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-800 truncate pr-2" title={formData.title}>
              {formData.title}
            </h2>
          )}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 shrink-0"><X size={24} /></button>
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ (Скроллируемый) */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            
            {/* Статус и приоритет */}
            <div className="flex items-center gap-3 flex-wrap">
              {isEditing ? (
                <>
                  <select value={formData.task_status} onChange={e => handleChange('task_status', e.target.value)} className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={formData.priority} onChange={e => handleChange('priority', e.target.value)} className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="0">Обычный</option><option value="1">Низкий</option><option value="2">Средний</option><option value="3">Высокий</option>
                  </select>
                </>
              ) : (
                <>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[formData.task_status] || 'bg-gray-100 text-gray-800'}`}>{formData.task_status}</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${(PRIORITIES[formData.priority] || DEFAULT_PRIORITY).color}`}>
                    {(PRIORITIES[formData.priority] || DEFAULT_PRIORITY).label}
                  </span>
                </>
              )}
            </div>

            {/* Теги */}
            {isEditing ? (
              <TagSelector selectedTags={formData.tags} availableTags={availableTags} onChange={tags => handleChange('tags', tags)} onCreate={handleCreateTag} disabled={isLoading.action} />
            ) : formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(t => (
                  <span key={t.tag_id} className="px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm" style={{ backgroundColor: t.color }}>{t.name}</span>
                ))}
              </div>
            )}

            {/* Описание */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
              {isEditing ? (
                <textarea value={formData.description} onChange={e => handleChange('description', e.target.value)} rows={4} className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Описание задачи..." />
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto p-4"><p className="text-sm text-gray-600 whitespace-pre-line">{formData.description || 'Нет описания'}</p></div>
                </div>
              )}
            </div>

            {/* Даты */}
            <div className="grid grid-cols-2 gap-4">
              {(['start_time', 'end_time'] as const).map(field => (
                <div key={field}>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">{field === 'start_time' ? 'Начало' : 'Окончание'}</h4>
                  {isEditing ? (
                    <input
                      type={formData.all_day ? "date" : "datetime-local"}
                      value={formData.all_day ? formData[field].split('T')[0] : formData[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      className="w-full p-3 bg-blue-50 rounded-lg border-2 border-blue-200 focus:outline-none focus:border-blue-400 focus:ring-0 text-sm font-medium text-blue-800 transition-colors"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{formatDisplayDate(formData[field], formData.all_day)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Весь день */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit_all_day" checked={formData.all_day} onChange={e => handleChange('all_day', e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <label htmlFor="edit_all_day" className="text-sm text-gray-700">Весь день</label>
              </div>
            )}

            {/* Исполнитель */}
            <div>
               <h4 className="text-xs font-medium text-gray-500 mb-2">Исполнитель</h4>
               {isEditing ? (
                  <UserSelector selectedUser={formData.assignee} users={users} onChange={u => handleChange('assignee', u)} disabled={isLoading.action || isLoading.data} />
               ) : formData.assignee ? (
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">{formData.assignee.user_login}</span>
                    </div>
                  </div>
               ) : <p className="text-sm text-gray-500">Не назначен</p>}
            </div>

            {/* Создатель (ВОССТАНОВЛЕНО) */}
            {task.created_by && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">Создатель</h4>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-sm font-medium">{task.created_by.user_login}</span>
                </div>
              </div>
            )}

            {/* Результат выполнения (ОРИГИНАЛЬНЫЙ СТИЛЬ ВОССТАНОВЛЕН) */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Результат выполнения</h4>
              {isEditing ? (
                <input
                  type="text" value={formData.completed_task} onChange={e => handleChange('completed_task', e.target.value)}
                  placeholder="Вставьте ссылку на готовую задачу..." disabled={isLoading.action}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : formData.completed_task ? (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <p className="text-sm text-green-700 truncate" title={formData.completed_task}>{formData.completed_task}</p>
                  </div>
                  <button
                    onClick={e => handleLinkClick(formData.completed_task, e)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm font-medium shrink-0 ml-2"
                    title="Открыть ссылку"
                  >
                    <ExternalLink className="w-4 h-4" /> Открыть
                  </button>
                </div>
              ) : <p className="text-sm text-gray-500 italic">Ссылка не добавлена</p>}
            </div>

          </div>
        </div>

        {/* ФУТЕР (Кнопки) */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} disabled={isLoading.action} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  <Edit className="w-4 h-4"/> Изменить
                </button>
                {canDelete && (
                  <button onClick={handleDelete} disabled={isLoading.action} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 ml-2">
                    <Trash2 className="w-4 h-4"/> Удалить
                  </button>
                )}
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={isLoading.action || !hasChanges} className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 ${hasChanges ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                  <Save className="w-4 h-4"/> {isLoading.action ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
                <button onClick={() => { setFormData(initialData); setIsEditing(false); }} disabled={isLoading.action} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  <X className="w-4 h-4"/> Отмена
                </button>
              </>
            )}
          </div>
          {isEditing && hasChanges && (
            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">Есть несохраненные изменения</span>
          )}
        </div>

      </div>
    </div>
  );
};