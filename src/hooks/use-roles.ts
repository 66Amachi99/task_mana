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
  photographer_role: boolean;
}

export interface TaskFilter {
  id: string;
  label: string;
  field: string;
  role?: string;
}

export const AVAILABLE_TASKS: TaskFilter[] = [
  { id: 'video_smm', label: 'Видео для SMM', field: 'post_needs_video_smm', role: 'smm' },
  { id: 'video_maker', label: 'Видео для видеомейкера', field: 'post_needs_video_maker', role: 'videomaker' },
  { id: 'cover_photo', label: 'Обложка', field: 'post_needs_cover_photo', role: 'designer' },
  { id: 'photo_cards', label: 'Фотокарточки', field: 'post_needs_photo_cards', role: 'designer' },
  { id: 'photogallery', label: 'Фотогалерея', field: 'post_needs_photogallery', role: 'photographer' },
];

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
        photographer_role: userData.photographer_role || false,
      });
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status]);

  const isDesigner = useMemo(() => user?.designer_role === true, [user?.designer_role]);
  const isVideomaker = useMemo(() => user?.videomaker_role === true, [user?.videomaker_role]);
  const isSmm = useMemo(() => user?.SMM_role === true, [user?.SMM_role]);
  const isCoordinator = useMemo(() => user?.coordinator_role === true, [user?.coordinator_role]);
  const isAdmin = useMemo(() => user?.admin_role === true, [user?.admin_role]);
  const isPhotographer = useMemo(() => user?.photographer_role === true, [user?.photographer_role]);
  
  const isAdminOrCoordinatorOrSmm = useMemo(() => isAdmin || isCoordinator || isSmm, [isAdmin, isCoordinator, isSmm]);

  const getAvailableFilters = useCallback((): TaskFilter[] => {
    return AVAILABLE_TASKS;
  }, []);

  const filterPostByTask = useCallback((post: any, taskField: string): boolean => {
    switch (taskField) {
      case 'post_needs_video_smm':
        return post.post_needs_video_smm === true;
      case 'post_needs_video_maker':
        return post.post_needs_video_maker === true;
      case 'post_needs_cover_photo':
        return post.post_needs_cover_photo === true;
      case 'post_needs_photo_cards':
        return post.post_needs_photo_cards === true;
      case 'post_needs_photogallery':
        return post.post_needs_photogallery === true;
      default:
        return false;
    }
  }, []);

  const canEditTask = useCallback((taskRole: string): boolean => {
    if (!user) return false;
    
    if (isAdminOrCoordinatorOrSmm) return true;
    
    if (taskRole === 'text') return true;
    
    switch (taskRole) {
      case 'designer':
        return isDesigner;
      case 'videomaker':
        return isVideomaker;
      case 'smm':
        return isSmm;
      case 'photographer':
        return isPhotographer;
      default:
        return false;
    }
  }, [user, isAdminOrCoordinatorOrSmm, isDesigner, isVideomaker, isSmm, isPhotographer]);

  return { 
    user, 
    loading,
    isDesigner,
    isVideomaker,
    isSmm,
    isCoordinator,
    isAdmin,
    isPhotographer,
    isAdminOrCoordinatorOrSmm,
    getAvailableFilters,
    filterPostByTask,
    canEditTask
  };
}