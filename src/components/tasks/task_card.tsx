'use client';

import { TaskDetailsButton } from '../ui/task_details_button';
import { Calendar, User } from 'lucide-react';
import { Task } from '../../../types/task';

interface TaskCardProps {
  task: Task;
  onTaskUpdate: () => Promise<void>;
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
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const TaskCard = ({ task, onTaskUpdate }: TaskCardProps) => {
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.task_status);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 md:p-6 border-l-4 border-blue-400">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate" title={task.title}>
              {task.title}
            </h2>
            
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColor}`}>
              {getPriorityLabel(task.priority)}
            </span>
          </div>

          <p className="text-sm md:text-base text-gray-600 mt-2 line-clamp-3" title={task.description || ''}>
            {task.description || 'Нет описания'}
          </p>

          {/* Статус и теги */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full ${statusColor}`}>
              {task.task_status}
            </span>

            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                    <span
                        key={tag.tag_id}
                        className="px-2 py-1 rounded-full text-xs font-medium"
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
          </div>
        </div>

        <div className="text-left md:text-right shrink-0 text-xs md:text-sm">
          <div className="flex items-center gap-1 text-gray-500 justify-end">
            <Calendar className="w-3 h-3" />
            <span>Начало: {formatDate(task.start_time)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 justify-end mt-1">
            <Calendar className="w-3 h-3" />
            <span>Окончание: {formatDate(task.end_time)}</span>
          </div>
        </div>
      </div>

      {/* Исполнители */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="mb-4 p-2 md:p-3 bg-gray-50 rounded border">
          <div className="flex items-center gap-2 flex-wrap">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-xs md:text-sm text-gray-600">Исполнители:</span>
            {task.assignees.map(assignee => (
              <span
                key={assignee.user_id}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                {assignee.user_login}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Кнопка подробнее */}
      <div className="mt-4 md:mt-6 pt-4 border-t flex items-center justify-end">
        <TaskDetailsButton task={task} onTaskUpdate={onTaskUpdate} />
      </div>
    </div>
  );
};