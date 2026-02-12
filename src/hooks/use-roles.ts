'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useCallback } from 'react';

interface User {
  id: number;
  login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  videomaker_role: boolean;
  coordinator_role: boolean;
}

export function useUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      const userData = session.user as any;
      
      setUser({
        id: parseInt(userData.id) || 0,
        login: userData.user_login || '',
        admin_role: userData.admin_role || false,
        SMM_role: userData.SMM_role || false,
        designer_role: userData.designer_role || false,
        videomaker_role: userData.videomaker_role || false,
        coordinator_role: userData.coordinator_role || false,
      });
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status]);

  // Хелперы для проверки ролей
  const isDesigner = useMemo(() => user?.designer_role === true, [user?.designer_role]);
  const isVideomaker = useMemo(() => user?.videomaker_role === true, [user?.videomaker_role]);
  const isSmm = useMemo(() => user?.SMM_role === true, [user?.SMM_role]);
  const isCoordinator = useMemo(() => user?.coordinator_role === true, [user?.coordinator_role]);
  const isAdmin = useMemo(() => user?.admin_role === true, [user?.admin_role]);
  const isAdminOrCoordinator = useMemo(() => isAdmin || isCoordinator, [isAdmin, isCoordinator]);

  // Какие задачи видит пользователь при фильтрации "Мои задачи"
  const getUserTaskFields = useCallback(() => {
    if (isAdminOrCoordinator) {
      return []; // Админ и координатор видят ВСЕ посты, фильтр не применяется
    }
    if (isDesigner) {
      return ['post_needs_cover_photo', 'post_needs_photo_cards', 'post_needs_photogallery'];
    }
    if (isVideomaker) {
      return ['post_needs_video_maker'];
    }
    if (isSmm) {
      return ['post_needs_video_smm'];
    }
    return []; // Нет доступа
  }, [isAdminOrCoordinator, isDesigner, isVideomaker, isSmm]);

  // Проверка, есть ли в посте задачи ДЛЯ ФИЛЬТРАЦИИ (текст не учитываем!)
  const hasAccessToPost = useCallback((post: any) => {
    if (isAdminOrCoordinator) return true;
    
    const userTaskFields = getUserTaskFields();
    if (userTaskFields.length === 0) return false;
    
    return userTaskFields.some(field => {
      switch (field) {
        case 'post_needs_cover_photo': return post.post_needs_cover_photo;
        case 'post_needs_photo_cards': return post.post_needs_photo_cards;
        case 'post_needs_photogallery': return post.post_needs_photogallery;
        case 'post_needs_video_maker': return post.post_needs_video_maker;
        case 'post_needs_video_smm': return post.post_needs_video_smm;
        default: return false;
      }
    });
  }, [isAdminOrCoordinator, getUserTaskFields]);

  // Проверка, может ли пользователь редактировать задачу (текст могут все!)
  const canEditTask = useCallback((taskRole: string) => {
    if (!user) return false;
    if (isAdminOrCoordinator) return true;
    
    // Текст могут редактировать ВСЕ
    if (taskRole === 'text') return true;
    
    // Остальные задачи - только по ролям
    switch (taskRole) {
      case 'designer':
        return isDesigner;
      case 'videomaker':
        return isVideomaker;
      case 'smm':
        return isSmm;
      default:
        return false;
    }
  }, [user, isAdminOrCoordinator, isDesigner, isVideomaker, isSmm]);

  return { 
    user, 
    loading,
    // Роли
    isDesigner,
    isVideomaker,
    isSmm,
    isCoordinator,
    isAdmin,
    isAdminOrCoordinator,
    // Хелперы
    getUserTaskFields,
    hasAccessToPost,
    canEditTask
  };
}