'use client';

import { useEffect, useState, useCallback } from 'react';
import { PostList } from '../components/posts/PostList';
import { Header } from '../components/shared/header';
import { Pagination } from '../components/ui/pagination';

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

export default function HomePage() {
  const [allPosts, setAllPosts] = useState<PostWithRelations[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithRelations[]>([]);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  const fetchAllPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?limit=100`);
      const data = await response.json();
      
      if (Array.isArray(data.posts)) {
        const postsWithDates = data.posts.map((post: any) => ({
          ...post,
          post_date: post.post_date ? new Date(post.post_date) : null,
          post_deadline: new Date(post.post_deadline),
        }));
        setAllPosts(postsWithDates);
      } else {
        setAllPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  useEffect(() => {
    const handlePostUpdated = () => {
      fetchAllPosts();
    };

    window.addEventListener('postUpdated', handlePostUpdated);
    return () => {
      window.removeEventListener('postUpdated', handlePostUpdated);
    };
  }, [fetchAllPosts]);

  useEffect(() => {
    let filtered = allPosts;
    
    if (selectedTaskFilter) {
      const filterFieldMap: Record<string, string> = {
        'video_smm': 'post_needs_video_smm',
        'video_maker': 'post_needs_video_maker',
        'cover_photo': 'post_needs_cover_photo',
        'photo_cards': 'post_needs_photo_cards',
        'photogallery': 'post_needs_photogallery',
      };
      
      const field = filterFieldMap[selectedTaskFilter];
      if (field) {
        filtered = allPosts.filter(post => (post as any)[field] === true);
      }
    }
    
    setFilteredPosts(filtered);
    
    const total = Math.ceil(filtered.length / postsPerPage);
    setTotalPages(total || 1);
    
    setCurrentPage(1);
  }, [selectedTaskFilter, allPosts, postsPerPage]);

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && allPosts.length === 0) {
    return (
      <div>
        <Header 
          selectedTaskFilter={selectedTaskFilter} 
          onTaskFilterChange={setSelectedTaskFilter} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-10">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        selectedTaskFilter={selectedTaskFilter} 
        onTaskFilterChange={setSelectedTaskFilter} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PostList 
          posts={currentPosts} 
          onPostUpdate={fetchAllPosts}
        />
        
        {filteredPosts.length > postsPerPage && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
        
        {filteredPosts.length === 0 && selectedTaskFilter && (
          <div className="text-center py-10">
            <p className="text-gray-500">Нет постов с выбранной задачей</p>
          </div>
        )}
      </div>
    </div>
  );
}