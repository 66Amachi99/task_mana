'use client';

import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../hooks/use-roles';
import { PostDetailsLeftPanel } from './post_details_left_panel';
import { PostDetailsRightPanel } from './post_details_right_panel';
import { usePost, useUpdatePost, usePatchPost, useDeletePost } from '@/hooks/usePosts';
import { useAddComment, useUpdateCommentStatus, useDeleteComment } from '@/hooks/usePosts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useGalleryStore } from '@/store/useGalleryStore';
import styles from '../styles/PostDetailsWindow.module.css';

export const TASK_CONFIG = [
  { id: 1, name: 'mini_video_smm', label: 'Мини-видео', needsKey: 'post_needs_mini_video_smm', linkKey: 'post_done_link_mini_video_smm', role: 'smm' },
  { id: 2, name: 'video', label: 'Видео', needsKey: 'post_needs_video', linkKey: 'post_done_link_video', role: 'photographer' },
  { id: 3, name: 'text', label: 'Текст', needsKey: 'post_needs_text', linkKey: 'post_done_link_text', role: 'text' },
  { id: 4, name: 'photogallery', label: 'Фотогалерея', needsKey: 'post_needs_photogallery', linkKey: 'post_done_link_photogallery', role: 'photographer' },
  { id: 5, name: 'cover_photo', label: 'Обложка', needsKey: 'post_needs_cover_photo', linkKey: 'post_done_link_cover_photo', role: 'designer' },
  { id: 6, name: 'photo_cards', label: 'Фотокарточки', needsKey: 'post_needs_photo_cards', linkKey: 'post_done_link_photo_cards', role: 'designer' },
  { id: 7, name: 'mini_gallery', label: 'Мини-фотогалерея', needsKey: 'post_needs_mini_gallery', linkKey: 'post_done_link_mini_gallery', role: 'smm' },
] as const;

export const SOCIAL_CONFIG = [
  { key: 'telegram', label: 'Telegram', icon: '/icons/telegram.svg', placeholder: 'https://t.me/...', publishedKey: 'telegram_published' },
  { key: 'vkontakte', label: 'VK', icon: '/icons/vk.svg', placeholder: 'https://vk.com/...', publishedKey: 'vkontakte_published' },
  { key: 'max', label: 'MAX', icon: '/icons/max.svg', placeholder: 'https://max.ru/...', publishedKey: 'MAX_published' },
] as const;

export const COMMENT_STATUS = {
  RED: '#FF4C4C33',
  YELLOW: '#FFD70033',
  GREEN: '#4CAF5033',
} as const;

export type SocialKey = typeof SOCIAL_CONFIG[number]['key'];
export type SocialLinks = Record<SocialKey, string>;

export interface CommentData {
  id: number;
  text: string;
  status: string;
  created_at: string;
  task_type_id?: number;
}

export interface TaskWithComments {
  id: number;
  name: string;
  label: string;
  link: string;
  required: boolean;
  role: string;
  linkKey: string;
  comments: CommentData[];
  newCommentText: string;
}

export interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

export interface PostData {
  post_id: number;
  post_title: string;
  post_description: string | null;
  tz_link?: string | null;
  post_status: string;
  is_published: boolean;
  telegram_published?: string | null;
  vkontakte_published?: string | null;
  MAX_published?: string | null;
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
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  tags?: Tag[];
  comments?: CommentData[];
  [key: string]: unknown;
}

export interface PostDetailsWindowProps {
  onClose: () => void;
  postId: number;
}

export const getCommentsForTask = (post: PostData | null, taskTypeId: number): CommentData[] => {
  if (!post || !post.comments) return [];
  return post.comments.filter(c => c.task_type_id === taskTypeId);
};

// Функция транслитерации кириллицы в латиницу
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  return text.split('').map(char => map[char] || char).join('');
}

