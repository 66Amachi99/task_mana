interface PostWithLinks {
  post_status: string;
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_text: boolean;
  post_needs_photogallery: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_mini_gallery: boolean;
  post_done_link_mini_video_smm?: string | null;
  post_done_link_video?: string | null;
  post_done_link_text?: string | null;
  post_done_link_photogallery?: string | null;
  post_done_link_cover_photo?: string | null;
  post_done_link_photo_cards?: string | null;
  post_done_link_mini_gallery?: string | null;
}


export const isPostCompleted = (post: PostWithLinks): boolean => {
  if (post.post_needs_mini_video_smm && !post.post_done_link_mini_video_smm) return false;
  if (post.post_needs_video && !post.post_done_link_video) return false;
  if (post.post_needs_text && !post.post_done_link_text) return false;
  if (post.post_needs_photogallery && !post.post_done_link_photogallery) return false;
  if (post.post_needs_cover_photo && !post.post_done_link_cover_photo) return false;
  if (post.post_needs_photo_cards && !post.post_done_link_photo_cards) return false;
  if (post.post_needs_mini_gallery && !post.post_done_link_mini_gallery) return false;
  
  return true;
};


export const getPostStatus = (post: PostWithLinks): string => {
  return post.post_status || 'В работе';
};


export const getStatusColor = (status: string): string => {
  return status === 'Завершен' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-yellow-100 text-yellow-800';
};