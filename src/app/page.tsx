'use client';

import { useEffect, useState, useCallback } from 'react';
import { PostList } from '../components/posts/PostList';
import { Header } from '../components/shared/header';
import { Pagination } from '../components/ui/pagination';
import { useUser, ROLE_FILTERS } from '../hooks/use-roles';

interface PostWithRelations {
  post_id: number;
  post_title: string;
  post_description: string;
  post_status: string;
  is_published: boolean;
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
}

export default function HomePage() {
  const [allPosts, setAllPosts] = useState<PostWithRelations[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithRelations[]>([]);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  const { filterPostByRole } = useUser();

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
    
    if (selectedRoleFilter) {
      // Фильтруем посты, которые содержат хотя бы одну задачу из выбранной роли
      filtered = allPosts.filter(post => filterPostByRole(post, selectedRoleFilter));
    }
    
    setFilteredPosts(filtered);
    
    const total = Math.ceil(filtered.length / postsPerPage);
    setTotalPages(total || 1);
    
    setCurrentPage(1);
  }, [selectedRoleFilter, allPosts, filterPostByRole, postsPerPage]);

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
          selectedTaskFilter={selectedRoleFilter} 
          onTaskFilterChange={setSelectedRoleFilter} 
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
        selectedTaskFilter={selectedRoleFilter} 
        onTaskFilterChange={setSelectedRoleFilter} 
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
        
        {filteredPosts.length === 0 && selectedRoleFilter && (
          <div className="text-center py-10">
            <p className="text-gray-500">
              Нет постов с задачами для роли {ROLE_FILTERS.find(r => r.id === selectedRoleFilter)?.label}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}