'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Calendar, User, Edit, Trash2, ExternalLink, CheckCircle, Save } from 'lucide-react';
import { useUser } from '@/hooks/use-roles';
import { Task } from '../../../types/task';

interface TaskDetailsWindowProps {
  onClose: () => void;
  task: Task | null;
  onSuccess: () => Promise<void>;
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

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return 'text-blue-600 bg-blue-50';
    case 2: return 'text-yellow-600 bg-yellow-50';
    case 3: return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case 1: return 'Низкий';
    case 2: return 'Средний';
    case 3: return 'Высокий';
    default: return 'Обычный';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Поставлена': return 'bg-yellow-100 text-yellow-800';
    case 'В работе': return 'bg-blue-100 text-blue-800';
    case 'Выполнена': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DatePicker = ({ 
  value, 
  onChange 
}: { 
  value: Date; 
  onChange: (date: Date) => void;
}) => {
  return (
    <div className="absolute z-50 mt-2 p-4 bg-white border rounded-lg shadow-xl">
      <input
        type="datetime-local"
        value={formatDateForInput(value)}
        onChange={e => onChange(new Date(e.target.value))}
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
};

const TagSelector = ({
  selectedTags,
  onTagSelect,
  onTagRemove,
  onSearchChange,
  searchQuery,
  onCreateTag,
  filteredTags,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  disabled,
}: {
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagRemove: (tagId: number) => void;
  onSearchChange: (value: string) => void;
  searchQuery: string;
  onCreateTag: () => void;
  filteredTags: Tag[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 mb-2 min-h-10 p-2 border rounded-lg bg-white">
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              backgroundColor: tag.color,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {tag.name}
            <button type="button" onClick={() => onTagRemove(tag.tag_id)} className="hover:opacity-80 ml-1" disabled={disabled}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            onSearchChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 120);
          }}
          placeholder="Поиск тегов..."
          disabled={disabled}
          className="flex-1 min-w-30 outline-none text-sm"
        />
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => onTagSelect(tag)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div onClick={onCreateTag} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600">
              + Создать "{searchQuery}"
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500">Введите текст для поиска</div>
          )}
        </div>
      )}
    </div>
  );
};

const UserSelector = ({
  selectedUser,
  onUserSelect,
  onUserClear,
  searchQuery,
  onSearchChange,
  users,
  showDropdown,
  setShowDropdown,
  dropdownRef,
  disabled,
}: {
  selectedUser: UserType | null;
  onUserSelect: (user: UserType) => void;
  onUserClear: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  users: UserType[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
}) => {
  const filteredUsers = users.filter(user =>
    user.user_login.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedUser || user.user_id !== selectedUser.user_id)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedUser && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {selectedUser.user_login}
            <button
              type="button"
              onClick={onUserClear}
              className="hover:opacity-70"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 120);
        }}
        placeholder="Поиск исполнителя..."
        disabled={disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
      />
      {showDropdown && filteredUsers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.user_id}
              onClick={() => onUserSelect(user)}
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
  );
};

