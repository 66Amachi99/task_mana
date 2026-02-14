'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/shared/header';
import { Calendar } from '../../components/calendar/calendar';
import { PostDetailsButton } from '@/components/ui/post_details_button';
import { PostDetailsWindow } from '@/components/shared/post_details_window';
import { format } from 'date-fns';
import { getPostStatus, getStatusColor } from '../../lib/post-status';

interface Post {
  post_id: number;
  post_title: string;
  post_description: string;
  post_type: string;
  post_deadline: Date;
  post_date: Date | null;
  user?: { user_login: string } | null;
  responsible_person_id: number | null;
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

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);

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

  const filterFieldMap: Record<string, string> = {
    'video_smm': 'post_needs_video_smm',
    'video_maker': 'post_needs_video_maker',
    'cover_photo': 'post_needs_cover_photo',
    'photo_cards': 'post_needs_photo_cards',
    'photogallery': 'post_needs_photogallery',
  };

  const filterPostsForCalendar = (postsToFilter: Post[]): Post[] => {
    if (!selectedTaskFilter) return postsToFilter;
    
    const field = filterFieldMap[selectedTaskFilter];
    if (!field) return postsToFilter;
    
    return postsToFilter.filter(post => (post as any)[field] === true);
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
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[70%]">
            <Calendar
              postsByDate={postsByDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              showMyTasks={false}
              hasAccessToPost={() => true}
            />
          </div>

          <div className="lg:w-[30%]">
            <h2 className="text-xl font-semibold mb-4">
              Посты на {selectedDate.toLocaleDateString('ru-RU')}
              {selectedTaskFilter && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (с выбранной задачей)
                </span>
              )}
            </h2>
            {postsForSelectedDay.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                {selectedTaskFilter 
                  ? 'Нет постов с выбранной задачей на этот день' 
                  : 'Нет постов на этот день'}
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {postsForSelectedDay.map(post => (
                  <div key={post.post_id} className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800 truncate" title={post.post_title}>
                      {post.post_title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={post.post_description}>
                      {post.post_description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {post.post_type}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getPostStatus(post))}`}>
                          {getPostStatus(post)}
                        </span>
                      </div>
                      <PostDetailsButton post={post} onPostUpdate={handlePostUpdate} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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