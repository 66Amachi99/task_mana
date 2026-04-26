import { useQuery } from '@tanstack/react-query';

export const useStats = () => {
  return useQuery({
    queryKey: ['global-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Ошибка загрузки статистики');
      return res.json();
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};