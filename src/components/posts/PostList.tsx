'use client';

import { PostDetailsButton } from '../ui/post_details_button';
import { useUser } from '../../hooks/use-roles';
import { useEffect, useState, useMemo } from 'react';

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

interface PostListProps {
  posts: PostWithRelations[];
  showOnlyMyTasks: boolean;
}

export function PostList({ posts, showOnlyMyTasks }: PostListProps) {
  const { 
    user, 
    loading, 
    isAdminOrCoordinator,
    getUserTaskFields,
    hasAccessToPost 
  } = useUser();
  
  const [filteredPosts, setFilteredPosts] = useState<PostWithRelations[]>(posts);

  // Получаем поля задач текущего пользователя
  const userTaskFields = useMemo(() => {
    return getUserTaskFields();
  }, [getUserTaskFields]);

  // Фильтрация постов - исправляем зависимости
  useEffect(() => {
    // Если нет пользователя или загрузка, показываем все посты
    if (!user || loading) {
      setFilteredPosts(posts);
      return;
    }

    // Админ и координатор всегда видят все посты
    if (isAdminOrCoordinator) {
      setFilteredPosts(posts);
      return;
    }

    // Для остальных ролей
    if (showOnlyMyTasks) {
      const relevantPosts = posts.filter(post => hasAccessToPost(post));
      setFilteredPosts(relevantPosts);
    } else {
      setFilteredPosts(posts);
    }
  }, [showOnlyMyTasks, posts, user, loading, isAdminOrCoordinator, hasAccessToPost]);

  const getRequiredTasks = (post: PostWithRelations) => {
    const tasks = [];
    
    if (post.post_needs_video_smm) tasks.push({ 
      name: 'Видео для SMM', 
      role: 'smm',
      field: 'post_needs_video_smm' 
    });
    if (post.post_needs_video_maker) tasks.push({ 
      name: 'Видео для видеомейкера', 
      role: 'videomaker',
      field: 'post_needs_video_maker' 
    });
    if (post.post_needs_photogallery) tasks.push({ 
      name: 'Фотогалерея', 
      role: 'designer',
      field: 'post_needs_photogallery' 
    });
    if (post.post_needs_cover_photo) tasks.push({ 
      name: 'Обложка', 
      role: 'designer',
      field: 'post_needs_cover_photo' 
    });
    if (post.post_needs_photo_cards) tasks.push({ 
      name: 'Фотокарточки', 
      role: 'designer',
      field: 'post_needs_photo_cards' 
    });
    
    return tasks;
  };

  if (loading) {
    return <div className="text-center py-10">Загрузка...</div>;
  }

  if (!filteredPosts || filteredPosts.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          {showOnlyMyTasks && !isAdminOrCoordinator
            ? 'Нет постов с вашими задачами' 
            : 'Нет постов для отображения'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredPosts.map((post) => {
        const requiredTasks = getRequiredTasks(post);
        
        return (
          <div
            key={post.post_id}
            className="bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {post.post_title}
                </h2>
                <p className="text-gray-600 mt-2">{post.post_description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {post.post_type}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    post.post_status === 'Завершен' ? 'bg-green-100 text-green-800' :
                    post.post_status === 'В процессе' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {post.post_status || 'Ожидает начала'}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Создан: {post.post_date ? new Date(post.post_date).toLocaleDateString('ru-RU') : 'Не указана'}
                </p>
                <p className="text-sm mt-1">
                  Дедлайн: {new Date(post.post_deadline).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {post.user && (
              <div className="mb-4 p-3 bg-gray-50 rounded border-2">
                <p className="text-sm text-gray-600">
                  Ответственный: <span className="font-medium">{post.user.user_login}</span>
                </p>
              </div>
            )}

            {requiredTasks.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Требуемые задачи:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {requiredTasks.map((task, index) => {
                    const isUserTask = !isAdminOrCoordinator && userTaskFields.includes(task.field);
                    
                    return (
                      <div
                        key={index}
                        className={`border rounded p-3 hover:bg-gray-50`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            {task.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded bg-gray-100 text-gray-800`}>
                            Ожидает выполнения
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-500"></div>
              <PostDetailsButton post={post} />
            </div>
          </div>
        );
      })}
    </div>
  );
}