'use client';

import { useRef, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, X } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button/action-button';
import styles from './LogoutWindow.module.css';

interface LogoutWindowProps {
  onClose: () => void;
}

export const LogoutWindow = ({ onClose }: LogoutWindowProps) => {
  const queryClient = useQueryClient();
  const overlayPointerDownRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [isClosing, onClose]);

  const handleConfirm = async () => {
    await signOut({ redirect: false });
    queryClient.clear();
    handleClose();
  };

  return (
    <div
      className={styles.overlay}
      onPointerDown={(e) => {
        overlayPointerDownRef.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        const shouldClose = overlayPointerDownRef.current && e.target === e.currentTarget;
        overlayPointerDownRef.current = false;
        if (shouldClose) handleClose();
      }}
      onPointerCancel={() => {
        overlayPointerDownRef.current = false;
      }}
    >
      <div
        className={`${styles.modal} ${isClosing ? styles.modalClosing : styles.modalOpening}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={() => {
          overlayPointerDownRef.current = false;
        }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Выход</h2>
        </div>

        <p className={styles.message}>Вы уверены, что хотите выйти?</p>

        <div className={styles.buttons}>
          <ActionButton
            variant="base"
            onClick={handleClose}
            className={styles.button}
          >
            Отмена
          </ActionButton>
          <ActionButton
            variant="base"
            onClick={handleConfirm}
            className={styles.button}
          >
            Выйти
          </ActionButton>
        </div>
      </div>
    </div>
  );
};