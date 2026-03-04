'use client';

import { useState, useCallback } from 'react';
import { PlusCircle, ListTodo } from 'lucide-react';
import { PostAddWindow } from './post_add_window';
import { TaskAddWindow } from './task_add_window';
import { useUser } from '@/hooks/use-roles';

interface CalendarAddButtonProps {
  selectedDate: Date;
}

export const CalendarAddButton = ({ selectedDate }: CalendarAddButtonProps) => {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { user, canCreateTask } = useUser();
  
  const canAddPost = user && (user.admin_role || user.SMM_role);
  
  const handlePostAdded = useCallback(async () => {
    setIsPostModalOpen(false);
    window.dispatchEvent(new CustomEvent('contentUpdated'));
  }, []);

  const handleTaskAdded = useCallback(async () => {
    setIsTaskModalOpen(false);
    window.dispatchEvent(new CustomEvent('contentUpdated'));
  }, []);

  const handleClosePost = useCallback(() => {
    setIsPostModalOpen(false);
  }, []);

  const handleCloseTask = useCallback(() => {
    setIsTaskModalOpen(false);
  }, []);
  
  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {canAddPost && (
          <button 
            onClick={() => setIsPostModalOpen(true)}
            className="rounded-full shadow-xl cursor-pointer hover:text-blue-600 hover:scale-110 transition-all w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border border-gray-200 hover:border-blue-300"
            aria-label="Добавить пост"
          >
            <PlusCircle size={32} className="text-gray-700 md:w-12 md:h-12" />
          </button>
        )}
        
        {canCreateTask && (
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="rounded-full shadow-xl cursor-pointer hover:text-purple-600 hover:scale-110 transition-all w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border border-gray-200 hover:border-purple-300"
            aria-label="Добавить задачу"
          >
            <ListTodo size={32} className="text-gray-700 md:w-12 md:h-12" />
          </button>
        )}
      </div>

      {isPostModalOpen && (
        <PostAddWindow 
          onClose={handleClosePost}
          onPostAdded={handlePostAdded}
          initialDate={selectedDate}
        />
      )}

      {isTaskModalOpen && (
        <TaskAddWindow 
          onClose={handleCloseTask}
          onTaskAdded={handleTaskAdded}
          initialDate={selectedDate}
        />
      )}
    </>
  );
};