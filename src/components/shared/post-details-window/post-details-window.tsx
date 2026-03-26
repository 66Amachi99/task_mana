'use client';

import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useUser } from '@/hooks/use-roles';
import { PostDetailsLeftPanel } from '../post-details-left-panel/post-details-left-panel';
import { PostDetailsRightPanel } from '../post-details-right-panel/post-details-right-panel';
import { usePost, useUpdatePost, useSilentUpdatePost, usePatchPost, useDeletePost } from '@/hooks/usePosts';
import { useAddComment, useUpdateCommentStatus, useDeleteComment } from '@/hooks/usePosts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useGalleryStore } from '@/store/useGalleryStore';
import styles from './PostDetailsWindow.module.css';

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
  NEW: 'new',
  COMPLETED: 'completed',
  CONFIRMED: 'confirmed',
} as const;

const FILE_SUPPORT_TASK_IDS = [5, 6, 7];

export type SocialKey = typeof SOCIAL_CONFIG[number]['key'];
export type SocialLinks = Record<SocialKey, string>;

export interface CommentData {
  id: number;
  text: string;
  status: string;
  created_at: string;
  task_type_id?: number;
  created_by_id: number;
  created_by?: {
    user_id: number;
    user_login: string;
  } | null;
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

const EMPTY_SOCIAL: SocialLinks = { telegram: '', vkontakte: '', max: '' };

export const getCommentsForTask = (post: PostData | null, taskTypeId: number): CommentData[] => {
  if (!post?.comments) return [];
  return post.comments.filter(c => c.task_type_id === taskTypeId);
};

function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'E','Ж':'Zh',
    'З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O',
    'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts',
    'Ч':'Ch','Ш':'Sh','Щ':'Sch','Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
  };
  return text.split('').map(c => map[c] || c).join('');
}

function slugifyPostTitle(title: string): string {
  return transliterate(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '_');
}

function buildFolderPath(title: string, deadline: Date, postId: number): string {
  const dateStr = format(deadline, 'dd.MM.yyyy', { locale: ru });
  return `posts/${dateStr}_${slugifyPostTitle(title)}_${postId}`;
}

function extractSocialLinks(post: PostData): SocialLinks {
  return {
    telegram: post.telegram_published || '',
    vkontakte: post.vkontakte_published || '',
    max: post.MAX_published || '',
  };
}

function buildTasksFromPost(post: PostData): TaskWithComments[] {
  return TASK_CONFIG
    .filter(cfg => post[cfg.needsKey] as boolean)
    .map(cfg => ({
      id: cfg.id,
      name: cfg.name,
      label: cfg.label,
      link: ((post[cfg.linkKey] as string) || '').toString(),
      required: true,
      role: cfg.role,
      linkKey: cfg.linkKey,
      comments: [...getCommentsForTask(post, cfg.id)].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      newCommentText: '',
    }));
}

function cloneTasks(tasks: TaskWithComments[]): TaskWithComments[] {
  return tasks.map(t => ({ ...t, comments: [...t.comments] }));
}

async function uploadFilesToYandexDisk(
  files: File[],
  folderPath: string,
): Promise<Array<{ fileName: string; path: string }>> {
  const urlRes = await fetch('/api/disk/get-upload-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileNames: files.map(f => f.name), pathSuffix: folderPath }),
  });

  if (!urlRes.ok) {
    const errorData = await urlRes.json().catch(() => null);
    throw new Error(errorData?.error || 'Не удалось получить URL для загрузки');
  }

  const { results: uploadItems } = await urlRes.json();

  await Promise.all(
    files.map(async file => {
      const target = uploadItems.find((item: any) => item.fileName === file.name);
      if (!target) throw new Error(`Не найден URL для ${file.name}`);
      const res = await fetch(target.uploadUrl, { method: 'PUT', body: file });
      if (!res.ok) throw new Error(`Ошибка загрузки ${file.name}`);
    }),
  );

  return files.map(file => ({
    fileName: file.name,
    path: `/taskmanager/${folderPath}/${file.name}`,
  }));
}

async function renameFolderOnDisk(oldPath: string, newPath: string): Promise<boolean> {
  if (oldPath === newPath) return false;

  const res = await fetch('/api/disk/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromPath: `/taskmanager/${oldPath}`,
      toPath: `/taskmanager/${newPath}`,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Ошибка переименования папки');
  }

  return (await res.json()).moved === true;
}

