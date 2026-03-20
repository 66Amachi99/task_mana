'use client';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../styles/LogoutWindow.module.css';

interface LogoutWindowProps {
  onClose: () => void;
}

export const LogoutWindow = ({ onClose }: LogoutWindowProps) => {
  const queryClient = useQueryClient();

  const handleConfirm = async () => {
    await signOut({ redirect: false });
    queryClient.clear();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.spacer}></div>
            <h2 className={styles.title}>Подтверждение</h2>
            <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Закрыть">
              <svg className={styles.closeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className={styles.message}>Вы уверены, что хотите выйти?</p>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.buttonCancel}>
              Отмена
            </button>
            <button type="button" onClick={handleConfirm} className={styles.buttonConfirm}>
              Выйти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};