export const TaskDetailsWindow = ({ onClose, task, onSuccess }: TaskDetailsWindowProps) => {
  const { user } = useUser();
  
  // Состояния для данных
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  
  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false);
  
  // Редактируемые поля
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStartTime, setEditedStartTime] = useState('');
  const [editedEndTime, setEditedEndTime] = useState('');
  const [editedAllDay, setEditedAllDay] = useState(false);
  const [editedPriority, setEditedPriority] = useState('0');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedCompletedLink, setEditedCompletedLink] = useState('');
  const [originalCompletedLink, setOriginalCompletedLink] = useState('');
  
  // Исполнитель
  const [selectedAssignee, setSelectedAssignee] = useState<UserType | null>(null);
  const [originalAssignee, setOriginalAssignee] = useState<UserType | null>(null);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Теги
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [originalTags, setOriginalTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  
  // Датапикеры
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const startDatePickerRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<HTMLDivElement>(null);
  
  // Пользователи для выбора исполнителя
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Состояния загрузки
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);

  const canEdit = true; // Все могут редактировать
  const canDelete = user?.admin_role || task?.created_by_id === user?.id; // Админ или создатель

  // Блокировка прокрутки background
  useEffect(() => {
    if (!task) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [task]);

  // Закрытие дропдаунов по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setShowAssigneeDropdown(false);
      }
      if (startDatePickerRef.current && !startDatePickerRef.current.contains(event.target as Node)) {
        setShowStartDatePicker(false);
      }
      if (endDatePickerRef.current && !endDatePickerRef.current.contains(event.target as Node)) {
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Загрузка тегов
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setAvailableTags(data);
      } catch (error) {
        console.error('Ошибка загрузки тегов:', error);
      }
    };
    fetchTags();
  }, []);

  // Инициализация данных
  useEffect(() => {
    if (!task) return;

    setOriginalTask(task);

    const startDate = new Date(task.start_time);
    const endDate = new Date(task.end_time);

    setEditedTitle(task.title || '');
    setEditedDescription(task.description || '');
    setEditedStartTime(formatDateForInput(startDate));
    setEditedEndTime(formatDateForInput(endDate));
    setEditedAllDay(task.all_day || false);
    setEditedPriority(task.priority.toString());
    setEditedStatus(task.task_status || 'Поставлена');
    setEditedCompletedLink(task.completed_task || '');
    setOriginalCompletedLink(task.completed_task || '');

    // Исполнитель
    if (task.assignees && task.assignees.length > 0 && users.length > 0) {
      const assigneeUser = users.find(u => u.user_id === task.assignees[0].user_id);
      if (assigneeUser) {
        setSelectedAssignee(assigneeUser);
        setOriginalAssignee(assigneeUser);
        setAssigneeSearchQuery(assigneeUser.user_login);
      }
    }

    // Теги
    setSelectedTags(task.tags || []);
    setOriginalTags(task.tags || []);
  }, [task, users]);

  // Фильтрация тегов
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.find(t => t.tag_id === tag.tag_id)
  );

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.find(t => t.tag_id === tag.tag_id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchQuery('');
    setShowTagDropdown(false);
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
        setAvailableTags([...availableTags, newTag]);
        setSelectedTags([...selectedTags, newTag]);
        setTagSearchQuery('');
        setShowTagDropdown(false);
      }
    } catch (error) {
      console.error('Ошибка создания тега:', error);
    }
  };

  const handleAssigneeSelect = (user: UserType) => {
    setSelectedAssignee(user);
    setAssigneeSearchQuery(user.user_login);
    setShowAssigneeDropdown(false);
  };

  const handleAssigneeClear = () => {
    setSelectedAssignee(null);
    setAssigneeSearchQuery('');
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    if (task) {
      setEditedTitle(task.title || '');
      setEditedDescription(task.description || '');
      
      const startDate = new Date(task.start_time);
      const endDate = new Date(task.end_time);
      setEditedStartTime(formatDateForInput(startDate));
      setEditedEndTime(formatDateForInput(endDate));
      
      setEditedAllDay(task.all_day || false);
      setEditedPriority(task.priority.toString());
      setEditedStatus(task.task_status || 'Поставлена');
      setEditedCompletedLink(task.completed_task || '');
      
      if (task.assignees && task.assignees.length > 0 && users.length > 0) {
        const assigneeUser = users.find(u => u.user_id === task.assignees[0].user_id);
        if (assigneeUser) {
          setSelectedAssignee(assigneeUser);
          setAssigneeSearchQuery(assigneeUser.user_login);
        }
      } else {
        setSelectedAssignee(null);
        setAssigneeSearchQuery('');
      }
      
      setSelectedTags(task.tags || []);
    }
  };

  // Сохранение всех изменений задачи
  const handleSaveTask = async () => {
    if (!task) return;

    if (!editedTitle.trim() || !editedStartTime || !editedEndTime) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.task_id,
          data: {
            title: editedTitle,
            description: editedDescription || null,
            start_time: new Date(editedStartTime).toISOString(),
            end_time: new Date(editedEndTime).toISOString(),
            all_day: editedAllDay,
            priority: parseInt(editedPriority),
            task_status: editedStatus,
            assignee_id: selectedAssignee?.user_id || null,
            tag_ids: selectedTags.map(t => t.tag_id),
            completed_task: editedCompletedLink.trim() || null,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при обновлении задачи');
      }

      await onSuccess();
      setIsEditing(false);
      
      // Обновляем оригинальные значения
      setOriginalAssignee(selectedAssignee);
      setOriginalTags(selectedTags);
      setOriginalCompletedLink(editedCompletedLink);
      
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
      alert(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    const isConfirmed = window.confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.');
    if (!isConfirmed) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/tasks/delete?id=${task.task_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Ошибка при удалении задачи:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditTask = () => {
    setIsClosingDetails(true);
    setTimeout(() => setShowEditModal(true), 100);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setTimeout(() => onClose(), 100);
  };

  const handleSuccessEdit = async () => {
    await onSuccess();
    setShowEditModal(false);
    onClose();
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    
    try {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!task) return null;

  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.task_status);
  const hasCompletedLink = task.completed_task && task.completed_task.trim() !== '';

  // Проверка наличия изменений
  const hasChanges = 
    editedTitle !== task.title ||
    editedDescription !== (task.description || '') ||
    editedStartTime !== formatDateForInput(new Date(task.start_time)) ||
    editedEndTime !== formatDateForInput(new Date(task.end_time)) ||
    editedAllDay !== task.all_day ||
    editedPriority !== task.priority.toString() ||
    editedStatus !== task.task_status ||
    editedCompletedLink !== (task.completed_task || '') ||
    selectedAssignee?.user_id !== originalAssignee?.user_id ||
    JSON.stringify(selectedTags.map(t => t.tag_id).sort()) !== JSON.stringify(originalTags.map(t => t.tag_id).sort());

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex justify-between items-start px-6 py-4 border-b shrink-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold text-gray-800 border-2 border-blue-300 rounded-lg px-3 py-2 w-full mr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Название задачи"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-800 truncate pr-2" title={task.title}>
                  {task.title}
                </h2>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0">
                <X size={24} />
              </button>
            </div>

            {/* Основной контент */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Статус и приоритет */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Поставлена">Поставлена</option>
                        <option value="В работе">В работе</option>
                        <option value="Выполнена">Выполнена</option>
                      </select>
                      <select
                        value={editedPriority}
                        onChange={(e) => setEditedPriority(e.target.value)}
                        className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="0">Обычный</option>
                        <option value="1">Низкий</option>
                        <option value="2">Средний</option>
                        <option value="3">Высокий</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                        {task.task_status}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityColor}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </>
                  )}
                </div>

                {/* Теги */}
                {isEditing ? (
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagSelect={handleTagSelect}
                    onTagRemove={handleTagRemove}
                    onSearchChange={setTagSearchQuery}
                    searchQuery={tagSearchQuery}
                    onCreateTag={handleCreateTag}
                    filteredTags={filteredTags}
                    showDropdown={showTagDropdown}
                    setShowDropdown={setShowTagDropdown}
                    dropdownRef={tagDropdownRef}
                    disabled={isSaving}
                  />
                ) : (
                  task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map(tag => (
                        <span
                          key={tag.tag_id}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: tag.color,
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )
                )}

                {/* Описание */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
                  {isEditing ? (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Описание задачи..."
                    />
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto p-4">
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {task.description || 'Нет описания'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Время */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Начало</h4>
                    <div className="relative" ref={startDatePickerRef}>
                      {isEditing ? (
                        <button
                          onClick={() => setShowStartDatePicker(!showStartDatePicker)}
                          className="w-full text-left p-3 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <span className="text-sm text-blue-600 block">Начало</span>
                          <span className="text-sm font-medium text-blue-800">
                            {editedAllDay 
                              ? formatDateOnly(editedStartTime)
                              : formatDate(editedStartTime)}
                          </span>
                        </button>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {task.all_day ? formatDateOnly(task.start_time) : formatDate(task.start_time)}
                            </span>
                          </div>
                        </div>
                      )}
                      {showStartDatePicker && isEditing && (
                        <DatePicker
                          value={new Date(editedStartTime)}
                          onChange={(date) => {
                            setEditedStartTime(formatDateForInput(date));
                            setShowStartDatePicker(false);
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Окончание</h4>
                    <div className="relative" ref={endDatePickerRef}>
                      {isEditing ? (
                        <button
                          onClick={() => setShowEndDatePicker(!showEndDatePicker)}
                          className="w-full text-left p-3 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <span className="text-sm text-blue-600 block">Окончание</span>
                          <span className="text-sm font-medium text-blue-800">
                            {editedAllDay 
                              ? formatDateOnly(editedEndTime)
                              : formatDate(editedEndTime)}
                          </span>
                        </button>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {task.all_day ? formatDateOnly(task.end_time) : formatDate(task.end_time)}
                            </span>
                          </div>
                        </div>
                      )}
                      {showEndDatePicker && isEditing && (
                        <DatePicker
                          value={new Date(editedEndTime)}
                          onChange={(date) => {
                            setEditedEndTime(formatDateForInput(date));
                            setShowEndDatePicker(false);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Весь день */}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit_all_day"
                      checked={editedAllDay}
                      onChange={(e) => setEditedAllDay(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="edit_all_day" className="text-sm text-gray-700">
                      Весь день
                    </label>
                  </div>
                )}

                {/* Исполнитель */}
                {isEditing ? (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Исполнитель</h4>
                    <UserSelector
                      selectedUser={selectedAssignee}
                      onUserSelect={handleAssigneeSelect}
                      onUserClear={handleAssigneeClear}
                      searchQuery={assigneeSearchQuery}
                      onSearchChange={setAssigneeSearchQuery}
                      users={users}
                      showDropdown={showAssigneeDropdown}
                      setShowDropdown={setShowAssigneeDropdown}
                      dropdownRef={assigneeDropdownRef}
                      disabled={isSaving || loadingUsers}
                    />
                  </div>
                ) : (
                  task.assignees && task.assignees.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Исполнители</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.assignees.map(assignee => (
                          <div
                            key={assignee.user_id}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100"
                          >
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700">{assignee.user_login}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* Создатель */}
                {task.created_by && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Создатель</h4>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-sm font-medium">{task.created_by.user_login}</span>
                    </div>
                  </div>
                )}

                {/* Ссылка на выполненную задачу */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Результат выполнения</h4>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedCompletedLink}
                      onChange={(e) => setEditedCompletedLink(e.target.value)}
                      placeholder="Вставьте ссылку на готовую задачу..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSaving}
                    />
                  ) : hasCompletedLink ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-700 truncate" title={task.completed_task || ''}>
                          {task.completed_task}
                        </p>
                      </div>
                      <button
                        onClick={e => handleLinkClick(task.completed_task || '', e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm font-medium shrink-0 ml-2"
                        title="Открыть ссылку"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Открыть
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Ссылка не добавлена</p>
                  )}
                </div>
              </div>
            </div>

            {/* Нижняя панель с кнопками */}
            <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={handleEditStart}
                      disabled={isActionLoading}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                      Изменить
                    </button>

                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        disabled={isActionLoading}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    )}
                  </>
                )}

                {isEditing && (
                  <>
                    <button
                      onClick={handleSaveTask}
                      disabled={isSaving || !hasChanges}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
                        ${hasChanges 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
                        transition-colors disabled:opacity-50
                      `}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Отмена
                    </button>
                  </>
                )}
              </div>

              {/* Индикатор наличия изменений */}
              {isEditing && hasChanges && (
                <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                  Есть несохраненные изменения
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};