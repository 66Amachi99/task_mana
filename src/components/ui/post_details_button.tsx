'use client';

import { useState } from 'react';
import { PostDetailsWindow } from '../shared/post_details_window';
import { Eye } from 'lucide-react';
import styles from '../styles/PostList.module.css';

interface PostData {
  post_id: number;
  post_title: string;
  post_description: string;
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
  
  post_feedback_mini_video_smm?: string | null;
  post_feedback_video?: string | null;
  post_feedback_cover_photo?: string | null;
  post_feedback_photo_cards?: string | null;
  post_feedback_photogallery?: string | null;
  post_feedback_mini_gallery?: string | null;
  post_feedback_text?: string | null;
  
  comments?: Array<{
    id: number;
    text: string;
    status: string;
    created_at: string;
    task_type_id?: number;
  }>;
  
  post_date: Date | null;
  post_deadline: Date;
  
  responsible_person_id: number | null;
  approved_by_id?: number | null;
  
  user?: { 
    user_login: string;
  } | null;
  approved_by?: {
    user_login: string;
  } | null;
  tags?: Array<{
    tag_id: number;
    name: string;
    color: string;
  }>;
  
  [key: string]: unknown;
}

interface PostDetailsButtonProps {
  post: PostData;
  onPostUpdate: () => Promise<void>;
}

export const PostDetailsButton = ({ post, onPostUpdate }: PostDetailsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = async () => {
    await onPostUpdate();
    handleClose();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={styles.Button}
      >
        <Eye className="w-4 h-4" />
        Подробнее
      </button>

      {isOpen && (
        <PostDetailsWindow
          post={post}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};