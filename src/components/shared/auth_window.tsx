'use client';

import { useState, useRef, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import styles from '../styles/AuthWindow.module.css';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <h2 className={styles.title}>Вход в систему</h2>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.passwordField}>
            <label className={styles.label}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttons}>
            <button type="button" onClick={handleClose} className={styles.buttonCancel}>
              Отмена
            </button>
            <button type="submit" disabled={isLoading} className={styles.buttonSubmit}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};