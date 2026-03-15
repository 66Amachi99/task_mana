'use client';

import { useState } from 'react';
import { TaskDetailsWindow } from '../shared/task_details_window';
import { Eye } from 'lucide-react';
import { Task } from '../../../types/task';
import styles from '../styles/PostList.module.css';

interface TaskDetailsButtonProps {
  task: Task;
  onTaskUpdate: () => Promise<void>;
}

export const TaskDetailsButton = ({ task, onTaskUpdate }: TaskDetailsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = async () => {
    await onTaskUpdate();
    handleClose();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={styles.Button}
      >
        <Eye className="w-4 h-4" />
        Подробнее
      </button>

      {isOpen && (
        <TaskDetailsWindow
          task={task}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};