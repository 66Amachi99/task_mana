import type { Post } from '@/types';

type PostWithLinks = Pick<Post, 
  | 'post_status'
  | 'post_needs_mini_video_smm'
  | 'post_needs_video'
  | 'post_needs_text'
  | 'post_needs_photogallery'
  | 'post_needs_cover_photo'
  | 'post_needs_photo_cards'
  | 'post_needs_mini_gallery'
  | 'post_done_link_mini_video_smm'
  | 'post_done_link_video'
  | 'post_done_link_text'
  | 'post_done_link_photogallery'
  | 'post_done_link_cover_photo'
  | 'post_done_link_photo_cards'
  | 'post_done_link_mini_gallery'
>;


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