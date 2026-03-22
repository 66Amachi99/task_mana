'use client';

import { useState } from 'react';
import { TaskDetailsWindow } from '../shared/task_details_window';
import { Eye } from 'lucide-react';
import { Task } from '../../../types/task';
import styles from '../styles/PostCard.module.css';

interface TaskDetailsButtonProps {
  task: Task;
}

export const TaskDetailsButton = ({ task }: TaskDetailsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
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
        />
      )}
    </>
  );
};