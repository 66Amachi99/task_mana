import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Task } from '../../types/task';

const API_URL = '/api/tasks';

// ---- Запросы (queries) ----

export const useTasks = (page = 1, limit = 100, filter?: string) => {
  // Убрана проверка авторизации
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (filter) params.append('filter', filter);

  return useQuery({
    queryKey: ['tasks', { page, limit, filter }],
    queryFn: async () => {
      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) throw new Error('Ошибка загрузки задач');
      const data = await res.json();
      return {
        tasks: data.tasks as Task[],
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalTasks: data.totalTasks,
      };
    },
  });
};

export const useTask = (id: number | null) => {
  // Убрана проверка авторизации
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) throw new Error('ID задачи не указан');
      const res = await fetch(`${API_URL}?id=${id}`);
      if (!res.ok) throw new Error('Ошибка загрузки задачи');
      const data = await res.json();
      return data.tasks[0] as Task;
    },
    enabled: !!id,
  });
};

// ---- Мутации (mutations) ----
// (остаются без изменений)

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTask: any) => {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка создания задачи');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: any }) => {
      const res = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка обновления задачи');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
};

export const usePatchTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status, completed_task }: { taskId: number; status?: string; completed_task?: string }) => {
      const res = await fetch('/api/tasks/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status, completed_task }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка обновления задачи');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/tasks/delete?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка удаления задачи');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};