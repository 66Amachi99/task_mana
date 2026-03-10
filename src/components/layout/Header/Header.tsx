'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { AuthWindow } from '@/components/shared/auth_window';
import { LogoutWindow } from '@/components/shared/logout_window';
import { PostAddWindow } from '@/components/shared/post_add_window';
import { TaskAddWindow } from '@/components/shared/task_add_window';
import { User } from 'lucide-react';

interface HeaderProps {
  // Фильтры больше не нужны
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, canCreateTask } = useUser();
  const pathname = usePathname();

  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [showLogoutWindow, setShowLogoutWindow] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      setShowLogoutWindow(true);
    } else {
      setShowAuthWindow(true);
    }
  };

  const handleLogoutConfirm = async () => {
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: false });
    window.location.reload();
    setShowLogoutWindow(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthWindow(false);
    window.dispatchEvent(new CustomEvent('contentUpdated'));
  };

  const handlePostAdded = async () => {
    setShowPostModal(false);
    window.dispatchEvent(new CustomEvent('contentUpdated'));
  };

  const handleTaskAdded = async () => {
    setShowTaskModal(false);
    window.dispatchEvent(new CustomEvent('contentUpdated'));
  };

  const postIcon = pathname === '/' 
    ? '/icons/post_window_icon_clicked.svg' 
    : '/icons/post_window_icon_no_clicked.svg';

  const calendarIcon = pathname === '/calendar' 
    ? '/icons/calendar_window_icon_clicked.svg' 
    : '/icons/calendar_window_icon_no_clicked.svg';

  const canAddPost = user && (user.admin_role || user.SMM_role);

  return (
    <>
      <header className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Левая часть: пользователь */}
          <div className="bg-gray-400 rounded-full">
            <button
              onClick={handleAuthClick}
              className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors w-full"
            >
              <User className="w-8 h-8 text-gray-700" />
              <span className="text-base font-medium">
                {user ? user.login : 'Авторизоваться'}
              </span>
            </button>
          </div>

          {/* Центр: навигация и добавление */}
          <div className="bg-gray-400 rounded-full px-4 h-12 flex items-center gap-4">
            <Link href="/" className="h-full">
              <button className="h-full px-2 rounded-full hover:bg-gray-200 transition-colors flex items-center">
                <img src={postIcon} alt="Посты" className="w-8 h-8" />
              </button>
            </Link>
            <Link href="/calendar" className="h-full">
              <button className="h-full px-2 rounded-full hover:bg-gray-200 transition-colors flex items-center">
                <img src={calendarIcon} alt="Календарь" className="w-8 h-8" />
              </button>
            </Link>

            {canAddPost && (
              <button
                onClick={() => setShowPostModal(true)}
                className="h-full px-2 rounded-full hover:bg-gray-200 transition-colors flex items-center"
                title="Добавить пост"
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            )}

            {canCreateTask && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="h-full px-2 rounded-full hover:bg-gray-200 transition-colors flex items-center"
                title="Добавить задачу"
              >
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            )}
          </div>

          {/* Правая часть пустая (можно оставить для баланса) */}
          <div className="w-32"></div>
        </div>
      </header>

      {/* Модальные окна */}
      {showAuthWindow && (
        <AuthWindow onClose={() => setShowAuthWindow(false)} onSuccess={handleAuthSuccess} />
      )}
      {showLogoutWindow && (
        <LogoutWindow onClose={() => setShowLogoutWindow(false)} onConfirm={handleLogoutConfirm} />
      )}
      {showPostModal && (
        <PostAddWindow onClose={() => setShowPostModal(false)} onPostAdded={handlePostAdded} />
      )}
      {showTaskModal && (
        <TaskAddWindow onClose={() => setShowTaskModal(false)} onTaskAdded={handleTaskAdded} />
      )}
    </>
  );
};