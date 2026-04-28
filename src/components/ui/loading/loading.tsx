'use client';

import React from 'react';
import styles from './loading.module.css';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  text,
  size = 'medium',
  fullPage = true,
}) => {
  const containerClass = fullPage ? styles.fullPage : styles.inline;

  return (
    <div className={containerClass}>
      <div className={styles.content}>
        {/* Новая структура спиннера */}
        <div className={`${styles.modernLoader} ${styles[size]}`}>
          <span />
          <span />
          <span />
        </div>
        
        {/* Текст с новой анимацией */}
        {text && <span className={styles.text}>{text}</span>}
      </div>
    </div>
  );
};