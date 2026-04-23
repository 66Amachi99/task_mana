'use client';
import React from 'react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className }) => {
  return (
    <div className={`${styles.searchWrapper} ${className || ''}`}>
      <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input 
        className={styles.searchInput}
        type="text"
        placeholder={placeholder || "Поиск..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};