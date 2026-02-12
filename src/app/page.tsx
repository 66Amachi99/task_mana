'use client';

import { useEffect, useState } from 'react';
import { PostList } from '../components/posts/PostList';
import { Header } from '../components/shared/header';

interface PostWithRelations {
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
  responsible_person_id: number | null;
  user?: {
    user_login: string;
  } | null;
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        // ПРЕОБРАЗУЕМ СТРОКИ В ДАТЫ!
        const postsWithDates = data.map((post: any) => ({
          ...post,
          post_date: post.post_date ? new Date(post.post_date) : null,
          post_deadline: new Date(post.post_deadline),
        }));
        
        setPosts(postsWithDates);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header showMyTasks={showMyTasks} onShowMyTasksChange={setShowMyTasks} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-10">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showMyTasks={showMyTasks} onShowMyTasksChange={setShowMyTasks} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostList posts={posts} showOnlyMyTasks={showMyTasks} />
      </div>
    </div>
  );
}