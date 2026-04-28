'use client';
import { ActionButton } from '@/components/ui/action-button/action-button';
import { X, Trash2 } from 'lucide-react';
import styles from './UserForm.module.css';
import pageStyles from '@/app/(main)/admin/AdminPage.module.css';

export default function DeleteModal({ user, onClose, onConfirm }: any) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Удаление</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Вы уверены, что хотите удалить пользователя <strong style={{ color: '#fff' }}>{user.user_login}</strong>?<br/>
          Это действие нельзя отменить.
        </p>

        <div className={styles.modalActions}>
          <ActionButton 
            variant="base" 
            onClick={onClose}
          >
            Отмена
          </ActionButton>
          <ActionButton 
            variant="red" 
            icon={Trash2}
            className={styles.btnConfirmDelete}
            onClick={onConfirm}
          >
            Удалить
          </ActionButton>
        </div>
      </div>
    </div>
  );
}