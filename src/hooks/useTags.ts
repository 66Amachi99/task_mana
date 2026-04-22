import { useQuery } from '@tanstack/react-query';
import type { Tag } from '@/types';

const API_URL = '/api/tags';

export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Ошибка загрузки тегов');
      return res.json() as Promise<Tag[]>;
    },
    staleTime: 1000 * 60 * 5,
  });
};
