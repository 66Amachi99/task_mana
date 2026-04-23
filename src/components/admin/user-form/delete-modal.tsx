'use client';
import styles from './UserForm.module.css';
import pageStyles from '@/app/(main)/admin/AdminPage.module.css';

export default function DeleteModal({ user, onClose, onConfirm }: any) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Удаление</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg className={pageStyles.icon} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
          Вы уверены, что хотите удалить пользователя <strong style={{ color: '#fff' }}>{user.user_login}</strong>?<br/>
          Это действие нельзя отменить.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className={pageStyles.btn} onClick={onClose}>Отмена</button>
          <button 
            className={pageStyles.btn} 
            style={{ 
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.25) 100%)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
              color: '#fca5a5'
            }}
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}