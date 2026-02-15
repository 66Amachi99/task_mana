'use client';

import { PostDetailsButton } from '../ui/post_details_button';
import { getPostStatus, getStatusColor } from '../../lib/post-status';

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

interface PostListProps {
  posts: PostWithRelations[];
  onPostUpdate: () => Promise<void>;
}

export function PostList({ posts, onPostUpdate }: PostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-6 md:py-10">
        <p className="text-gray-500 text-sm md:text-base">Нет постов для отображения</p>
      </div>
    );
  }

  const getRequiredTasks = (post: PostWithRelations) => {
    const tasks = [];
    
    if (post.post_needs_video_smm) {
      const hasLink = post.post_done_link_video_smm && post.post_done_link_video_smm.trim() !== '';
      tasks.push({ 
        name: 'Видео для SMM', 
        role: 'smm',
        field: 'post_needs_video_smm',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_video_maker) {
      const hasLink = post.post_done_link_video_maker && post.post_done_link_video_maker.trim() !== '';
      tasks.push({ 
        name: 'Видео для видеомейкера', 
        role: 'videomaker',
        field: 'post_needs_video_maker',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_text) {
      const hasLink = post.post_done_link_text && post.post_done_link_text.trim() !== '';
      tasks.push({ 
        name: 'Текст', 
        role: 'text',
        field: 'post_needs_text',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_photogallery) {
      const hasLink = post.post_done_link_photogallery && post.post_done_link_photogallery.trim() !== '';
      tasks.push({ 
        name: 'Фотогалерея', 
        role: 'photographer',
        field: 'post_needs_photogallery',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_cover_photo) {
      const hasLink = post.post_done_link_cover_photo && post.post_done_link_cover_photo.trim() !== '';
      tasks.push({ 
        name: 'Обложка', 
        role: 'designer',
        field: 'post_needs_cover_photo',
        isCompleted: hasLink
      });
    }
    if (post.post_needs_photo_cards) {
      const hasLink = post.post_done_link_photo_cards && post.post_done_link_photo_cards.trim() !== '';
      tasks.push({ 
        name: 'Фотокарточки', 
        role: 'designer',
        field: 'post_needs_photo_cards',
        isCompleted: hasLink
      });
    }
    
    return tasks;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {posts.map((post) => {
        const requiredTasks = getRequiredTasks(post);
        
        return (
          <div
            key={post.post_id}
            className="bg-gray-50 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate" title={post.post_title}>
                  {post.post_title}
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-2 line-clamp-2 md:line-clamp-3" title={post.post_description}>
                  {post.post_description}
                </p>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                  <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-800 text-xs md:text-sm font-medium rounded-full">
                    {post.post_type}
                  </span>
                  <span className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full ${getStatusColor(getPostStatus(post))}`}>
                    {getPostStatus(post)}
                  </span>
                </div>
              </div>
              
              <div className="text-left md:text-right shrink-0 text-xs md:text-sm">
                <p className="text-gray-500">
                  Создан: {post.post_date ? new Date(post.post_date).toLocaleDateString('ru-RU') : 'Не указана'}
                </p>
                <p className="text-gray-500 mt-1">
                  Дедлайн: {new Date(post.post_deadline).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {post.user && (
              <div className="mb-4 p-2 md:p-3 bg-gray-50 rounded border-2">
                <p className="text-xs md:text-sm text-gray-600">
                  Ответственный: <span className="font-medium">{post.user.user_login}</span>
                </p>
              </div>
            )}

            {requiredTasks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">Требуемые задачи:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                  {requiredTasks.map((task, index) => {
                    return (
                      <div
                        key={index}
                        className="border rounded p-2 md:p-3 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm font-medium text-gray-700">
                            {task.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            task.isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.isCompleted ? 'Выполнено' : 'Ожидает выполнения'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 md:mt-6 pt-4 border-t flex justify-end">
              <PostDetailsButton post={post} onPostUpdate={onPostUpdate} />
            </div>
          </div>
        );
      })}
    </div>
  );
}