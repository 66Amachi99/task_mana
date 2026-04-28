'use client';

import React, { useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from './ConfirmPopover.module.css';

interface ConfirmPopoverProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  isDeleting?: boolean;
}

export const ConfirmPopover: React.FC<ConfirmPopoverProps> = ({ 
  onConfirm, 
  onCancel, 
  title = "Удалить?", 
  isDeleting 
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Функция, которая сработает при клике
    const handleClickOutside = (event: MouseEvent) => {
      // Если поповер открыт и клик был НЕ по нему
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    // Добавляем слушатель события
    document.addEventListener('mousedown', handleClickOutside);
    
    // Важно: удаляем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  return (
    <div className={styles.popover} ref={popoverRef}>
      <span className={styles.title}>{title}</span>
      <div className={styles.actions}>
        <button 
          onClick={onCancel} 
          className={styles.cancelBtn}
          disabled={isDeleting}
        >
          <X size={14} />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Предотвращаем срабатывание клика вне на самой кнопке
            onConfirm();
          }} 
          className={styles.confirmBtn}
          disabled={isDeleting}
        >
          {isDeleting ? <div className={styles.loader} /> : <Check size={14} />}
        </button>
      </div>
      <div className={styles.arrow} />
    </div>
  );
};