'use client';

import { useState } from 'react';
import { TaskDetailsWindow } from '../task-details-window/task-details-window';
import { Calendar, Eye, User } from 'lucide-react';
import { Task } from '../../../../types/task';
import styles from './TaskCard.module.css';
import { ActionButton } from '../../ui/action-button/action-button';

interface TaskCardProps {
  task: Task;
}

const PRIORITY_MAP: Record<number, { class: string; label: string }> = {
  1: { class: styles.priorityLow, label: 'Низкий' },
  2: { class: styles.priorityMedium, label: 'Средний' },
  3: { class: styles.priorityHigh, label: 'Высокий' },
};

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'Поставлена':
      return styles.statusAssigned;
    case 'В работе':
      return styles.statusInProgress;
    case 'Выполнена':
      return styles.statusDone;
    default:
      return styles.statusDefault;
  }
};

const formatDate = (dateString?: string, allDay?: boolean): string => {
  if (!dateString) return 'Нет даты';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Некорректная дата';
  }

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (!allDay) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('ru-RU', options);
};

export const TaskCard = ({ task }: TaskCardProps) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const firstTag = task.tags && task.tags.length > 0 ? task.tags[0] : null;
  const isCompleted = task.task_status === 'Выполнена';

  const handleOpenDetails = (taskId: number) => {
    setSelectedTaskId(taskId);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedTaskId(null);
  };

  const bgGradient = isCompleted
    ? 'linear-gradient(90deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 255, 0, 0.15) 100%)'
    : firstTag
      ? `radial-gradient(100% 100% at 50% 0%, color-mix(in srgb, ${firstTag.color}, transparent 70%) 0%, rgba(72, 200, 132, 0) 100%)`
      : undefined;

  const priorityInfo = PRIORITY_MAP[task.priority] || {
    class: styles.priorityDefault,
    label: 'Не важно',
  };

  const statusClass = getStatusClass(task.task_status);

  return (
    <div
      className={styles.card}
      style={bgGradient ? { backgroundImage: bgGradient } : undefined}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <h2 className={styles.title} title={task.title}>
              {task.title}
            </h2>

            <span className={`${styles.priorityBadge} ${priorityInfo.class}`}>
              {priorityInfo.label}
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
                {task.tags.map((tag) => (
                  <span
                    key={tag.tag_id}
                    className={styles.tag}
                    style={{ backgroundColor: tag.color }}
                  >
                    <span style={{ opacity: 0.4, marginRight: '4px' }}>#</span>
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
            <span>Начало: {formatDate(task.start_time, task.all_day)}</span>
          </div>
          <div className={styles.dateRow}>
            <Calendar className={styles.dateIcon} />
            <span>Конец: {formatDate(task.end_time, task.all_day)}</span>
          </div>
        </div>
      </div>

      {task.assignees && task.assignees.length > 0 && (
        <div className={styles.assigneesBlock}>
          <div className={styles.assigneesRow}>
            <User className="w-4 h-4 text-gray-500" />
            <span className={styles.assigneesLabel}>Исполнители:</span>
            {task.assignees.map((assignee) => (
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
        <ActionButton
          variant="base"
          icon={Eye}
          onClick={() => handleOpenDetails(task.task_id)}
        >
          Подробнее
        </ActionButton>
      </div>
      
      {detailsModalOpen && selectedTaskId && (
        <TaskDetailsWindow
          task={task}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};