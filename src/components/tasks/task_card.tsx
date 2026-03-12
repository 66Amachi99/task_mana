'use client';

import { TaskDetailsButton } from '../ui/task_details_button';
import { Calendar, User } from 'lucide-react';
import { Task } from '../../../types/task';
import styles from '../styles/TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onTaskUpdate: () => Promise<void>;
}

const getPriorityClass = (priority: number): string => {
  switch (priority) {
    case 1: return styles.priorityLow;
    case 2: return styles.priorityMedium;
    case 3: return styles.priorityHigh;
    default: return styles.priorityDefault;
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

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'Поставлена': return styles.statusAssigned;
    case 'В работе': return styles.statusInProgress;
    case 'Выполнена': return styles.statusDone;
    default: return styles.statusDefault;
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
  const priorityClass = getPriorityClass(task.priority);
  const statusClass = getStatusClass(task.task_status);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h2 className={styles.title} title={task.title}>
              {task.title}
            </h2>
            
            <span className={`${styles.priorityBadge} ${priorityClass}`}>
              {getPriorityLabel(task.priority)}
            </span>
          </div>

          <p className={styles.description} title={task.description || ''}>
            {task.description || 'Нет описания'}
          </p>

          <div className={styles.statusRow}>
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {task.task_status}
            </span>

            {task.tags && task.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {task.tags.map(tag => (
                  <span
                    key={tag.tag_id}
                    className={styles.tag}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.dateColumn}>
          <div className={styles.dateRow}>
            <Calendar className={styles.dateIcon} />
            <span>Начало: {formatDate(task.start_time)}</span>
          </div>
          <div className={styles.dateRow}>
            <Calendar className={styles.dateIcon} />
            <span>Окончание: {formatDate(task.end_time)}</span>
          </div>
        </div>
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className={styles.assigneesBlock}>
          <div className={styles.assigneesRow}>
            <User className="w-4 h-4 text-gray-500" />
            <span className={styles.assigneesLabel}>Исполнители:</span>
            {task.assignees.map(assignee => (
              <span
                key={assignee.user_id}
                className={styles.assigneeChip}
              >
                {assignee.user_login}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <TaskDetailsButton task={task} onTaskUpdate={onTaskUpdate} />
      </div>
    </div>
  );
};