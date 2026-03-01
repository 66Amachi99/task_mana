'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/shared/header';
import { Calendar } from '../../components/calendar/calendar';
import { PostDetailsButton } from '@/components/ui/post_details_button';
import { PostDetailsWindow } from '@/components/shared/post_details_window';
import { format } from 'date-fns';
import { getPostStatus, getStatusColor } from '../../lib/post-status';
import { CalendarAddButton } from '@/components/shared/calendar_add_button';
import { useUser, ROLE_FILTERS } from '../../hooks/use-roles';

interface Post {
  post_id: number;
  post_title: string;
  post_description: string;
  post_type: string;
  post_status: string;
  is_published: boolean;
  post_deadline: Date;
  post_date: Date | null;
  user?: { user_login: string } | null;
  responsible_person_id: number | null;
  
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
  
  post_feedback_mini_video_smm?: string | null;
  post_feedback_video?: string | null;
  post_feedback_text?: string | null;
  post_feedback_photogallery?: string | null;
  post_feedback_cover_photo?: string | null;
  post_feedback_photo_cards?: string | null;
  post_feedback_mini_gallery?: string | null;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);

  const { filterPostByRole } = useUser();

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?limit=100');
      const data = await res.json();
      const postsWithDates = (data.posts || []).map((p: any) => ({
        ...p,
        post_date: p.post_date ? new Date(p.post_date) : null,
        post_deadline: new Date(p.post_deadline)
      }));
      setPosts(postsWithDates);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handlePostUpdated = () => {
      fetchPosts();
    };

    window.addEventListener('postUpdated', handlePostUpdated);
    return () => {
      window.removeEventListener('postUpdated', handlePostUpdated);
    };
  }, [fetchPosts]);

  const filterPostsForCalendar = (postsToFilter: Post[]): Post[] => {
    if (!selectedRoleFilter) return postsToFilter;
    
    // Фильтруем посты, которые содержат хотя бы одну задачу из выбранной роли
    return postsToFilter.filter(post => filterPostByRole(post, selectedRoleFilter));
  };

  const filteredPostsForCalendar = filterPostsForCalendar(posts);

  const postsByDate = new Map<string, Post[]>();
  filteredPostsForCalendar.forEach(post => {
    const dateStr = format(post.post_deadline, 'yyyy-MM-dd');
    if (!postsByDate.has(dateStr)) {
      postsByDate.set(dateStr, []);
    }
    postsByDate.get(dateStr)!.push(post);
  });

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const postsForSelectedDay = postsByDate.get(selectedDateStr) || [];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetails(true);
  };

  const handleCloseDetails = () => {
    setShowPostDetails(false);
    setSelectedPost(null);
  };

  const handlePostUpdate = async () => {
    await fetchPosts();
  };

  if (loading) {
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
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[70%]">
            <Calendar
              postsByDate={postsByDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          <div className="lg:w-[30%]">
            <h2 className="text-xl font-semibold mb-4">
              Посты на {selectedDate.toLocaleDateString('ru-RU')}
              {selectedRoleFilter && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (для роли {ROLE_FILTERS.find(r => r.id === selectedRoleFilter)?.label})
                </span>
              )}
            </h2>
            {postsForSelectedDay.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                {selectedRoleFilter 
                  ? 'Нет постов с задачами для этой роли на этот день' 
                  : 'Нет постов на этот день'}
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {postsForSelectedDay.map(post => (
                  <div 
                    key={post.post_id} 
                    className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    <h3 className="font-semibold text-gray-800 truncate" title={post.post_title}>
                      {post.post_title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={post.post_description}>
                      {post.post_description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getPostStatus(post))}`}>
                          {getPostStatus(post)}
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <PostDetailsButton post={post} onPostUpdate={handlePostUpdate} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CalendarAddButton selectedDate={selectedDate} />

      {showPostDetails && selectedPost && (
        <PostDetailsWindow 
          post={selectedPost} 
          onClose={handleCloseDetails} 
          onSuccess={handlePostUpdate}
        />
      )}
    </div>
  );
}