'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-roles';
import { AuthWindow } from '@/components/shared/auth-window/auth-window';
import { LogoutWindow } from '@/components/shared/logout-window/logout-window';
import { PostAddWindow } from '@/components/shared/post-add-window/post-add-window';
import { TaskAddWindow } from '@/components/shared/task-add-window/task-add-window';
import { User, Sun, Moon } from 'lucide-react';
import styles from './Header.module.css';
import { useHeader } from '@/contexts/HeaderContext';

export const Header: React.FC = () => {
  const { user, canCreateTask, isAdmin } = useUser();
  const pathname = usePathname();
  const { isPostModalOpen, isTaskModalOpen, postModalDate, taskModalDate, openPostModal, openTaskModal, closePostModal, closeTaskModal, selectedDate } = useHeader();

  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [showLogoutWindow, setShowLogoutWindow] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Загрузка и установка глобальной темы
  useEffect(() => {
    const savedTheme = (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    // Отправляем кастомное событие, чтобы JS-графики (Recharts) тоже обновились
    window.dispatchEvent(new Event('theme-change')); 
  };

  const handleAuthClick = () => {
    if (user) {
      setShowLogoutWindow(true);
    } else {
      setShowAuthWindow(true);
    }
  };

  const icons = {
    post: '/icons/post_window_icon_no_clicked.svg',
    calendar: '/icons/calendar_window_icon_no_clicked.svg',
    timeline: '/icons/timeline.svg',
    stats: '/icons/stats.svg'
  };

  const canAddPost = user && (user.admin_role || user.SMM_role);

  const getNavStyle = (path: string) => {
    return pathname === path ? { opacity: 0.4 } : {};
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          
          <div className={styles.userSection}>
            <button onClick={handleAuthClick} className={styles.userButton}>
              <User className={styles.userIcon} />
              <span className={styles.userName}>
                {user ? user.login : 'Авторизоваться'}
              </span>
            </button>
          </div>

          <div className={styles.middleGroup}>
            <div className={styles.navBlock}>
              <Link href="/dashboard" className={styles.navLink}>
                <button className={styles.navButton} style={getNavStyle('/dashboard')}>
                  <img src={icons.post} alt="Посты" className={styles.navIcon} />
                </button>
              </Link>
              <Link href="/calendar" className={styles.navLink}>
                <button className={styles.navButton} style={getNavStyle('/calendar')}>
                  <img src={icons.calendar} alt="Календарь" className={styles.navIcon} />
                </button>
              </Link>
              <Link href="/timeline" className={styles.navLink}>
                <button className={styles.navButton} style={getNavStyle('/timeline')} title="Таймлайн">
                  <img src={icons.timeline} alt="Таймлайн" className={styles.navIcon} />
                </button>
              </Link>
              <Link href="/stats" className={styles.navLink}>
                <button className={styles.navButton} style={getNavStyle('/stats')} title="Статистика">
                  <img src={icons.stats} alt="Статистика" className={styles.navIcon} />
                </button>
              </Link>
            </div>

            <div className={styles.addButtons}>
              {canAddPost && (
                <button
                  onClick={() => openPostModal(selectedDate)}
                  className={styles.addButton}
                  title="Добавить пост"
                >
                  <img className={styles.addIcon} src="/icons/Plus Math.svg" alt="" />
                </button>
              )}

              {canCreateTask && (
                <button
                  onClick={() => openTaskModal(selectedDate)}
                  className={styles.addButton}
                  title="Добавить задачу"
                >
                  <svg className={styles.addIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.rightControls}>
            {/* <button onClick={toggleTheme} className={styles.themeButton} title="Переключить тему">
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </button> */}

            {isAdmin && (
              <Link href="/admin">
                <button className={styles.adminButton} title="Админ панель">
                  <img src="/icons/admin.svg" alt="Admin" className={styles.adminIcon} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {showAuthWindow && <AuthWindow onClose={() => setShowAuthWindow(false)} />}
      {showLogoutWindow && <LogoutWindow onClose={() => setShowLogoutWindow(false)} />}
      {isPostModalOpen && <PostAddWindow onClose={closePostModal} initialDate={postModalDate} />}
      {isTaskModalOpen && <TaskAddWindow onClose={closeTaskModal} initialDate={taskModalDate} />}
    </>
  );
};