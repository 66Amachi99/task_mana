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
  post_date: Date | null;
  post_deadline: Date;
  post_type: string;
  post_status: string | null;
  user?: {
    user_login: string;
  } | null;
}

interface PostDetailsButtonProps {
  post: PostData;
}

export const PostDetailsButton = ({ post }: PostDetailsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-slate-300 text-white rounded-md hover:bg-slate-400 transition-colors text-sm cursor-pointer"
      >
        Подробнее
      </button>

      {isModalOpen && <PostDetailsWindow onClose={handleCloseModal} post={post} />}
    </>
  );
};