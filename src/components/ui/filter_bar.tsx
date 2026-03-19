'use client';

import { useRef, useState } from 'react';
import { ROLE_FILTERS } from '@/hooks/use-roles';
import styles from '../styles/FilterBar.module.css';

type ViewMode = 'all' | 'posts' | 'tasks';

interface FilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  roleFilter: string | null;
  onRoleFilterChange: (role: string | null) => void;
  postsCount?: number;
  tasksCount?: number;
  showCounts?: boolean;
}

export const FilterBar = ({
  viewMode,
  onViewModeChange,
  roleFilter,
  onRoleFilterChange,
  postsCount,
  tasksCount,
  showCounts = false,
}: FilterBarProps) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  const handleRoleSelect = (roleId: string | null) => {
    onRoleFilterChange(roleId);
    setIsRoleDropdownOpen(false);
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterButtons}>
        <button
          onClick={() => onViewModeChange('all')}
          className={`${styles.filterButton} ${viewMode === 'all' ? styles.active : ''}`}
        >
          Все
          {showCounts && postsCount !== undefined && tasksCount !== undefined && (
            <span className={styles.count}>{postsCount + tasksCount}</span>
          )}
        </button>
        <button
          onClick={() => onViewModeChange('posts')}
          className={`${styles.filterButton} ${viewMode === 'posts' ? styles.active : ''}`}
        >
          Посты
          {showCounts && postsCount !== undefined && (
            <span className={styles.count}>{postsCount}</span>
          )}
        </button>
        <button
          onClick={() => onViewModeChange('tasks')}
          className={`${styles.filterButton} ${viewMode === 'tasks' ? styles.active : ''}`}
        >
          Задачи
          {showCounts && tasksCount !== undefined && (
            <span className={styles.count}>{tasksCount}</span>
          )}
        </button>
      </div>

      <div className={styles.roleDropdown} ref={roleDropdownRef}>
        <button
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className={styles.roleDropdownButton}
        >
          <img
            src={isRoleDropdownOpen ? '/icons/filter_on.svg' : '/icons/filter.svg'}
            alt="filter"
            className={styles.filterIcon}
          />
        </button>
        {isRoleDropdownOpen && (
          <div className={styles.roleDropdownMenu}>
            <button
              onClick={() => handleRoleSelect(null)}
              className={`${styles.roleMenuItem} ${!roleFilter ? styles.active : ''}`}
            >
              Все посты
            </button>
            <div className={styles.menuDivider}></div>
            {ROLE_FILTERS.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`${styles.roleMenuItem} ${roleFilter === role.id ? styles.active : ''}`}
              >
                <span className={styles.roleIcon}>
                  {role.id === 'smm' && '📹'}
                  {role.id === 'photographer' && '📷'}
                  {role.id === 'designer' && '✏️'}
                </span>
                {role.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};