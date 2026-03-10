'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { AuthWindow } from '@/components/shared/auth_window';
import { LogoutWindow } from '@/components/shared/logout_window';
import { PostAddWindow } from '@/components/shared/post_add_window';
import { TaskAddWindow } from '@/components/shared/task_add_window';
import { User, ChevronDown } from 'lucide-react';
import { ROLE_FILTERS } from '@/hooks/use-roles';

interface HeaderProps {
  selectedTaskFilter: string | null;
  onTaskFilterChange: (filter: string | null) => void;
  viewMode?: 'all' | 'posts' | 'tasks';
  onViewModeChange?: (mode: 'all' | 'posts' | 'tasks') => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedTaskFilter,
  onTaskFilterChange,
  viewMode = 'all',
  onViewModeChange,
}) => {
  const { user, canCreateTask } = useUser();
  const pathname = usePathname();

  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [showLogoutWindow, setShowLogoutWindow] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isViewModeDropdownOpen, setIsViewModeDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const viewModeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (viewModeDropdownRef.current && !viewModeDropdownRef.current.contains(event.target as Node)) {
        setIsViewModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const showRoleFilter = viewMode !== 'tasks';

  const selectedFilterLabel = selectedTaskFilter 
    ? ROLE_FILTERS.find(f => f.id === selectedTaskFilter)?.label 
    : null;

  return (
    <>
      <header className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Левая часть: пользователь (одиночная кнопка) */}
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

          {/* Центр: навигация и добавление (группа кнопок) */}
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

          {/* Правая часть: фильтры (группа кнопок) */}
          <div className="bg-gray-400 rounded-full h-12 flex items-center gap-2">
            {onViewModeChange && (
              <div className="relative h-full">
                <button
                  onClick={() => setIsViewModeDropdownOpen(!isViewModeDropdownOpen)}
                  className="h-full px-3 rounded-full hover:bg-gray-200 transition-colors text-base flex items-center gap-2"
                >
                  <span>
                    {viewMode === 'all' && 'Все'}
                    {viewMode === 'posts' && 'Только посты'}
                    {viewMode === 'tasks' && 'Только задачи'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isViewModeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isViewModeDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => { onViewModeChange('all'); setIsViewModeDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 text-base ${viewMode === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => { onViewModeChange('posts'); setIsViewModeDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 text-base ${viewMode === 'posts' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                    >
                      Только посты
                    </button>
                    <button
                      onClick={() => { onViewModeChange('tasks'); setIsViewModeDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 text-base ${viewMode === 'tasks' ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                    >
                      Только задачи
                    </button>
                  </div>
                )}
              </div>
            )}

            {showRoleFilter && (
              <div className="relative h-full">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="h-full px-3 rounded-full hover:bg-gray-200 transition-colors text-base flex items-center gap-2"
                >
                  <span className="max-w-40 truncate">
                    {selectedFilterLabel ? `Роль: ${selectedFilterLabel}` : 'Все посты'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => { onTaskFilterChange(null); setIsRoleDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 text-base ${!selectedTaskFilter ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                    >
                      Все посты
                    </button>
                    <div className="h-px bg-gray-200 my-2"></div>
                    {ROLE_FILTERS.map((role, index) => (
                      <div key={role.id}>
                        <button
                          onClick={() => { onTaskFilterChange(role.id); setIsRoleDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${selectedTaskFilter === role.id ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-lg">
                              {role.id === 'smm' && '📹'}
                              {role.id === 'photographer' && '📷'}
                              {role.id === 'designer' && '✏️'}
                            </span>
                            <span className="text-base font-medium">{role.label}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 ml-8">
                            {role.tasks.map(t => t.label).join(' • ')}
                          </div>
                        </button>
                        {index < ROLE_FILTERS.length - 1 && <div className="h-px bg-gray-100 my-1"></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Модальные окна */}
      {showAuthWindow && (
        <AuthWindow onClose={() => setShowAuthWindow(false)} onSuccess={() => setShowAuthWindow(false)} />
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