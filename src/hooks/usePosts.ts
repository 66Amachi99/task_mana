import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Тип для поста (расширенный, соответствует тому, что возвращает API)
export interface Post {
  post_id: number;
  post_title: string;
  post_description: string | null;
  post_status: string;
  is_published: boolean;
  telegram_published?: string | null;
  vkontakte_published?: string | null;
  MAX_published?: string | null;
  tz_link?: string | null;
  feedback_comment?: string | null;
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_photogallery: boolean;
  post_needs_mini_gallery: boolean;
  post_needs_text: boolean;
  post_done_link_mini_video_smm?: string | null;
  post_done_link_video?: string | null;
  post_done_link_cover_photo?: string | null;
  post_done_link_photo_cards?: string | null;
  post_done_link_photogallery?: string | null;
  post_done_link_mini_gallery?: string | null;
  post_done_link_text?: string | null;
  post_date: string | null; // в API приходит строка
  post_deadline: string; // строка
  responsible_person_id: number | null;
  approved_by_id?: number | null;
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  tags?: Array<{ tag_id: number; name: string; color: string }>;
  comments?: Array<{
    id: number;
    text: string;
    status: string;
    created_at: string;
    task_type_id?: number;
  }>;
  [key: string]: unknown;
}

// Базовый URL для API постов
const API_URL = '/api/posts';

// ---- Запросы (queries) ----

// Получить все посты (с пагинацией)
export const usePosts = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ['posts', { page, limit }],
    queryFn: async () => {
      const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Ошибка загрузки постов');
      const data = await res.json();
      // API возвращает { posts, currentPage, totalPages, totalPosts }
      return {
        posts: data.posts as Post[],
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalPosts: data.totalPosts,
      };
    },
  });
};

// Получить один пост по ID
export const usePost = (id: number | null) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) throw new Error('ID поста не указан');
      const res = await fetch(`${API_URL}?id=${id}`);
      if (!res.ok) throw new Error('Ошибка загрузки поста');
      const data = await res.json();
      // API возвращает { posts: [post] }
      return data.posts[0] as Post;
    },
    enabled: !!id, // запрос выполняется только если id есть
  });
};

// ---- Мутации (mutations) ----

// Создать пост
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPost: any) => {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка создания поста');
      }
      return res.json(); // возвращает { success: true, post }
    },
    onSuccess: () => {
      // Инвалидируем список постов, чтобы он перезапросился
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Обновить пост (полное обновление через PUT)
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, data }: { postId: number; data: any }) => {
      const res = await fetch('/api/posts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка обновления поста');
      }
      return res.json(); // возвращает { success: true, post }
    },
    onSuccess: (_, variables) => {
      // Инвалидируем список и конкретный пост
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
};

// Частичное обновление (например, approve/publish)
export const usePatchPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, action, social, link }: { postId: number; action: string; social?: string; link?: string }) => {
      const res = await fetch('/api/posts/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action, social, link }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка обновления статуса');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
};

// Удалить пост
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/posts/delete?id=${postId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка удаления поста');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// ---- Комментарии ----

// Добавить комментарий
export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, taskTypeId, text }: { postId: number; taskTypeId: number; text: string }) => {
      const res = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, taskTypeId, text }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка добавления комментария');
      }
      return res.json(); // возвращает созданный комментарий
    },
    onSuccess: (data, variables) => {
      // Инвалидируем конкретный пост, чтобы обновить комментарии
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      // Также инвалидируем список постов
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// Обновить статус комментария
export const useUpdateCommentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: number; status: string }) => {
      const res = await fetch('/api/posts/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка обновления статуса комментария');
      }
      return res.json(); // ожидается, что API вернёт обновлённый комментарий с post_id
    },
    onSuccess: (data) => {
      // Если API вернул комментарий с полем post_id, инвалидируем этот пост
      if (data && data.post_id) {
        queryClient.invalidateQueries({ queryKey: ['post', data.post_id] });
      } else {
        // иначе инвалидируем все посты
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });
};