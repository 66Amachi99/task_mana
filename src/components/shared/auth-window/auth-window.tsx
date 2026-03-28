'use client';

import { useState, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button/action-button';
import styles from './AuthWindow.module.css';

interface AuthWindowProps {
  onClose: () => void;
}

export const AuthWindow = ({ onClose }: AuthWindowProps) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const queryClient = useQueryClient();
  const overlayPointerDownRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [isClosing, onClose]);

  const handleSubmit = async () => {
    if (!login || !password) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        user_login: login,
        user_password: password,
        redirect: false,
      });

      if (result?.error) {
        setError('Неверный логин или пароль');
      } else {
        queryClient.clear();
        handleClose();
      }
    } catch {
      setError('Произошла ошибка при входе');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
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
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <img 
            src="/icons/icon@8x.png" 
            alt="t4sks" 
            className={styles.logo}
          />
          <h2 className={styles.title}>t4sks</h2>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.form}>
          <div className={styles.field}>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className={styles.input}
              placeholder="Логин"
            />
          </div>

          <div className={styles.passwordField}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Пароль"
            />
          </div>

          <div className={styles.buttons}>
            <ActionButton
              variant="base"
              disabled={isLoading || !login || !password}
              onClick={handleSubmit}
              className={styles.submitButton}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};