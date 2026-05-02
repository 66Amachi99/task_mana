'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/types';
import styles from './assignee-selector.module.css';

const useOutsideClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [callback]);
  return ref;
};

interface AssigneeSelectorProps {
  selectedUsers: User[];
  users: User[];
  onChange: (users: User[]) => void;
  disabled?: boolean;
  canRemoveUser?: (user: User) => boolean;
}

export const AssigneeSelector = ({ selectedUsers, users, onChange, disabled = false, canRemoveUser }: AssigneeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = users.filter(u =>
    u.user_login.toLowerCase().includes(search.toLowerCase()) &&
    !selectedUsers.some(selected => selected.user_id === u.user_id)
  );

  const handleSelect = (user: User) => {
    onChange([...selectedUsers, user]);
    setSearch('');
  };

  const handleRemove = (userId: number) => {
    onChange(selectedUsers.filter(u => u.user_id !== userId));
  };

  return (
    <div className={styles.relative} ref={ref}>
      <div className={styles.container}>
        {selectedUsers.map(user => (
          <span key={user.user_id} className={styles.chip}>
            {user.user_login}
            <button
              type="button"
              onClick={() => handleRemove(user.user_id)}
              disabled={disabled || (canRemoveUser && !canRemoveUser(user))}
              className={styles.chipRemove}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Поиск исполнителей..."
          disabled={disabled}
          className={styles.input}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div className={`${styles.dropdown} no-scrollbar`}>
          {filtered.map(user => (
            <div
              key={user.user_id}
              onClick={() => handleSelect(user)}
              className={styles.dropdownItem}
            >
              <div className={styles.dropdownItemName}>{user.user_login}</div>
              <div className={styles.dropdownItemRoles}>
                {[
                  user.admin_role && 'Админ',
                  user.coordinator_role && 'Координатор',
                  user.designer_role && 'Дизайнер',
                  user.SMM_role && 'SMM',
                  user.photographer_role && 'Фотограф'
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
