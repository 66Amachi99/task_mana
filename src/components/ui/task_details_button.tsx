'use client';

import { useState } from 'react';
import { TaskDetailsWindow } from '../shared/task_details_window';
import { Eye } from 'lucide-react';
import { Task } from '../../../types/task';

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
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
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