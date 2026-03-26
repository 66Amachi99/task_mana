'use client';
import styles from './TaskSelector.module.css';
import clsx from 'clsx';

interface TaskSelectorProps {
  tasks: {
    id: number;
    label: string;
    isSelected: boolean;
  }[];
  onToggle: (taskId: number) => void;
  disabled?: boolean;
}

export const TaskSelector = ({ tasks, onToggle, disabled }: TaskSelectorProps) => {
  return (
    <div className={styles.container}>
      {tasks.map(task => (
        <button
          key={task.id}
          onClick={() => onToggle(task.id)}
          disabled={disabled}
          className={clsx(
            styles.button,
            task.isSelected ? styles.buttonSelected : styles.buttonUnselected,
            disabled ? styles.disabled : styles.enabled
          )}
        >
          {task.label}
        </button>
      ))}
    </div>
  );
};