// Функция для создания безопасного имени папки из названия поста
function slugifyPostTitle(title: string): string {
  return transliterate(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}

// Вспомогательная функция для загрузки файлов на Яндекс.Диск – возвращает информацию о загруженных файлах
async function uploadFilesToYandexDisk(files: File[], folderPath: string): Promise<Array<{ fileName: string; path: string }>> {
  const urlRes = await fetch('/api/disk/get-upload-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileNames: files.map(f => f.name),
      pathSuffix: folderPath,
    }),
  });
  if (!urlRes.ok) throw new Error('Не удалось получить URL для загрузки');
  const urlData = await urlRes.json();
  const uploadItems = urlData.results;

  const uploadPromises = files.map(async (file) => {
    const target = uploadItems.find((item: any) => item.fileName === file.name);
    if (!target) throw new Error(`Не найден URL для ${file.name}`);

    const uploadRes = await fetch(target.uploadUrl, {
      method: 'PUT',
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Ошибка загрузки ${file.name}`);
  });

  await Promise.all(uploadPromises);

  return files.map(file => ({
    fileName: file.name,
    path: `/taskmanager/${folderPath}/${file.name}`,
  }));
}

export const PostDetailsWindow = ({ onClose, postId }: PostDetailsWindowProps) => {
  const { user, canEditPostTask, canApprove, canPublish } = useUser();
  const { data: fetchedPost, isLoading } = usePost(postId);

  const post = useMemo(() => {
    if (!fetchedPost) return null;
    return {
      ...fetchedPost,
      post_date: fetchedPost.post_date ? new Date(fetchedPost.post_date) : null,
      post_deadline: new Date(fetchedPost.post_deadline),
    };
  }, [fetchedPost]);

  const [tasks, setTasks] = useState<TaskWithComments[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskWithComments[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ telegram: '', vkontakte: '', max: '' });
  const [originalSocialLinks, setOriginalSocialLinks] = useState<SocialLinks>({ telegram: '', vkontakte: '', max: '' });
  const [editedDeadline, setEditedDeadline] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTzLink, setEditedTzLink] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<boolean[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isClosingDetails, setIsClosingDetails] = useState(false);
  const [isOpening, setIsOpening] = useState(true);

  const [pendingFiles, setPendingFiles] = useState<Record<number, File[]>>({});
  const [uploadingTasks, setUploadingTasks] = useState<Record<number, boolean>>({});

  const [localIsPublished, setLocalIsPublished] = useState(post?.is_published || false);
  const [localApprovedBy, setLocalApprovedBy] = useState(post?.approved_by || null);
  const [localSocialLinks, setLocalSocialLinks] = useState<SocialLinks>({
    telegram: post?.telegram_published || '',
    vkontakte: post?.vkontakte_published || '',
    max: post?.MAX_published || '',
  });

  const canEditPost = !!(user && (user.admin_role || user.SMM_role));
  const canDelete = !!(user && (user.admin_role || user.SMM_role));
  const canManageSocial = !!(user && (user.admin_role || user.SMM_role));

  const updatePost = useUpdatePost();
  const patchPost = usePatchPost();
  const deletePost = useDeletePost();
  const addComment = useAddComment();
  const updateCommentStatus = useUpdateCommentStatus();
  const deleteComment = useDeleteComment();

  // Zustand
  const removeImageFromCache = useGalleryStore((state) => state.removeImageFromCache);
  const setImagesToCache = useGalleryStore((state) => state.setImagesToCache);

  useLayoutEffect(() => {
    if (!post) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [post]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) setIsTagDropdownOpen(false);
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setShowDatePicker(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        setAvailableTags(data);
      } catch (error) { console.error('Ошибка загрузки тегов:', error); }
    };
    fetchTags();
  }, []);

  useLayoutEffect(() => {
    if (!post) return;

    const tasksWithComments = TASK_CONFIG
      .filter(cfg => post[cfg.needsKey] as boolean)
      .map(cfg => ({
        id: cfg.id,
        name: cfg.name,
        label: cfg.label,
        link: ((post[cfg.linkKey] as string) || '').toString(),
        required: true,
        role: cfg.role,
        linkKey: cfg.linkKey,
        comments: [...getCommentsForTask(post, cfg.id)].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        newCommentText: '',
      }));

    const social = {
      telegram: post.telegram_published || '',
      vkontakte: post.vkontakte_published || '',
      max: post.MAX_published || '',
    };

    const taskSelection = TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false);

    setTasks(tasksWithComments);
    setOriginalTasks(tasksWithComments.map(t => ({ ...t, comments: [...t.comments] })));
    setSocialLinks(social);
    setOriginalSocialLinks({ ...social });
    setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
    setEditedTitle(post.post_title || '');
    setEditedDescription(post.post_description || '');
    setEditedTzLink(post.tz_link || '');
    setSelectedTasks(taskSelection);
    setSelectedTags(post.tags || []);
    setLocalIsPublished(post.is_published);
    setLocalApprovedBy(post.approved_by || null);
    setLocalSocialLinks(social);
  }, [post]);

  useEffect(() => {
    if (!isEditing || !post) return;

    setTasks(prevTasks => {
      const newTasks = TASK_CONFIG
        .filter(cfg => selectedTasks[cfg.id - 1])
        .map(cfg => {
          const existing = prevTasks.find(t => t.id === cfg.id);
          if (existing) {
            return existing;
          } else {
            return {
              id: cfg.id,
              name: cfg.name,
              label: cfg.label,
              link: '',
              required: true,
              role: cfg.role,
              linkKey: cfg.linkKey,
              comments: [],
              newCommentText: '',
            };
          }
        });
      return newTasks;
    });
  }, [selectedTasks, isEditing, post]);

  const handleFilesSelected = useCallback((taskId: number, files: File[]) => {
    setPendingFiles(prev => {
      const isMultiple = taskId !== 5;
      if (!isMultiple) {
        return { ...prev, [taskId]: files };
      } else {
        const current = prev[taskId] || [];
        return { ...prev, [taskId]: [...current, ...files] };
      }
    });
  }, []);

  const handleFilesCleared = useCallback((taskId: number) => {
    setPendingFiles(prev => {
      const newState = { ...prev };
      delete newState[taskId];
      return newState;
    });
  }, []);

  const handleRemovePendingFile = useCallback((taskId: number, fileName: string) => {
    setPendingFiles(prev => {
      const current = prev[taskId] || [];
      const filtered = current.filter(f => f.name !== fileName);
      if (filtered.length === 0) {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      }
      return { ...prev, [taskId]: filtered };
    });
  }, []);

  // Обновлённый handleDeleteFile: принимает folderPath и filePath, удаляет на сервере и из стора
  const handleDeleteFile = useCallback(async (taskId: number, folderPath: string, filePath: string) => {
    if (!post) return;
    try {
      const res = await fetch('/api/disk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      if (!res.ok) throw new Error('Ошибка удаления');

      removeImageFromCache(folderPath, filePath);
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      alert('Не удалось удалить файл');
    }
  }, [post, removeImageFromCache]);

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
    !selectedTags.find(t => t.tag_id === tag.tag_id)
  );

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.find(t => t.tag_id === tag.tag_id)) setSelectedTags([...selectedTags, tag]);
    setTagSearchQuery('');
    setIsTagDropdownOpen(false);
  };
  const handleTagRemove = (tagId: number) => setSelectedTags(selectedTags.filter(t => t.tag_id !== tagId));
  const handleCreateTag = async () => {
    if (!tagSearchQuery.trim()) return;
    try {
      const response = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tagSearchQuery }) });
      if (response.ok) {
        const newTag = await response.json();
        setAvailableTags([...availableTags, newTag]);
        setSelectedTags([...selectedTags, newTag]);
        setTagSearchQuery('');
        setIsTagDropdownOpen(false);
      }
    } catch (error) { console.error('Ошибка создания тега:', error); }
  };
  const handleTaskToggle = (taskId: number) => setSelectedTasks(prev => {
    const newSelection = [...prev];
    newSelection[taskId - 1] = !newSelection[taskId - 1];
    return newSelection;
  });
  const handleDeadlineChange = (newDate: Date) => setEditedDeadline(newDate);
  const handleEditStart = () => setIsEditing(true);
  const handleEditCancel = () => {
    setIsEditing(false);
    setTasks(originalTasks.map(t => ({ ...t, comments: [...t.comments] })));
    setSelectedTasks(TASK_CONFIG.map(cfg => (post?.[cfg.needsKey] as boolean) || false));
    setSelectedTags(post?.tags || []);
    setEditedTitle(post?.post_title || '');
    setEditedDescription(post?.post_description || '');
    setEditedTzLink(post?.tz_link || '');
    setEditedDeadline(post?.post_deadline ? new Date(post.post_deadline) : null);
  };

  const handleSave = async () => {
    if (!post) return;
    setIsSaving(true);
    try {
      const updateData: any = {
        post_title: editedTitle,
        post_description: editedDescription || null,
        tz_link: editedTzLink || null,
        post_deadline: editedDeadline ? editedDeadline.toISOString() : null,
      };
      TASK_CONFIG.forEach(cfg => { updateData[cfg.needsKey] = selectedTasks[cfg.id - 1] || false; });
      updateData.tag_ids = selectedTags.map(t => t.tag_id);

      await updatePost.mutateAsync({ postId: post.post_id, data: updateData });
      
      setOriginalTasks(tasks.map(t => ({ ...t, comments: [...t.comments] })));
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
      alert(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const getPostFolderPath = (): string => {
    if (!post) return '';
    const dateStr = format(post.post_deadline, 'dd.MM.yyyy', { locale: ru });
    const slug = slugifyPostTitle(post.post_title);
    return `posts/${dateStr}_${slug}_${post.post_id}`;
  };

  const uploadPendingFiles = async (): Promise<Record<number, Array<{ fileName: string; path: string }>>> => {
    const results: Record<number, Array<{ fileName: string; path: string }>> = {};
    const fileSupportTaskIds = [5, 6, 7];

    const uploading = Object.keys(pendingFiles).reduce((acc, taskIdStr) => {
      acc[Number(taskIdStr)] = true;
      return acc;
    }, {} as Record<number, boolean>);
    setUploadingTasks(uploading);

    try {
      for (const [taskIdStr, files] of Object.entries(pendingFiles)) {
        const taskId = Number(taskIdStr);
        if (!fileSupportTaskIds.includes(taskId)) continue;

        const task = TASK_CONFIG.find(t => t.id === taskId);
        if (!task) continue;

        const baseFolder = getPostFolderPath();
        const folderPath = `${baseFolder}/${task.name}`;
        try {
          const uploadedFiles = await uploadFilesToYandexDisk(files, folderPath);
          results[taskId] = uploadedFiles;
        } catch (error) {
          console.error(`Ошибка загрузки файлов для задачи ${taskId}:`, error);
          throw error;
        } finally {
          setUploadingTasks(prev => {
            const newState = { ...prev };
            delete newState[taskId];
            return newState;
          });
        }
      }
    } finally {
      setUploadingTasks({});
    }
    return results;
  };

  const handleSaveChanges = async () => {
    if (!post) return;
    setIsSaving(true);
    try {
      const uploadedFilesMap = await uploadPendingFiles();

      // После загрузки обновляем кеш для каждой папки
      const baseFolder = getPostFolderPath();
      const tasksToUpdate = Object.keys(uploadedFilesMap).map(Number);
      await Promise.all(tasksToUpdate.map(async (taskId) => {
        const task = TASK_CONFIG.find(t => t.id === taskId);
        if (!task) return;
        const folderPath = `${baseFolder}/${task.name}`;
        try {
          const res = await fetch('/api/disk/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: folderPath }),
          });
          const data = await res.json();
          if (data.result) {
            setImagesToCache(folderPath, data.result);
          }
        } catch (error) {
          console.error(`Ошибка обновления кеша для папки ${folderPath}:`, error);
        }
      }));

      // Обновляем tasks (пути к папкам)
      const updatedTasks = tasks.map(task => {
        if (uploadedFilesMap[task.id]) {
          return { ...task, link: `/taskmanager/${baseFolder}/${task.name}` };
        }
        return task;
      });
      setTasks(updatedTasks);

      const data: Record<string, any> = {};
      for (const t of updatedTasks) data[t.linkKey] = t.link?.trim() ? t.link.trim() : null;
      data.telegram_published = socialLinks.telegram?.trim() || null;
      data.vkontakte_published = socialLinks.vkontakte?.trim() || null;
      data.MAX_published = socialLinks.max?.trim() || null;
      if (editedDeadline) data.post_deadline = editedDeadline.toISOString();

      await updatePost.mutateAsync({ postId: post.post_id, data });

      setPendingFiles({});
      setOriginalTasks(updatedTasks.map(t => ({ ...t, comments: [...t.comments] })));
      setOriginalSocialLinks({ ...socialLinks });
    } catch (e) {
      console.error('Ошибка:', e);
      alert(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (action: string, confirmMsg?: string) => {
    if (!post) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setIsActionLoading(true);
    try {
      if (action === 'delete') {
        await deletePost.mutateAsync(post.post_id);
        onClose();
      } else {
        const result = await patchPost.mutateAsync({ postId: post.post_id, action });
        if (result?.post) {
          const updatedPost = result.post;
          setLocalIsPublished(updatedPost.is_published);
          setLocalApprovedBy(updatedPost.approved_by || null);
          setLocalSocialLinks({
            telegram: updatedPost.telegram_published || '',
            vkontakte: updatedPost.vkontakte_published || '',
            max: updatedPost.MAX_published || '',
          });
          setSocialLinks({
            telegram: updatedPost.telegram_published || '',
            vkontakte: updatedPost.vkontakte_published || '',
            max: updatedPost.MAX_published || '',
          });
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error instanceof Error ? error.message : 'Ошибка');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = () => handleAction('approve');
  const handleUnapprove = () => handleAction('unapprove');
  const handlePublishToggle = () => handleAction(localIsPublished ? 'unpublish' : 'publish');

  const handleLinkChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, link: value } : t)));
  }, []);

  const handleNewCommentChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, newCommentText: value } : t)));
  }, []);

  const handleAddComment = useCallback(async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.newCommentText.trim() || !post) return;

    try {
      const newComment = await addComment.mutateAsync({
        postId: post.post_id,
        taskTypeId: taskId,
        text: task.newCommentText,
      });

      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [newComment, ...t.comments],
          newCommentText: '',
        };
      }));
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      alert('Не удалось добавить комментарий');
    }
  }, [tasks, post, addComment]);

  const handleCommentStatusChange = useCallback(async (commentId: number, newStatus: string) => {
    try {
      await updateCommentStatus.mutateAsync({ commentId, status: newStatus });
      
      setTasks(prev => prev.map(t => ({
        ...t,
        comments: t.comments.map(c => (c.id === commentId ? { ...c, status: newStatus } : c)),
      })));
    } catch (error) {
      console.error('Ошибка при обновлении статуса комментария:', error);
    }
  }, [updateCommentStatus]);

  const handleDeleteComment = useCallback(async (commentId: number) => {
    try {
      await deleteComment.mutateAsync(commentId);
      
      setTasks(prev => prev.map(task => ({
        ...task,
        comments: task.comments.filter(c => c.id !== commentId),
      })));
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
      alert('Не удалось удалить комментарий');
    }
  }, [deleteComment]);

  const handleSocialLinkChange = useCallback((social: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [social]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setIsClosingDetails(true);
    setTimeout(() => {
      onClose();
      setIsClosingDetails(false);
      setIsOpening(true);
    }, 200);
  }, [onClose]);

  if (!post || isLoading) return null;

  const hasChanges =
    tasks.some((task, i) => {
      const original = originalTasks[i];
      if (!original) return true;
      if (task.link !== original.link) return true;
      return false;
    }) ||
    (Object.keys(socialLinks) as SocialKey[]).some(key => socialLinks[key] !== originalSocialLinks[key]) ||
    (!!editedDeadline && new Date(post.post_deadline).getTime() !== editedDeadline.getTime()) ||
    Object.keys(pendingFiles).length > 0;

  const canShowApprove = !!(canApprove && !localApprovedBy && TASK_CONFIG.every(cfg => !post[cfg.needsKey] || (post[cfg.linkKey] as string)?.trim()));

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div className={`${styles.overlay} ${styles.overlayVisible}`} onClick={handleClose}>
          <div className={`${styles.container} ${isOpening ? styles.containerOpening : styles.containerClosing}`} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.headerSpacer} />
              <button onClick={handleClose} className={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.content}>
              <div className={`${styles.leftPanel} no-scrollbar`}>
                <PostDetailsLeftPanel
                  post={post}
                  socialLinks={socialLinks}
                  onSocialLinkChange={handleSocialLinkChange}
                  canManageSocial={canManageSocial}
                  isSaving={isSaving}
                  isActionLoading={isActionLoading}
                  isEditing={isEditing}
                  onEditStart={handleEditStart}
                  onEditCancel={handleEditCancel}
                  onSave={handleSave}
                  editedTitle={editedTitle}
                  onTitleChange={setEditedTitle}
                  editedDescription={editedDescription}
                  onDescriptionChange={setEditedDescription}
                  editedTzLink={editedTzLink}
                  onTzLinkChange={setEditedTzLink}
                  selectedTasks={selectedTasks}
                  onTaskToggle={handleTaskToggle}
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onTagSelect={handleTagSelect}
                  onTagRemove={handleTagRemove}
                  onTagSearchChange={setTagSearchQuery}
                  tagSearchQuery={tagSearchQuery}
                  onTagCreate={handleCreateTag}
                  filteredTags={filteredTags}
                  showTagDropdown={isTagDropdownOpen}
                  setShowTagDropdown={setIsTagDropdownOpen}
                  tagDropdownRef={tagDropdownRef}
                  deadlineValue={editedDeadline ?? new Date(post.post_deadline)}
                  onDeadlineChange={handleDeadlineChange}
                  showDatePicker={showDatePicker}
                  setShowDatePicker={setShowDatePicker}
                  datePickerRef={datePickerRef}
                  onApprove={handleApprove}
                  onUnapprove={handleUnapprove}
                  onPublishToggle={handlePublishToggle}
                  onDelete={() => handleAction('delete', 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')}
                  canApprove={!!(canApprove && !localApprovedBy) && canShowApprove}
                  canUnapprove={!!(canApprove && localApprovedBy)}
                  canPublish={!!canPublish}
                  canDelete={canDelete}
                  canEditPost={canEditPost}
                  onSaveChanges={handleSaveChanges}
                  hasChanges={hasChanges}
                  isPublished={localIsPublished}
                  approvedBy={localApprovedBy}
                  localSocialLinks={localSocialLinks}
                />
              </div>
              <div className={`${styles.rightPanel} no-scrollbar`}>
                <PostDetailsRightPanel
                  tasks={tasks}
                  post={post}
                  canEditPostTask={canEditPostTask}
                  onLinkChange={handleLinkChange}
                  onNewCommentChange={handleNewCommentChange}
                  onAddComment={handleAddComment}
                  onCommentStatusChange={handleCommentStatusChange}
                  onDeleteComment={handleDeleteComment}
                  onFilesSelected={handleFilesSelected}
                  onFilesCleared={handleFilesCleared}
                  onRemovePendingFile={handleRemovePendingFile}
                  onDeleteFile={handleDeleteFile}
                  pendingFiles={pendingFiles}
                  uploadingTasks={uploadingTasks}
                  isSaving={isSaving}
                  isActionLoading={isActionLoading}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};