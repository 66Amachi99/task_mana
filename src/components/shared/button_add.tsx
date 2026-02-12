'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { PostAddWindow } from './post_add_window';

export const FloatingAddButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 active:scale-95"
        aria-label="Добавить пост"
      >
        <PlusCircle size={28} strokeWidth={2} />
      </button>

      {isModalOpen && <PostAddWindow onClose={handleCloseModal} />}
    </>
  );
};