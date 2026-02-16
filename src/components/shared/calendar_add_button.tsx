'use client';

import { useState, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import { PostAddWindow } from './post_add_window';
import { useUser } from '@/hooks/use-roles';

interface CalendarAddButtonProps {
  selectedDate: Date;
}

export const CalendarAddButton = ({ selectedDate }: CalendarAddButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAdminOrCoordinatorOrSmm } = useUser();
  
  const canAddPost = user && isAdminOrCoordinatorOrSmm;
  
  const handlePostAdded = useCallback(async () => {
    setIsModalOpen(false);
    window.dispatchEvent(new CustomEvent('postUpdated'));
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (!canAddPost) return null;
  
  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-xl cursor-pointer hover:text-blue-600 hover:scale-110 transition-all w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white border border-gray-200 hover:border-blue-300"
        aria-label="Добавить пост"
      >
        <PlusCircle size={32} className="text-gray-700 md:w-12 md:h-12" />
      </button>

      {isModalOpen && (
        <PostAddWindow 
          onClose={handleClose}
          onPostAdded={handlePostAdded}
          initialDate={selectedDate}
        />
      )}
    </>
  );
};