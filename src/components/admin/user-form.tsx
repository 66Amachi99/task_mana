'use client';
import { useState, useEffect } from 'react';
import styles from './UserForm.module.css';
import pageStyles from '@/app/admin/AdminPage.module.css';

export default function UserForm({ user, onClose, onSave }: any) {
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
    if (user) setFormData({ ...user, user_password: '' });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const roles = [
    { id: 'admin_role', label: 'Админ' },
    { id: 'SMM_role', label: 'SMM' },
    { id: 'designer_role', label: 'Дизайнер' },
    { id: 'coordinator_role', label: 'Координатор' },
    { id: 'photographer_role', label: 'Фотограф' },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {user ? `Редактировать: ${user.user_login}` : 'Новый пользователь'}
          </h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg className={pageStyles.icon} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Логин</label>
            <input 
              className={styles.formInput} required
              value={formData.user_login}
              onChange={e => setFormData({...formData, user_login: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Пароль</label>
            <input 
              className={styles.formInput} type="password"
              placeholder={user ? "Оставьте пустым, чтобы не менять" : "Введите пароль..."}
              required={!user}
              value={formData.user_password}
              onChange={e => setFormData({...formData, user_password: e.target.value})}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Роли</label>
            <div className={styles.rolesGrid}>
              {roles.map(role => (
                <div key={role.id}>
                  <input 
                    type="checkbox" id={role.id} className={styles.roleCheckbox}
                    checked={(formData as any)[role.id]}
                    onChange={e => setFormData({...formData, [role.id]: e.target.checked})}
                  />
                  <label htmlFor={role.id} className={styles.roleCheckboxLabel}>{role.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={pageStyles.btn} onClick={onClose}>Отмена</button>
            <button type="submit" className={`${pageStyles.btn} ${pageStyles.btnPrimary}`}>Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}