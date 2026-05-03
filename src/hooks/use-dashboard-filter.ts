import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { CalendarTask, CalendarPost } from '@/types';

type ContentItem = (CalendarPost & { type: 'post' }) | (CalendarTask & { type: 'task' });

interface FilterOptions {
  posts: any[];
  tasks: any[];
  showPosts: boolean;
  showTasks: boolean;
  showIncompleteOnly: boolean;
  showOverdueOnly: boolean;
  roleFilter: string | null;
  searchQuery: string; // Это теперь "закоммиченный" запрос
  filterPostByRole: (post: any, role: string) => boolean;
}

export function useDashboardFilter({
  posts,
  tasks,
  showPosts,
  showTasks,
  showIncompleteOnly,
  showOverdueOnly,
  roleFilter,
  searchQuery,
  filterPostByRole,
}: FilterOptions) {
  
  const allFilteredItems = useMemo(() => {
    const p = showPosts ? posts.map(item => ({ ...item, type: 'post' as const })) : [];
    const t = showTasks ? tasks.map(item => ({ ...item, type: 'task' as const })) : [];
    let items = [...p, ...t] as ContentItem[];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const getItemDate = (item: ContentItem) => 
      item.type === 'post' ? new Date(item.post_deadline) : new Date(item.end_time);

    items = items.filter(i => 
      showOverdueOnly ? getItemDate(i) < todayStart : getItemDate(i) >= todayStart
    );

    if (showIncompleteOnly) {
      items = items.filter(i =>
        i.type === 'post'
          ? !['Завершен', 'Завершено'].includes(i.post_status)
          : !['Выполнена', 'Выполнено'].includes(i.task_status)
      );
    }

    if (roleFilter) {
      items = items.filter(i => (i.type === 'post' ? filterPostByRole(i, roleFilter) : true));
    }

    // ЛОГИКА ПОИСКА ПО МНОЖЕСТВЕННЫМ ТЕГАМ И ТЕКСТУ
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      
      // Извлекаем все теги (слова с #)
      const tagsInQuery = q.match(/#[\wа-яА-Я-]+/g) || [];
      // Убираем теги из строки, чтобы оставить только текст
      const textQuery = q.replace(/#[\wа-яА-Я-]+/g, '').trim();

      items = items.filter(item => {
        // 1. Проверка тегов (логика "И" - должны быть все теги из поиска)
        const itemTags = (item.tags || []).map(t => t.name.toLowerCase());
        const matchesTags = tagsInQuery.every(tag => {
          const cleanTag = tag.slice(1); // убираем #
          return itemTags.some(it => it.includes(cleanTag));
        });

        if (!matchesTags) return false;

        // 2. Проверка текста (если он есть)
        if (textQuery) {
          const title = item.type === 'post' ? item.post_title : item.title;
          return title.toLowerCase().includes(textQuery);
        }

        return true;
      });
    }

    items.sort((a, b) => {
      const tA = getItemDate(a).getTime();
      const tB = getItemDate(b).getTime();
      return showOverdueOnly ? tB - tA : tA - tB;
    });

    return items;
  }, [posts, tasks, showPosts, showTasks, showIncompleteOnly, showOverdueOnly, roleFilter, searchQuery, filterPostByRole]);

  const getGroupedItems = (displayLimit: number) => {
    const slice = allFilteredItems.slice(0, displayLimit);
    const groupsMap = new Map<string, { dateKey: string; displayDate: string; items: ContentItem[] }>();

    slice.forEach(item => {
      const d = item.type === 'post' ? new Date(item.post_deadline) : new Date(item.end_time);
      const key = format(d, 'yyyy-MM-dd');
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { 
          dateKey: key, 
          displayDate: format(d, 'dd MMMM', { locale: ru }), 
          items: [] 
        });
      }
      groupsMap.get(key)!.items.push(item);
    });
    return Array.from(groupsMap.values());
  };

  return { filteredCount: allFilteredItems.length, allFilteredItems, getGroupedItems };
}