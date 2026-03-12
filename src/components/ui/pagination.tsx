'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from '../styles/Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = (): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.container}>
      {/* Кнопка на первую страницу */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={styles.navButton}
        aria-label="Первая страница"
      >
        <ChevronsLeft className={styles.icon} />
      </button>

      {/* Кнопка на предыдущую страницу */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.navButton}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className={styles.icon} />
      </button>

      {/* Номера страниц */}
      <div className={styles.pageList}>
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={index} className={styles.pageButtonDots}>
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={`${styles.pageButton} ${
                isCurrent ? styles.pageButtonActive : styles.pageButtonInactive
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Кнопка на следующую страницу */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.navButton}
        aria-label="Следующая страница"
      >
        <ChevronRight className={styles.icon} />
      </button>

      {/* Кнопка на последнюю страницу */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={styles.navButton}
        aria-label="Последняя страница"
      >
        <ChevronsRight className={styles.icon} />
      </button>
    </div>
  );
};