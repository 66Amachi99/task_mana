'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../hooks/use-roles';
import { PostDetailsLeftPanel } from './post_details_left_panel';
import { PostDetailsRightPanel } from './post_details_right_panel';
import styles from '../styles/PostDetailsWindow.module.css';

// Конфигурация задач (без изменений)
export const TASK_CONFIG = [
  { id: 1, name: 'mini_video_smm', label: 'Мини-видео для SMM', needsKey: 'post_needs_mini_video_smm', linkKey: 'post_done_link_mini_video_smm', role: 'smm' },
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
  post: PostData | null;
  onSuccess: () => Promise<void>;
}

export const getCommentsForTask = (post: PostData | null, taskTypeId: number): CommentData[] => {
  if (!post || !post.comments) return [];
  return post.comments.filter(c => c.task_type_id === taskTypeId);
};

export const PostDetailsWindow = ({ onClose, post, onSuccess }: PostDetailsWindowProps) => {
  const { user, canEditPostTask, canApprove, canPublish } = useUser();

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

  const canEditPost = !!(user && (user.admin_role || user.SMM_role));
  const canDelete = !!(user && (user.admin_role || user.SMM_role));
  const canManageSocial = !!(user && (user.admin_role || user.SMM_role));

  useEffect(() => {
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

  useEffect(() => {
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
        comments: getCommentsForTask(post, cfg.id),
        newCommentText: '',
      }));
    setTasks(tasksWithComments);
    setOriginalTasks(tasksWithComments.map(t => ({ ...t, comments: [...t.comments] })));

    const social = {
      telegram: post.telegram_published || '',
      vkontakte: post.vkontakte_published || '',
      max: post.MAX_published || '',
    };
    setSocialLinks(social);
    setOriginalSocialLinks({ ...social });

    setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
    setEditedTitle(post.post_title || '');
    setEditedDescription(post.post_description || '');
    setEditedTzLink(post.tz_link || '');
    const taskSelection = TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false);
    setSelectedTasks(taskSelection);
    setSelectedTags(post.tags || []);
  }, [post]);

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
    if (post) {
      setEditedTitle(post.post_title || '');
      setEditedDescription(post.post_description || '');
      setEditedTzLink(post.tz_link || '');
      setEditedDeadline(post.post_deadline ? new Date(post.post_deadline) : null);
      setSelectedTasks(TASK_CONFIG.map(cfg => (post[cfg.needsKey] as boolean) || false));
      setSelectedTags(post.tags || []);
    }
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
      const response = await fetch('/api/posts/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.post_id, data: updateData }),
      });
      if (response.ok) {
        await refreshPostData();
        await onSuccess();
        onClose(); // <-- Закрываем модалку после сохранения
        setIsEditing(false);
      } else {
        const err = await response.json().catch(() => null);
        alert(err?.error || 'Ошибка сохранения');
      }
    } catch (error) { console.error('❌ Ошибка при сохранении:', error); } finally { setIsSaving(false); }
  };

  const refreshPostData = useCallback(async () => {
    if (!post?.post_id) return;
    try {
      const response = await fetch(`/api/posts?id=${post.post_id}`);
      if (response.ok) {
        const data = await response.json();
        const updatedPost = data.posts[0];
        if (updatedPost) {
          const updatedTasks = TASK_CONFIG
            .filter(cfg => updatedPost[cfg.needsKey] as boolean)
            .map(cfg => ({
              id: cfg.id,
              name: cfg.name,
              label: cfg.label,
              link: (updatedPost[cfg.linkKey] as string) || '',
              required: true,
              role: cfg.role,
              linkKey: cfg.linkKey,
              comments: getCommentsForTask(updatedPost, cfg.id),
              newCommentText: '',
            }));
          setTasks(updatedTasks);
          setOriginalTasks(updatedTasks.map(t => ({ ...t, comments: [...t.comments] })));
          setSocialLinks({
            telegram: updatedPost.telegram_published || '',
            vkontakte: updatedPost.vkontakte_published || '',
            max: updatedPost.MAX_published || '',
          });
          setOriginalSocialLinks({ ...socialLinks });
          setEditedDeadline(updatedPost.post_deadline ? new Date(updatedPost.post_deadline) : null);
        }
      }
    } catch (error) { console.error('Ошибка при обновлении данных:', error); }
  }, [post?.post_id]);

  const handleLinkChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, link: value } : t)));
  }, []);
  const handleNewCommentChange = useCallback((id: number, value: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, newCommentText: value } : t)));
  }, []);
  const handleCommentStatusChange = useCallback((commentId: number, newStatus: string) => {
    setTasks(prev => prev.map(t => ({
      ...t,
      comments: t.comments.map(c => (c.id === commentId ? { ...c, status: newStatus } : c)),
    })));
  }, []);

  const handleAddComment = useCallback(async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.newCommentText.trim()) return;

    try {
      const response = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post?.post_id,
          taskTypeId: taskId,
          text: task.newCommentText,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при добавлении комментария');
      }

      const newComment = await response.json();

      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          comments: [...t.comments, { ...newComment, id: newComment.id }],
          newCommentText: '',
        };
      }));

    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      alert('Не удалось добавить комментарий');
    }
  }, [tasks, post?.post_id]);

  const handleSocialLinkChange = useCallback((social: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [social]: value }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!post) return;
    setIsSaving(true);
    try {
      const data: Record<string, any> = {};
      for (const t of tasks) data[t.linkKey] = t.link?.trim() ? t.link.trim() : null;
      data.telegram_published = socialLinks.telegram?.trim() || null;
      data.vkontakte_published = socialLinks.vkontakte?.trim() || null;
      data.MAX_published = socialLinks.max?.trim() || null;
      if (editedDeadline) data.post_deadline = editedDeadline.toISOString();
      const res = await fetch('/api/posts/update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.post_id, data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Ошибка сохранения');
        return;
      }
      await refreshPostData();
      await onSuccess();
      onClose(); // <-- Закрываем модалку после сохранения
    } catch (e) { console.error('Ошибка:', e); } finally { setIsSaving(false); }
  }, [post, tasks, socialLinks, editedDeadline, refreshPostData, onSuccess, onClose]);

  const handleAction = useCallback(async (action: string, confirmMsg?: string) => {
    if (!post) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setIsActionLoading(true);
    try {
      const isDelete = action === 'delete';
      const response = await fetch(
        isDelete ? `/api/posts/delete?id=${post.post_id}` : '/api/posts/update',
        isDelete
          ? { method: 'DELETE' }
          : { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.post_id, action }) }
      );
      if (response.ok) {
        if (action !== 'delete') {
          await refreshPostData();
          await onSuccess();
        } else {
          await onSuccess();
          onClose();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка');
      }
    } catch (error) { console.error('Ошибка:', error); } finally { setIsActionLoading(false); }
  }, [post, onSuccess, onClose, refreshPostData]);

  if (!post) return null;

  const hasChanges =
    tasks.some((task, i) => {
      const original = originalTasks[i];
      if (!original) return true;
      if (task.link !== original.link) return true;
      if (task.comments.length !== original.comments.length) return true;
      for (let j = 0; j < task.comments.length; j++) {
        if (task.comments[j].status !== original.comments[j]?.status) return true;
      }
      return false;
    }) ||
    (Object.keys(socialLinks) as SocialKey[]).some(key => socialLinks[key] !== originalSocialLinks[key]) ||
    (!!editedDeadline && new Date(post.post_deadline).getTime() !== editedDeadline.getTime());

  const canShowApprove = !!(canApprove && !post.approved_by && TASK_CONFIG.every(cfg => !post[cfg.needsKey] || (post[cfg.linkKey] as string)?.trim()));

  return (
    <>
      {!showEditModal && !isClosingDetails && (
        <div className={styles.overlay} onClick={onClose}>
          <div className={styles.container} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <div className={styles.headerSpacer} />
              <button onClick={onClose} className={styles.closeButton}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.content}>
              <div className={styles.leftPanel}>
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
                  onApprove={() => handleAction('approve')}
                  onPublishToggle={() => handleAction(post.is_published ? 'unpublish' : 'publish')}
                  onDelete={() => handleAction('delete', 'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.')}
                  canApprove={!!(canApprove && !post.approved_by) && canShowApprove}
                  canPublish={!!canPublish}
                  canDelete={canDelete}
                  canEditPost={canEditPost}
                  onSaveChanges={handleSaveChanges}
                  hasChanges={hasChanges}
                />
              </div>
              <div className={styles.rightPanel}>
                <PostDetailsRightPanel
                  tasks={tasks}
                  post={post}
                  canEditPostTask={canEditPostTask}
                  onLinkChange={handleLinkChange}
                  onNewCommentChange={handleNewCommentChange}
                  onAddComment={handleAddComment}
                  onCommentStatusChange={handleCommentStatusChange}
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