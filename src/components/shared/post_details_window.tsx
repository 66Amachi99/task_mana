'use client';

import { useState, useEffect } from 'react';
import { X, Lock, ExternalLink } from 'lucide-react';
import { EditPostWindow } from './edit_post_window';
import { useUser } from '../../hooks/use-roles';
import { getPostStatus, getStatusColor } from '../../lib/post-status';

interface TaskField {
  id: number;
  name: string;
  label: string;
  link: string;
  required: boolean;
  role: string;
}

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

interface PostDetailsWindowProps {
  onClose: () => void;
  post: PostData | null;
  onSuccess: () => Promise<void>;
}

export const PostDetailsWindow = ({ onClose, post, onSuccess }: PostDetailsWindowProps) => {
  const { user, isAdminOrCoordinatorOrSmm, canEditTask } = useUser();
  const [tasks, setTasks] = useState<TaskField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);

  const canEditPost = user && isAdminOrCoordinatorOrSmm;

  useEffect(() => {
    if (post) {
      const taskFields: TaskField[] = [
        { 
          id: 1, 
          name: 'video_smm', 
          label: 'Видео-СММ', 
          link: post.post_done_link_video_smm || '', 
          required: post.post_needs_video_smm,
          role: 'smm'
        },
        { 
          id: 2, 
          name: 'video_maker', 
          label: 'Видеоролик', 
          link: post.post_done_link_video_maker || '', 
          required: post.post_needs_video_maker,
          role: 'videomaker'
        },
        { 
          id: 3, 
          name: 'text', 
          label: 'Текст', 
          link: post.post_done_link_text || '', 
          required: post.post_needs_text,
          role: 'text'
        },
        { 
          id: 4, 
          name: 'photogallery', 
          label: 'Фотогалерея', 
          link: post.post_done_link_photogallery || '', 
          required: post.post_needs_photogallery,
          role: 'photographer'
        },
        { 
          id: 5, 
          name: 'cover_photo', 
          label: 'Фотообложка', 
          link: post.post_done_link_cover_photo || '', 
          required: post.post_needs_cover_photo,
          role: 'designer'
        },
        { 
          id: 6, 
          name: 'photo_cards', 
          label: 'Фотокарточки', 
          link: post.post_done_link_photo_cards || '', 
          required: post.post_needs_photo_cards,
          role: 'designer'
        },
      ];
      
      const requiredTasks = taskFields.filter(task => task.required);
      setTasks(requiredTasks);
    }
  }, [post]);

  const handleLinkChange = (id: number, value: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, link: value } : task
      )
    );
  };

  const handleSave = async () => {
    if (!post) return;

    setIsSaving(true);

    try {
      const linksData: Record<string, string> = {};
      tasks.forEach(task => {
        if (canEditTask(task.role)) {
          linksData[task.name] = task.link.trim();
        }
      });

      if (Object.keys(linksData).length === 0) {
        await onSuccess();
        onClose();
        return;
      }

      const response = await fetch('/api/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.post_id,
          links: linksData,
        }),
      });

      if (response.ok) {
        await onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPost = () => {
    setIsClosingDetails(true);
    setTimeout(() => {
      setShowEditModal(true);
    }, 100);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleSuccessEdit = async () => {
    await onSuccess();
    setShowEditModal(false);
    onClose();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Не указана';
    
    try {
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Ошибка даты';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    
    try {
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    
    try {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!post) {
    return null;
  }

  const hasEditableTasks = tasks.some(task => canEditTask(task.role));

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4"
          onClick={onClose}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] p-3 md:p-6 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3 md:mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-semibold text-gray-800 truncate pr-2" title={post.post_title}>
                  {post.post_title}
                </h2>
                <div className="flex items-center gap-2 mt-1 md:mt-2">
                  <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-100 text-blue-800 text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
                    {post.post_type}
                  </span>
                  <span className={`px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm font-medium rounded-full whitespace-nowrap ${getStatusColor(getPostStatus(post))}`}>
                    {getPostStatus(post)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 cursor-pointer shrink-0"
                aria-label="Закрыть"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
                <div className="lg:w-2/5 flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <h3 className="text-sm md:text-lg font-medium text-gray-700 mb-2">Описание</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="h-32 md:h-48 overflow-y-auto p-3 md:p-4">
                        <p className="text-xs md:text-base text-gray-600 whitespace-pre-line">
                          {post.post_description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Дедлайн</h4>
                        <div className="p-2 md:p-3 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-red-700">
                            {formatDate(post.post_deadline)}
                          </p>
                          <p className="text-xs text-red-500 mt-1 hidden md:block">
                            {formatTime(post.post_deadline)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Создан</h4>
                        <div className="p-2 md:p-3 bg-gray-50 border border-gray-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-gray-700">
                            {formatDate(post.post_date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 hidden md:block">
                            {formatTime(post.post_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {post.user && (
                      <div>
                        <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-1">Ответственный</h4>
                        <div className="p-2 md:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-xs md:text-sm font-medium text-blue-700 truncate">
                            {post.user.user_login}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:w-3/5 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm md:text-lg font-medium text-gray-700">Задачи</h3>
                    <span className="text-xs md:text-sm text-gray-500">
                      {tasks.length} {tasks.length === 1 ? 'задача' : 
                                     tasks.length >= 2 && tasks.length <= 4 ? 'задачи' : 'задач'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 max-h-[40vh] md:max-h-none overflow-y-auto pr-1">
                    {tasks.length > 0 ? (
                      tasks.map((task) => {
                        const originalLink = task.name === 'video_smm' ? post.post_done_link_video_smm :
                                           task.name === 'video_maker' ? post.post_done_link_video_maker :
                                           task.name === 'text' ? post.post_done_link_text :
                                           task.name === 'photogallery' ? post.post_done_link_photogallery :
                                           task.name === 'cover_photo' ? post.post_done_link_cover_photo :
                                           post.post_done_link_photo_cards;
                        
                        const hasLink = originalLink && originalLink.trim() !== '';
                        const userCanEdit = canEditTask(task.role);
                        
                        return (
                          <div 
                            key={task.id} 
                            className={`border rounded-lg p-4 transition-shadow ${
                              userCanEdit ? 'hover:shadow-md' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                              <div className="sm:w-1/4">
                                <h4 className="font-medium text-gray-800 text-base md:text-base flex items-center gap-1">
                                  {task.label}
                                  {!userCanEdit && !isAdminOrCoordinatorOrSmm && (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                  {isAdminOrCoordinatorOrSmm && userCanEdit && (
                                    <Lock className="w-4 h-4 text-purple-500" />
                                  )}
                                </h4>
                              </div>
                              <div className="sm:w-3/4">
                                {userCanEdit ? (
                                  <input
                                    type="text"
                                    value={task.link}
                                    onChange={(e) => handleLinkChange(task.id, e.target.value)}
                                    placeholder="Вставьте ссылку..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={isSaving}
                                  />
                                ) : (
                                  <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-base text-gray-500 truncate">
                                    {task.link || 'Нет доступа к редактированию'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t">
                              {hasLink ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs text-gray-500 shrink-0">Ссылка:</span>
                                    <p className="text-sm text-blue-600 truncate" title={originalLink || ''}>
                                      {originalLink}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => handleLinkClick(originalLink || '', e)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium shrink-0 ml-2 cursor-pointer"
                                    title="Открыть в новой вкладке"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Открыть
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                  <span>Задача ещё не выполнена</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 border rounded-lg bg-gray-50">
                        <p className="text-gray-500">Нет задач для этого поста</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {hasEditableTasks && (
              <div className="mt-4 pt-3 border-t flex items-center">
                {canEditPost ? (
                  <>
                    <button
                      onClick={handleEditPost}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Изменить пост
                    </button>
                    <div className="flex-1"></div>
                  </>
                ) : null}
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-6 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 ${
                    isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  } ${!canEditPost ? 'ml-auto' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Сохранить изменения
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditModal && post && (
        <EditPostWindow 
          post={post} 
          onClose={handleCloseEditModal} 
          onSuccess={handleSuccessEdit}
        />
      )}
    </>
  );
};