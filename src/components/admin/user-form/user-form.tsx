'use client';

import { useState, useEffect } from 'react';
import { ActionButton } from '@/components/ui/action-button/action-button';
import { X, Check } from 'lucide-react';
import styles from './UserForm.module.css';

interface UserFormProps {
  user: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function UserForm({ user, onClose, onSave }: UserFormProps) {
  const [formData, setFormData] = useState({
    user_login: '',
    user_password: '',
    admin_role: false,
    SMM_role: false,
    designer_role: false,
    coordinator_role: false,
    photographer_role: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({ ...user, user_password: '' });
    }
  }, [user]);

  const handleSubmit = () => {
    onSave(formData);
  };

  const roles = [
    { id: 'admin_role', label: 'Админ' },
    { id: 'SMM_role', label: 'SMM' },
    { id: 'designer_role', label: 'Дизайнер' },
    { id: 'coordinator_role', label: 'Координатор' },
    { id: 'photographer_role', label: 'Фотограф' },
  ];

  const toggleRole = (roleId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {user ? `Редактировать: ${user.user_login}` : 'Новый пользователь'}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Логин</label>
          <input
            className={styles.formInput}
            value={formData.user_login}
            onChange={e => setFormData({ ...formData, user_login: e.target.value })}
            placeholder="Логин"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Пароль</label>
          <input
            className={styles.formInput}
            type="password"
            placeholder={user ? "Оставьте пустым, чтобы не менять" : "Введите пароль..."}
            value={formData.user_password}
            onChange={e => setFormData({ ...formData, user_password: e.target.value })}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Роли</label>
          <div className={styles.taskButtons}>
            {roles.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.id)}
                className={(formData as any)[role.id] ? styles.taskButtonSelected : styles.taskButtonDefault}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.modalActions}>
          <ActionButton
            variant="lightGray"
            onClick={onClose}
            icon={X}
          >
            Отмена
          </ActionButton>
          <ActionButton
            variant="base"
            icon={Check}
            className={styles.btnSave}
            onClick={handleSubmit}
          >
            Сохранить
          </ActionButton>
        </div>
      </div>
    </div>
  );
}