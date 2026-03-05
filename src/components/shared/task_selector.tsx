'use client';

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
    <div className="flex flex-wrap gap-2">
      {tasks.map(task => (
        <button
          key={task.id}
          onClick={() => onToggle(task.id)}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${task.isSelected 
              ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {task.label}
        </button>
      ))}
    </div>
  );
};