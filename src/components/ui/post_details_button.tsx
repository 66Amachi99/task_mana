'use client';

import { useState } from 'react';
import { PostDetailsWindow } from '../shared/post_details_window';

interface PostData {
  post_id: number;
  post_title: string;
  post_description: string;
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
  post_date: Date | null;
  post_deadline: Date;
  post_type: string;
  responsible_person_id: number | null;
  user?: {
    user_login: string;
  } | null;
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
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium cursor-pointer"
      >
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