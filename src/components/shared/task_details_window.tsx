'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, User, Edit, Trash2, ExternalLink, CheckCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-roles';
import { EditTaskWindow } from './edit_task_window';
import { Task } from '../../../types/task';

interface TaskDetailsWindowProps {
  onClose: () => void;
  task: Task | null;
  onSuccess: () => Promise<void>;
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

export const TaskDetailsWindow = ({ onClose, task, onSuccess }: TaskDetailsWindowProps) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);
  const [completedLink, setCompletedLink] = useState('');
  const [originalCompletedLink, setOriginalCompletedLink] = useState('');

  const canEdit = true; // Все могут редактировать через окно редактирования
  const canDelete = user?.admin_role || task?.created_by_id === user?.id; // Админ или создатель

  useEffect(() => {
    if (task) {
      setCompletedLink(task.completed_task || '');
      setOriginalCompletedLink(task.completed_task || '');
    }
  }, [task]);

  const handleCompletedLinkChange = (value: string) => {
    setCompletedLink(value);
  };

  const handleSaveCompletedLink = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.task_id,
          completed_task: completedLink.trim() || null
        })
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Ошибка при сохранении ссылки:', error);
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
              <h2 className="text-xl font-semibold text-gray-800 truncate pr-2" title={task.title}>
                {task.title}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0">
                <X size={24} />
              </button>
            </div>

            {/* Основной контент */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Статус и приоритет */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColor}`}>
                    {task.task_status}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityColor}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>

                {/* Теги */}
                {task.tags && task.tags.length > 0 && (
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
                    )}

                {/* Описание */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Описание</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto p-4">
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {task.description || 'Нет описания'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Время */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Начало</h4>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {task.all_day ? formatDateOnly(task.start_time) : formatDate(task.start_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Окончание</h4>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {task.all_day ? formatDateOnly(task.end_time) : formatDate(task.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Исполнители */}
                {task.assignees && task.assignees.length > 0 && (
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
                {hasCompletedLink && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Результат</h4>
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
                  </div>
                )}

                {/* Поле для добавления ссылки на выполненную задачу */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Результат выполнения</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={completedLink}
                      onChange={e => handleCompletedLinkChange(e.target.value)}
                      placeholder="Вставьте ссылку на готовую задачу..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSaving || isActionLoading}
                    />
                    {completedLink !== originalCompletedLink && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveCompletedLink}
                          disabled={isSaving || isActionLoading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                        >
                          {isSaving ? 'Сохранение...' : 'Сохранить ссылку'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя панель с кнопками */}
            <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditTask}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && task && (
        <EditTaskWindow
          task={task}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccessEdit}
        />
      )}
    </>
  );
};