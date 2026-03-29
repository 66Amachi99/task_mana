'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderContextType {
  openPostModal: (initialDate?: Date) => void;
  openTaskModal: (initialDate?: Date) => void;
  closePostModal: () => void;
  closeTaskModal: () => void;
  postModalDate: Date | undefined;
  taskModalDate: Date | undefined;
  isPostModalOpen: boolean;
  isTaskModalOpen: boolean;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [postModalDate, setPostModalDate] = useState<Date | undefined>();
  const [taskModalDate, setTaskModalDate] = useState<Date | undefined>();

  const openPostModal = useCallback((initialDate?: Date) => {
    setPostModalDate(initialDate);
    setIsPostModalOpen(true);
  }, []);

  const openTaskModal = useCallback((initialDate?: Date) => {
    setTaskModalDate(initialDate);
    setIsTaskModalOpen(true);
  }, []);

  const closePostModal = useCallback(() => {
    setIsPostModalOpen(false);
    setPostModalDate(undefined);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setTaskModalDate(undefined);
  }, []);

  return (
    <HeaderContext.Provider
      value={{
        openPostModal,
        openTaskModal,
        closePostModal,
        closeTaskModal,
        postModalDate,
        taskModalDate,
        isPostModalOpen,
        isTaskModalOpen,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
