import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGalleryStore } from '@/store/useGalleryStore';

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
  post_date: string | null;
  post_deadline: string;
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
    created_by_id: number;
    created_by?: {
      user_id: number;
      user_login: string;
    } | null;
  }>;
  [key: string]: unknown;
}

const API_URL = '/api/posts';

export const usePosts = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ['posts', { page, limit }],
    queryFn: async () => {
      const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Ошибка загрузки постов');
      const data = await res.json();
      return {
        posts: data.posts as Post[],
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalPosts: data.totalPosts,
      };
    },
  });
};

export const usePost = (id: number | null) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) throw new Error('ID поста не указан');
      const res = await fetch(`${API_URL}?id=${id}`);
      if (!res.ok) throw new Error('Ошибка загрузки поста');
      const data = await res.json();
      return data.posts[0] as Post;
    },
    enabled: !!id,
  });
};

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

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

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

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
};

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
      useGalleryStore.getState().clearCache();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

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

      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

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

      return res.json();
    },
    onSuccess: (data) => {
      if (data && data.post_id) {
        queryClient.invalidateQueries({ queryKey: ['post', data.post_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/posts/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка удаления комментария');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};