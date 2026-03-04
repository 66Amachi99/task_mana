'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useCallback } from 'react';

export interface User {
  id: number;
  login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
}

export interface RoleFilter {
  id: string;
  label: string;
  icon?: string;
  tasks: {
    field: string;
    label: string;
  }[];
}

export const ROLE_FILTERS: RoleFilter[] = [
  { 
    id: 'smm', 
    label: 'SMM',
    tasks: [
      { field: 'post_needs_mini_video_smm', label: 'Мини-видео для SMM' },
      { field: 'post_needs_mini_gallery', label: 'Мини-фотогалерея' }
    ]
  },
  { 
    id: 'photographer', 
    label: 'Фотограф',
    tasks: [
      { field: 'post_needs_video', label: 'Видео' },
      { field: 'post_needs_photogallery', label: 'Фотогалерея' }
    ]
  },
  { 
    id: 'designer', 
    label: 'Дизайнер',
    tasks: [
      { field: 'post_needs_cover_photo', label: 'Обложка' },
      { field: 'post_needs_photo_cards', label: 'Фотокарточки' }
    ]
  },
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
        coordinator_role: userData.coordinator_role || false,
        photographer_role: userData.photographer_role || false,
      });
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status]);

  const isDesigner = useMemo(() => user?.designer_role === true, [user?.designer_role]);
  const isSmm = useMemo(() => user?.SMM_role === true, [user?.SMM_role]);
  const isCoordinator = useMemo(() => user?.coordinator_role === true, [user?.coordinator_role]);
  const isAdmin = useMemo(() => user?.admin_role === true, [user?.admin_role]);
  const isPhotographer = useMemo(() => user?.photographer_role === true, [user?.photographer_role]);
  
  const canApprove = useMemo(() => isAdmin || isCoordinator, [isAdmin, isCoordinator]);
  const canPublish = useMemo(() => isAdmin || isSmm, [isAdmin, isSmm]);
  
  const isAdminOrCoordinatorOrSmm = useMemo(() => isAdmin || isCoordinator || isSmm, [isAdmin, isCoordinator, isSmm]);

  // Проверки для задач
  const canCreateTask = useMemo(() => isAdmin || isSmm, [isAdmin, isSmm]);
  const canViewAllTasks = useMemo(() => isAdmin || isSmm, [isAdmin, isSmm]);
  
  const canEditTask = useCallback((task: any, currentUserId?: number) => {
    if (!user) return false;
    if (isAdmin || isSmm) return true;
    
    // Проверяем, является ли пользователь исполнителем задачи
    if (task.assignees && task.assignees.length > 0) {
      return task.assignees[0]?.user_id === user.id;
    }
    
    return false;
  }, [user, isAdmin, isSmm]);

  const canViewTask = useCallback((task: any) => {
    if (!user) return false;
    if (isAdmin || isSmm) return true;
    
    // Пользователь видит только задачи, где он исполнитель
    if (task.assignees && task.assignees.length > 0) {
      return task.assignees[0]?.user_id === user.id;
    }
    
    return false;
  }, [user, isAdmin, isSmm]);

  const getRoleFilters = useCallback((): RoleFilter[] => {
    return ROLE_FILTERS;
  }, []);

  const filterPostByRole = useCallback((post: any, roleId: string): boolean => {
    const roleFilter = ROLE_FILTERS.find(r => r.id === roleId);
    if (!roleFilter) return false;
    
    return roleFilter.tasks.some(task => post[task.field] === true);
  }, []);

  const canEditPostTask = useCallback((taskRole: string): boolean => {
    if (!user) return false;
    
    if (isAdminOrCoordinatorOrSmm) return true;
    
    if (taskRole === 'text') return true;
    
    switch (taskRole) {
      case 'designer':
        return isDesigner;
      case 'smm':
        return isSmm;
      case 'photographer':
        return isPhotographer;
      default:
        return false;
    }
  }, [user, isAdminOrCoordinatorOrSmm, isDesigner, isSmm, isPhotographer]);

  return { 
    user, 
    loading,
    isDesigner,
    isSmm,
    isCoordinator,
    isAdmin,
    isPhotographer,
    isAdminOrCoordinatorOrSmm,
    canApprove,
    canPublish,
    canCreateTask,
    canViewAllTasks,
    canEditTask,
    canViewTask,
    getRoleFilters,
    filterPostByRole,
    canEditPostTask
  };
}