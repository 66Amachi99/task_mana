'use client';

import { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ROLE_FILTERS } from '@/hooks/use-roles';
import styles from './RoleDropdown.module.css';

interface RoleDropdownProps {
  roleFilter: string | null;
  onRoleSelect: (role: string | null) => void;
}

export const RoleDropdown = ({ roleFilter, onRoleSelect }: RoleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (role: string | null) => {
    onRoleSelect(role);
    setIsOpen(false);
  };

  return (
    <div className={styles.roleDropdown} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.roleDropdownButton}
      >
        <img
          src={isOpen ? '/icons/filter_on.svg' : '/icons/filter.svg'}
          alt="filter"
          className={styles.filterIcon}
        />
      </button>

      {isOpen && (
        <div className={styles.roleDropdownMenu}>
          <button
            onClick={() => handleSelect(null)}
            className={`${styles.roleMenuItem} ${!roleFilter ? styles.active : ''}`}
          >
            <span>Все посты</span>
            {!roleFilter && <Check className={styles.activeIcon} size={16} />}
          </button>

          <div className={styles.menuDivider}></div>

          {ROLE_FILTERS.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id)}
              className={`${styles.roleMenuItem} ${roleFilter === role.id ? styles.active : ''}`}
            >
              <span>{role.label}</span>
              {roleFilter === role.id && <Check className={styles.activeIcon} size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
