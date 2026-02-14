interface PostWithLinks {
  post_needs_video_smm: boolean;
  post_needs_video_maker: boolean;
  post_needs_text: boolean;
  post_needs_photogallery: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_done_link_video_smm?: string | null;
  post_done_link_video_maker?: string | null;
  post_done_link_text?: string | null;
  post_done_link_photogallery?: string | null;
  post_done_link_cover_photo?: string | null;
  post_done_link_photo_cards?: string | null;
}

/**
 * Проверяет, выполнены ли все необходимые задачи поста
 */
export const isPostCompleted = (post: PostWithLinks): boolean => {
  if (post.post_needs_video_smm && !post.post_done_link_video_smm) return false;
  if (post.post_needs_video_maker && !post.post_done_link_video_maker) return false;
  if (post.post_needs_text && !post.post_done_link_text) return false;
  if (post.post_needs_photogallery && !post.post_done_link_photogallery) return false;
  if (post.post_needs_cover_photo && !post.post_done_link_cover_photo) return false;
  if (post.post_needs_photo_cards && !post.post_done_link_photo_cards) return false;
  
  return true;
};

/**
 * Возвращает статус поста на основе выполнения задач
 */
export const getPostStatus = (post: PostWithLinks): 'В работе' | 'Завершен' => {
  return isPostCompleted(post) ? 'Завершен' : 'В работе';
};

/**
 * Возвращает цветовую схему для статуса
 */
export const getStatusColor = (status: string): string => {
  return status === 'Завершен' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-yellow-100 text-yellow-800';
};