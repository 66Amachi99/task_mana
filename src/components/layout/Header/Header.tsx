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

export const Header: React.FC = () => {
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
                  onClick={() => setShowPostModal(true)}
                  className={styles.addButton}
                  title="Добавить пост"
                >
                  <img className={styles.addIcon} src="/icons/Plus Math.svg" alt="" />
                </button>
              )}

              {canCreateTask && (
                <button
                  onClick={() => setShowTaskModal(true)}
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

          {/* Правый пустой блок для баланса */}
          <div className={styles.rightSpacer}></div>
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