export const PostDetailsWindow = ({ onClose, postId }: PostDetailsWindowProps) => {
  const { user, canEditPostTask, canApprove, canPublish } = useUser();
  const { data: fetchedPost, isLoading } = usePost(postId);

  const post = useMemo<PostData | null>(() => {
    if (!fetchedPost) return null;
    return {
      ...fetchedPost,
      post_date: fetchedPost.post_date ? new Date(fetchedPost.post_date) : null,
      post_deadline: new Date(fetchedPost.post_deadline),
    };
  }, [fetchedPost]);

  const [tasks, setTasks] = useState<TaskWithComments[]>([]);
  const [originalTasks, setOriginalTasks] = useState<TaskWithComments[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(EMPTY_SOCIAL);
  const [originalSocialLinks, setOriginalSocialLinks] = useState<SocialLinks>(EMPTY_SOCIAL);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Record<number, File[]>>({});
  const [uploadingFilesByTask, setUploadingFilesByTask] = useState<Record<number, string[]>>({});

  const [localIsPublished, setLocalIsPublished] = useState(false);
  const [localApprovedBy, setLocalApprovedBy] = useState<{ user_login: string } | null>(null);
  const [localSocialLinks, setLocalSocialLinks] = useState<SocialLinks>(EMPTY_SOCIAL);

  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const overlayPointerDownRef = useRef(false);
  const initializedPostIdRef = useRef<number | null>(null);

  const isAdminOrSMM = !!(user?.admin_role || user?.SMM_role);

  const updatePost = useUpdatePost();
  const silentUpdatePost = useSilentUpdatePost();
  const patchPost = usePatchPost();
  const deletePostMut = useDeletePost();
  const addCommentMut = useAddComment();
  const updateCommentStatusMut = useUpdateCommentStatus();
  const deleteCommentMut = useDeleteComment();

  const removeImageFromCache = useGalleryStore(s => s.removeImageFromCache);
  const setImagesToCache = useGalleryStore(s => s.setImagesToCache);
  const renameCacheKey = useGalleryStore(s => s.renameCacheKey);

  useLayoutEffect(() => {
    if (!post) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [post]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(target)) setIsTagDropdownOpen(false);
      if (datePickerRef.current && !datePickerRef.current.contains(target)) setShowDatePicker(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    fetch('/api/tags')
      .then(r => r.json())
      .then(setAvailableTags)
      .catch(e => console.error('Ошибка загрузки тегов:', e));
  }, []);

  useLayoutEffect(() => {
    if (!post) return;

    const tasksFromPost = buildTasksFromPost(post);
    const social = extractSocialLinks(post);
    const isFirstInitForThisPost = initializedPostIdRef.current !== post.post_id;

    setLocalIsPublished(post.is_published);
    setLocalApprovedBy(post.approved_by || null);
    setLocalSocialLinks(social);

    if (isFirstInitForThisPost) {
      initializedPostIdRef.current = post.post_id;

      setTasks(tasksFromPost);
      setOriginalTasks(cloneTasks(tasksFromPost));
      setSocialLinks(social);
      setOriginalSocialLinks({ ...social });
      setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
      setEditedTitle(post.post_title || '');
      setEditedDescription(post.post_description || '');
      setEditedTzLink(post.tz_link || '');
      setSelectedTasks(TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false));
      setSelectedTags(post.tags || []);
      return;
    }

    if (!isEditing) {
      setTasks(tasksFromPost);
      setOriginalTasks(cloneTasks(tasksFromPost));
      setSocialLinks(social);
      setOriginalSocialLinks({ ...social });
      setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
      setEditedTitle(post.post_title || '');
      setEditedDescription(post.post_description || '');
      setEditedTzLink(post.tz_link || '');
      setSelectedTasks(TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false));
      setSelectedTags(post.tags || []);
      return;
    }

    setOriginalTasks(cloneTasks(tasksFromPost));
  }, [post, isEditing]);

  const filteredTags = useMemo(
    () =>
      availableTags.filter(
        tag =>
          tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
          !selectedTags.some(t => t.tag_id === tag.tag_id),
      ),
    [availableTags, tagSearchQuery, selectedTags],
  );

  const hasChanges = useMemo(() => {
    if (!post) return false;

    return (
      tasks.some((task, i) => {
        if ((uploadingFilesByTask[task.id] || []).length > 0) return false;
        const original = originalTasks[i];
        return !original || task.link !== original.link;
      }) ||
      (Object.keys(socialLinks) as SocialKey[]).some(k => socialLinks[k] !== originalSocialLinks[k]) ||
      (!!editedDeadline && new Date(post.post_deadline).getTime() !== editedDeadline.getTime())
    );
  }, [tasks, originalTasks, socialLinks, originalSocialLinks, editedDeadline, post, uploadingFilesByTask]);

  const canShowApprove = useMemo(() => {
    if (!canApprove || localApprovedBy || !post) return false;
    return TASK_CONFIG.every(cfg => !post[cfg.needsKey] || (post[cfg.linkKey] as string)?.trim());
  }, [canApprove, localApprovedBy, post]);

  const handleFilesSelected = useCallback(async (taskId: number, files: File[]) => {
    if (!post || files.length === 0) return;

    const task = TASK_CONFIG.find(t => t.id === taskId);
    if (!task || !FILE_SUPPORT_TASK_IDS.includes(taskId)) return;

    const isMultiple = taskId !== 5;
    const fileNames = files.map(f => f.name);

    setPendingFiles(prev => ({
      ...prev,
      [taskId]: isMultiple ? [...(prev[taskId] || []), ...files] : files,
    }));

    setUploadingFilesByTask(prev => ({
      ...prev,
      [taskId]: [...new Set([...(prev[taskId] || []), ...fileNames])],
    }));

    try {
      const baseFolder = buildFolderPath(
        editedTitle || post.post_title,
        editedDeadline || post.post_deadline,
        post.post_id,
      );

      await uploadFilesToYandexDisk(files, `${baseFolder}/${task.name}`);

      const folderPath = `${baseFolder}/${task.name}`;

      const res = await fetch('/api/disk/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });

      const data = await res.json();
      if (data.result) {
        setImagesToCache(folderPath, data.result);
      }

      const taskLink = `/taskmanager/${folderPath}`;

      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, link: taskLink } : t)),
      );

      setOriginalTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, link: taskLink } : t)),
      );

      await silentUpdatePost.mutateAsync({
        postId: post.post_id,
        data: {
          [task.linkKey]: taskLink,
        },
      });

      setPendingFiles(prev => {
        const current = prev[taskId] || [];
        const remaining = current.filter(f => !fileNames.includes(f.name));

        if (remaining.length === 0) {
          const { [taskId]: _, ...rest } = prev;
          return rest;
        }

        return { ...prev, [taskId]: remaining };
      });
    } catch (error) {
      console.error(`Ошибка загрузки файлов для задачи ${taskId}:`, error);
      alert(error instanceof Error ? error.message : 'Ошибка загрузки файлов');

      setPendingFiles(prev => {
        const current = prev[taskId] || [];
        const remaining = current.filter(f => !fileNames.includes(f.name));

        if (remaining.length === 0) {
          const { [taskId]: _, ...rest } = prev;
          return rest;
        }

        return { ...prev, [taskId]: remaining };
      });
    } finally {
      setUploadingFilesByTask(prev => {
        const current = prev[taskId] || [];
        const remaining = current.filter(name => !fileNames.includes(name));

        if (remaining.length === 0) {
          const { [taskId]: _, ...rest } = prev;
          return rest;
        }

        return { ...prev, [taskId]: remaining };
      });
    }
  }, [
    post,
    editedTitle,
    editedDeadline,
    setImagesToCache,
    silentUpdatePost,
  ]);

  const handleFilesCleared = useCallback((taskId: number) => {
    setPendingFiles(prev => {
      const { [taskId]: _, ...rest } = prev;
      return rest;
    });

    setUploadingFilesByTask(prev => {
      const { [taskId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleRemovePendingFile = useCallback((taskId: number, fileName: string) => {
    setPendingFiles(prev => {
      const filtered = (prev[taskId] || []).filter(f => f.name !== fileName);

      if (filtered.length === 0) {
        const { [taskId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [taskId]: filtered };
    });
  }, []);

  const handleDeleteFile = useCallback(
    async (_taskId: number, folderPath: string, filePath: string) => {
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
    },
    [post, removeImageFromCache],
  );

  const handleTagSelect = useCallback((tag: Tag) => {
    setSelectedTags(prev => (prev.some(t => t.tag_id === tag.tag_id) ? prev : [...prev, tag]));
    setTagSearchQuery('');
    setIsTagDropdownOpen(false);
  }, []);

  const handleTagRemove = useCallback((tagId: number) => {
    setSelectedTags(prev => prev.filter(t => t.tag_id !== tagId));
  }, []);

  const handleCreateTag = useCallback(async () => {
    const name = tagSearchQuery.trim();
    if (!name) return;

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const newTag = await res.json();
        setAvailableTags(prev => [...prev, newTag]);
        setSelectedTags(prev => [...prev, newTag]);
        setTagSearchQuery('');
        setIsTagDropdownOpen(false);
      }
    } catch (error) {
      console.error('Ошибка создания тега:', error);
    }
  }, [tagSearchQuery]);

  const handleTaskToggle = useCallback((taskId: number) => {
    setSelectedTasks(prev => {
      const next = [...prev];
      next[taskId - 1] = !next[taskId - 1];
      return next;
    });
  }, []);

  const handleEditStart = useCallback(() => setIsEditing(true), []);

  const handleEditCancel = useCallback(() => {
    if (!post) return;
    setIsEditing(false);
    setTasks(cloneTasks(originalTasks));
    setSelectedTasks(TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false));
    setSelectedTags(post.tags || []);
    setEditedTitle(post.post_title || '');
    setEditedDescription(post.post_description || '');
    setEditedTzLink(post.tz_link || '');
    setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
  }, [post, originalTasks]);

  const handleSave = useCallback(async () => {
    if (!post) return;
    setIsSaving(true);

    try {
      const oldFolder = buildFolderPath(post.post_title, post.post_deadline, post.post_id);
      const newDeadline = editedDeadline || post.post_deadline;
      const newFolder = buildFolderPath(editedTitle, newDeadline, post.post_id);
      const folderRenamed = oldFolder !== newFolder;

      if (folderRenamed) {
        await renameFolderOnDisk(oldFolder, newFolder);

        TASK_CONFIG
          .filter(t => FILE_SUPPORT_TASK_IDS.includes(t.id))
          .forEach(task => {
            renameCacheKey(`${oldFolder}/${task.name}`, `${newFolder}/${task.name}`);
          });
      }

      const finalTasks = folderRenamed
        ? tasks.map(task =>
            FILE_SUPPORT_TASK_IDS.includes(task.id) && task.link
              ? { ...task, link: `/taskmanager/${newFolder}/${task.name}` }
              : task,
          )
        : tasks;

      if (folderRenamed) setTasks(finalTasks);

      const updateData: Record<string, any> = {
        post_title: editedTitle,
        post_description: editedDescription || null,
        tz_link: editedTzLink || null,
        post_deadline: editedDeadline?.toISOString() || null,
        tag_ids: selectedTags.map(t => t.tag_id),
      };

      TASK_CONFIG.forEach(cfg => {
        updateData[cfg.needsKey] = selectedTasks[cfg.id - 1] || false;
      });

      if (folderRenamed) {
        TASK_CONFIG
          .filter(t => FILE_SUPPORT_TASK_IDS.includes(t.id))
          .forEach(cfg => {
            if ((post[cfg.linkKey] as string)?.trim()) {
              updateData[cfg.linkKey] = `/taskmanager/${newFolder}/${cfg.name}`;
            }
          });
      }

      await updatePost.mutateAsync({ postId: post.post_id, data: updateData });
      setOriginalTasks(cloneTasks(finalTasks));
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Ошибка при сохранении:', error);
      alert(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  }, [
    post,
    editedTitle,
    editedDescription,
    editedTzLink,
    editedDeadline,
    selectedTasks,
    selectedTags,
    tasks,
    updatePost,
    renameCacheKey,
  ]);

  const handleSaveChanges = useCallback(async () => {
    if (!post) return;
    setIsSaving(true);

    try {
      const data: Record<string, any> = {};

      for (const t of tasks) data[t.linkKey] = t.link?.trim() || null;
      data.telegram_published = socialLinks.telegram?.trim() || null;
      data.vkontakte_published = socialLinks.vkontakte?.trim() || null;
      data.MAX_published = socialLinks.max?.trim() || null;

      if (editedDeadline) data.post_deadline = editedDeadline.toISOString();

      await updatePost.mutateAsync({ postId: post.post_id, data });

      setOriginalTasks(cloneTasks(tasks));
      setOriginalSocialLinks({ ...socialLinks });
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  }, [post, tasks, socialLinks, editedDeadline, updatePost]);

  const handleAction = useCallback(
    async (action: string, confirmMsg?: string) => {
      if (!post) return;
      if (confirmMsg && !window.confirm(confirmMsg)) return;

      setIsActionLoading(true);

      try {
        if (action === 'delete') {
          await deletePostMut.mutateAsync(post.post_id);
          onClose();
          return;
        }

        const result = await patchPost.mutateAsync({ postId: post.post_id, action });

        if (result?.post) {
          const updatedPost = result.post;
          setLocalIsPublished(updatedPost.is_published);
          setLocalApprovedBy(updatedPost.approved_by || null);

          const newSocial: SocialLinks = {
            telegram: updatedPost.telegram_published || '',
            vkontakte: updatedPost.vkontakte_published || '',
            max: updatedPost.MAX_published || '',
          };

          setLocalSocialLinks(newSocial);
          setSocialLinks(newSocial);
        }
      } catch (error) {
        console.error('Ошибка:', error);
        alert(error instanceof Error ? error.message : 'Ошибка');
      } finally {
        setIsActionLoading(false);
      }
    },
    [post, deletePostMut, patchPost, onClose],
  );

  const handleApprove = useCallback(() => handleAction('approve'), [handleAction]);
  const handleUnapprove = useCallback(() => handleAction('unapprove'), [handleAction]);
  const handlePublishToggle = useCallback(
    () => handleAction(localIsPublished ? 'unpublish' : 'publish'),
    [handleAction, localIsPublished],
  );
  const handleDelete = useCallback(
    () => handleAction('delete', 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.'),
    [handleAction],
  );

  const handleLinkChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, link: value } : t)));
  }, []);

  const handleNewCommentChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, newCommentText: value } : t)));
  }, []);

  const handleAddComment = useCallback(
    async (taskId: number) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task?.newCommentText.trim() || !post) return;

      try {
        const newComment = await addCommentMut.mutateAsync({
          postId: post.post_id,
          taskTypeId: taskId,
          text: task.newCommentText,
        });

        setTasks(prev =>
          prev.map(t =>
            t.id === taskId ? { ...t, comments: [newComment, ...t.comments], newCommentText: '' } : t,
          ),
        );
      } catch (error) {
        console.error('Ошибка при добавлении комментария:', error);
        alert('Не удалось добавить комментарий');
      }
    },
    [tasks, post, addCommentMut],
  );

  const handleCommentStatusChange = useCallback(
    async (commentId: number, newStatus: string) => {
      try {
        await updateCommentStatusMut.mutateAsync({ commentId, status: newStatus });
        setTasks(prev =>
          prev.map(t => ({
            ...t,
            comments: t.comments.map(c => (c.id === commentId ? { ...c, status: newStatus } : c)),
          })),
        );
      } catch (error) {
        console.error('Ошибка при обновлении статуса комментария:', error);
      }
    },
    [updateCommentStatusMut],
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      try {
        await deleteCommentMut.mutateAsync(commentId);
        setTasks(prev =>
          prev.map(task => ({ ...task, comments: task.comments.filter(c => c.id !== commentId) })),
        );
      } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        alert('Не удалось удалить комментарий');
      }
    },
    [deleteCommentMut],
  );

  const handleSocialLinkChange = useCallback((social: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [social]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  if (!post || isLoading) return null;

  return (
    <div
      className={`${styles.overlay} ${styles.overlayVisible}`}
      onPointerDown={(e) => {
        overlayPointerDownRef.current = e.target === e.currentTarget;
      }}
      onPointerUp={(e) => {
        const shouldClose =
          overlayPointerDownRef.current && e.target === e.currentTarget;

        overlayPointerDownRef.current = false;

        if (shouldClose) {
          handleClose();
        }
      }}
      onPointerCancel={() => {
        overlayPointerDownRef.current = false;
      }}
    >
      <div
        className={`${styles.container} ${isClosing ? styles.containerClosing : styles.containerOpening}`}
        onClick={e => e.stopPropagation()}
        onPointerDown={() => {
          overlayPointerDownRef.current = false;
        }}
      >
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
              canManageSocial={isAdminOrSMM}
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
              onDeadlineChange={setEditedDeadline}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              datePickerRef={datePickerRef}
              onApprove={handleApprove}
              onUnapprove={handleUnapprove}
              onPublishToggle={handlePublishToggle}
              onDelete={handleDelete}
              canApprove={canShowApprove}
              canUnapprove={!!(canApprove && localApprovedBy)}
              canPublish={!!canPublish}
              canDelete={isAdminOrSMM}
              canEditPost={isAdminOrSMM}
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
              uploadingFilesByTask={uploadingFilesByTask}
              isSaving={isSaving}
              isActionLoading={isActionLoading}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};