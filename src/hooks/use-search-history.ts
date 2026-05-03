import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dashboard_search_history';
const MAX_HISTORY = 100;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Убираем дубликат, если он есть, и ставим в начало
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return { history, saveQuery };
}