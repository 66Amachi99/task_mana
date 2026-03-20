'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { AuthWindow } from '@/components/shared/auth_window';
import { LogoutWindow } from '@/components/shared/logout_window';
import { PostAddWindow } from '@/components/shared/post_add_window';
import { TaskAddWindow } from '@/components/shared/task_add_window';
import { User } from 'lucide-react';
import styles from '../../styles/Header.module.css';

interface HeaderProps {
  onOpenPostModal?: (initialDate?: Date) => void;
  onOpenTaskModal?: (initialDate?: Date) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenPostModal, 
  onOpenTaskModal 
}) => {
  const { user, canCreateTask } = useUser();
  const pathname = usePathname();

  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [showLogoutWindow, setShowLogoutWindow] = useState(false);
  const [localShowPostModal, setLocalShowPostModal] = useState(false);
  const [localShowTaskModal, setLocalShowTaskModal] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      setShowLogoutWindow(true);
    } else {
      setShowAuthWindow(true);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutWindow(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthWindow(false);
  };

  const handlePostAdded = async () => {
    setLocalShowPostModal(false);
  };

  const handleTaskAdded = async () => {
    setLocalShowTaskModal(false);
  };

  const postIcon = pathname === '/' 
    ? '/icons/post_window_icon_clicked.svg' 
    : '/icons/post_window_icon_no_clicked.svg';

  const calendarIcon = pathname === '/calendar' 
    ? '/icons/calendar_window_icon_clicked.svg' 
    : '/icons/calendar_window_icon_no_clicked.svg';

  const canAddPost = user && (user.admin_role || user.SMM_role);

  const handlePostClick = () => {
    if (onOpenPostModal) {
      onOpenPostModal();
    } else {
      setLocalShowPostModal(true);
    }
  };

  const handleTaskClick = () => {
    if (onOpenTaskModal) {
      onOpenTaskModal();
    } else {
      setLocalShowTaskModal(true);
    }
  };

  return (
    <>
      <header className="header">
        <div className={styles.container}>
          
          {/* Левая часть: пользователь */}
          <div className={styles.userSection}>
            <button onClick={handleAuthClick} className={styles.userButton}>
              <User className={styles.userIcon} />
              <span className={styles.userName}>
                {user ? user.login : 'Авторизоваться'}
              </span>
            </button>
          </div>

          <div className={styles.middleGroup}>
            {/* Навигация */}
            <div className={styles.navBlock}>
              <Link href="/" className={styles.navLink}>
                <button className={styles.navButton}>
                  <img src={postIcon} alt="Посты" className={styles.navIcon} />
                </button>
              </Link>
              <Link href="/calendar" className={styles.navLink}>
                <button className={styles.navButton}>
                  <img src={calendarIcon} alt="Календарь" className={styles.navIcon} />
                </button>
              </Link>
            </div>

            {/* Кнопки добавления */}
            <div className={styles.addButtons}>
              {canAddPost && (
                <button
                  onClick={handlePostClick}
                  className={styles.addButton}
                  title="Добавить пост"
                >
                  <img className={styles.addIcon} src="/icons/Plus Math.svg" alt="" />
                </button>
              )}

              {canCreateTask && (
                <button
                  onClick={handleTaskClick}
                  className={styles.addButton}
                  title="Добавить задачу"
                >
                  <svg className={styles.addIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.rightSpacer}></div>
        </div>
      </header>

      {showAuthWindow && (
        <AuthWindow onClose={() => setShowAuthWindow(false)} />
      )}
      {showLogoutWindow && (
        <LogoutWindow onClose={() => setShowLogoutWindow(false)} />
      )}
      {!onOpenPostModal && localShowPostModal && (
        <PostAddWindow onClose={() => setLocalShowPostModal(false)} />
      )}
      {!onOpenTaskModal && localShowTaskModal && (
        <TaskAddWindow onClose={() => setLocalShowTaskModal(false)} />
      )}
    </>
  );
};