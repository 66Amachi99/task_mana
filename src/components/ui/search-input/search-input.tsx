'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { useSearchHistory } from '@/hooks/use-search-history';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showHistory?: boolean; // Новый проп: по умолчанию true
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  showHistory = true // Значение по умолчанию
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { history, saveQuery } = useSearchHistory();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Если история отключена, возвращаем пустой массив
  const filteredHistory = showHistory 
    ? history.filter(h => h.toLowerCase().includes(inputValue.toLowerCase()) && h !== inputValue).slice(0, 5)
    : [];

  const hasInputValue = inputValue.trim().length > 0;
  const totalItems = hasInputValue ? filteredHistory.length + 1 : filteredHistory.length;

  const handleCommit = (query: string) => {
    const q = query.trim();
    
    // Сохраняем в историю только если это разрешено пропом
    if (showHistory) {
      saveQuery(q);
    }
    
    onChange(q);
    setIsOpen(false);
    setActiveIndex(-1);
    wrapperRef.current?.querySelector('input')?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      let targetQuery = inputValue;
      if (activeIndex !== -1) {
        if (hasInputValue) {
          targetQuery = activeIndex === 0 ? inputValue : filteredHistory[activeIndex - 1];
        } else {
          targetQuery = filteredHistory[activeIndex];
        }
      }
      handleCommit(targetQuery);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className={`${styles.searchWrapper} ${className || ''}`} ref={wrapperRef}>
      <div className={styles.inputContainer}>
        <Search className={styles.searchIcon} />
        <input 
          className={styles.searchInput}
          type="text"
          placeholder={placeholder || "Поиск..."}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {isOpen && (hasInputValue || filteredHistory.length > 0) && (
        <div 
          className={styles.dropdown}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          {/* Пункт "Искать" - нужен всегда для подтверждения ввода по клику */}
          {hasInputValue && (
            <div 
              className={`${styles.dropdownItem} ${activeIndex === 0 ? styles.active : ''}`}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => handleCommit(inputValue)}
            >
              <Search size={14} className={styles.itemIcon} />
              <span className={styles.itemText}>Искать: <strong>{inputValue}</strong></span>
            </div>
          )}

          {/* Пункты истории (рендерится только если showHistory={true}) */}
          {filteredHistory.map((item, idx) => {
            const currentIndex = hasInputValue ? idx + 1 : idx;
            return (
              <div 
                key={item}
                className={`${styles.dropdownItem} ${activeIndex === currentIndex ? styles.active : ''}`}
                onMouseEnter={() => setActiveIndex(currentIndex)}
                onClick={() => handleCommit(item)}
              >
                <Clock size={14} className={styles.itemIcon} />
                <span className={styles.itemText}>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};