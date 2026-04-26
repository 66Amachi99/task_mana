'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Tag } from '@/types';
import styles from './tag-selector.module.css';

const useOutsideClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) callback();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [callback]);
  return ref;
};

interface TagSelectorProps {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreate: (name: string) => Promise<Tag | null>;
  disabled?: boolean;
}

export const TagSelector = ({ selectedTags, availableTags, onChange, onCreate, disabled = false }: TagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useOutsideClick(() => setIsOpen(false));

  const filtered = availableTags.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedTags.some(st => st.tag_id === t.tag_id)
  );

  const handleSelect = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setSearch('');
    setIsOpen(false);
  };

  const handleCreate = async () => {
    if (!search.trim()) return;
    const newTag = await onCreate(search);
    if (newTag) handleSelect(newTag);
  };

  return (
    <div className={styles.relative} ref={ref}>
      <div className={styles.tagSelectorContainer}>
        {selectedTags.map(tag => (
          <span
            key={tag.tag_id}
            className={styles.tag}
            style={{ backgroundColor: tag.color }}
          >
            <span style={{ opacity: 0.4 }}>#</span>
            {tag.name}
            <button
              type="button"
              onClick={() => onChange(selectedTags.filter(t => t.tag_id !== tag.tag_id))}
              disabled={disabled}
              className={styles.tagRemove}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Поиск или создание тега..."
          disabled={disabled}
          className={styles.tagInput}
        />
      </div>

      {isOpen && (
        <div className={`${styles.dropdown} no-scrollbar`}>
          {filtered.length > 0 ? (
            filtered.map(tag => (
              <div
                key={tag.tag_id}
                onClick={() => handleSelect(tag)}
                className={styles.tagOption}
              >
                <span className={styles.tagColorDot} style={{ backgroundColor: tag.color }} />
                {tag.name}
              </div>
            ))
          ) : search.trim() ? (
            <div onClick={handleCreate} className={styles.createTagOption}>
              + Создать "{search}"
            </div>
          ) : (
            <div className={styles.noTagsMessage}>Введите текст для поиска</div>
          )}
        </div>
      )}
    </div>
  );
};
