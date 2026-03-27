'use client';

import { useRef, useEffect, useState } from 'react';
import {
  ExternalLink, Trash2, Copy,
  Check,
  CheckCheck
} from 'lucide-react';
import { COMMENT_STATUS, TaskWithComments } from '../post-details-window/post-details-window';
import type { Comment } from '@/types';
import { useUser } from '@/hooks/use-roles';
import { Gallery } from '../gallery/gallery';
import styles from './PostDetailsRightPanel.module.css';
import { ActionButton } from '../../ui/action-button/action-button';

interface PostData {
  post_id: number;
  [key: string]: unknown;
}

interface PostDetailsRightPanelProps {
  tasks: TaskWithComments[];
  post: PostData;
  canEditPostTask: (role: string) => boolean;
  onLinkChange: (id: number, value: string) => void;
  onNewCommentChange: (id: number, value: string) => void;
  onAddComment: (taskId: number) => Promise<void>;
  onCommentStatusChange: (commentId: number, newStatus: string) => void;
  onDeleteComment: (commentId: number) => Promise<void>;
  onFilesSelected: (taskId: number, files: File[]) => void | Promise<void>;
  onFilesCleared: (taskId: number) => void;
  onRemovePendingFile: (taskId: number, fileName: string) => void;
  onDeleteFile: (taskId: number, folderPath: string, filePath: string) => Promise<void>;
  pendingFiles: Record<number, File[]>;
  uploadingFilesByTask: Record<number, string[]>;
  isSaving: boolean;
  isActionLoading: boolean;
  isEditing: boolean;
}

const fileSupportTaskIds = [5, 6, 7];

const TASK_ICONS: Record<number, string> = {
  1: '/icons/mini_video_icon.svg',
  2: '/icons/video_icon.svg',
  3: '/icons/text_icon.svg',
  4: '/icons/photogallery_icon.svg',
  5: '/icons/coverphoto_icon.svg',
  6: '/icons/photocards_icon.svg',
  7: '/icons/mini_photogallery.svg',
};

const AutoResizeTextarea = ({
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.commentTextarea} ${className}`}
      rows={1}
    />
  );
};

const TaskTextarea = ({
  value,
  onChange,
  placeholder,
  disabled,
  className = '',
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styles.taskTextarea} ${className}`}
      rows={1}
    />
  );
};

const CommentItem = ({
  comment,
  onStatusChange,
  onDelete,
  canDelete,
  canChangeCommentStatus,
}: {
  comment: Comment;
  onStatusChange: (commentId: number, newStatus: string) => void;
  onDelete: (commentId: number) => Promise<void>;
  canDelete: boolean;
  canChangeCommentStatus: boolean;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusClass = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.NEW: return styles.commentRed;
      case COMMENT_STATUS.COMPLETED: return styles.commentYellow;
      case COMMENT_STATUS.CONFIRMED: return styles.commentGreen;
      default: return styles.commentGray;
    }
  };

  const canChangeStatus =
    canChangeCommentStatus &&
    (comment.status === COMMENT_STATUS.NEW || comment.status === COMMENT_STATUS.COMPLETED);

  const handleStatusClick = async () => {
    if (!canChangeStatus) return;
    setIsUpdating(true);

    try {
      const newStatus =
        comment.status === COMMENT_STATUS.NEW
          ? COMMENT_STATUS.COMPLETED
          : COMMENT_STATUS.CONFIRMED;

      await onStatusChange(comment.id, newStatus);
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Ошибка при удалении:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={getStatusClass(comment.status)}>
      <div className={styles.commentContent}>
        <div className={styles.commentTextWrapper}>
          <p className={styles.commentText}>{comment.text}</p>
        </div>
        <div className={styles.commentActions}>
          {canChangeStatus && (
            <ActionButton
              onClick={handleStatusClick}
              disabled={isUpdating}
              variant="base"
              icon={comment.status === COMMENT_STATUS.NEW ? Check : CheckCheck}
            >
              {isUpdating ? '...' : null}
            </ActionButton>
          )}
          {canDelete && (
            <ActionButton
              onClick={handleDeleteClick}
              disabled={isDeleting}
              variant="base"
              icon={Trash2}
            >
              <></>
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : 'https://' + trimmed;
};

export const PostDetailsRightPanel = ({
  tasks,
  post,
  canEditPostTask,
  onLinkChange,
  onNewCommentChange,
  onAddComment,
  onCommentStatusChange,
  onDeleteComment,
  onFilesSelected,
  onFilesCleared,
  onRemovePendingFile,
  onDeleteFile,
  pendingFiles,
  uploadingFilesByTask,
  isSaving,
  isEditing,
  isActionLoading
}: PostDetailsRightPanelProps) => {
  const { user, canAddComment, canDeleteComment } = useUser();
  const [addingCommentFor, setAddingCommentFor] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;

    try {
      window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddCommentClick = async (taskId: number) => {
    setAddingCommentFor(taskId);
    setIsAdding(true);

    try {
      await onAddComment(taskId);
    } finally {
      setIsAdding(false);
      setAddingCommentFor(null);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.taskList}>
        {tasks.length > 0 ? (
          tasks.map(task => {
            const originalLink = (post[task.linkKey] as string) || '';
            const hasLink = originalLink.trim() !== '';
            const userCanEdit = canEditPostTask(task.role);
            const userCanAddComment = canAddComment ? canAddComment(task.role) : userCanEdit;
            const userCanChangeCommentStatus = !!user && (canAddComment ? canAddComment(task.role) : userCanEdit);
            const supportsFiles = fileSupportTaskIds.includes(task.id);
            const rowClass = task.role === 'text' ? styles.taskRowTop : styles.taskRowCenter;

            const isTaskInteractionDisabled = isEditing || !userCanEdit || !user;
            const isCommentInteractionDisabled = isEditing || !userCanAddComment || !user;

            const folderPath = (() => {
              if (!task.link) return null;
              const match = task.link.match(/\/taskmanager\/(.+)/);
              return match ? match[1] : null;
            })();

            return (
              <div key={task.id} className={styles.taskCard}>
                {supportsFiles ? (
                  <Gallery
                    folderPath={folderPath}
                    canEdit={!isTaskInteractionDisabled}
                    multiple={task.id !== 5}
                    taskId={task.id}
                    taskLabel={task.label}
                    taskIcon={TASK_ICONS[task.id]}
                    onFilesSelected={onFilesSelected}
                    onDelete={(taskId, filePath) => onDeleteFile(taskId, folderPath!, filePath)}
                    onRemovePendingFile={onRemovePendingFile}
                    uploadingFileNames={uploadingFilesByTask[task.id] || []}
                    pendingFiles={pendingFiles[task.id] || []}
                    forceDisabled={isTaskInteractionDisabled}
                  />
                ) : (
                  <>
                    {task.role === 'text' ? (
                      <>
                        <div className={styles.taskHeader}>
                          <div className={styles.taskLabelWithIcon}>
                            {TASK_ICONS[task.id] && (
                              <img
                                src={TASK_ICONS[task.id]}
                                alt={task.label}
                                className={styles.taskIcon}
                              />
                            )}
                            <h4 className={styles.taskLabel}>
                              {task.label}
                            </h4>
                          </div>

                          {task.link && (
                            <ActionButton
                              onClick={() => navigator.clipboard.writeText(task.link)}
                              variant="base"
                              icon={Copy}
                            >
                              <span>Скопировать</span>
                            </ActionButton>
                          )}
                        </div>

                        <div className={rowClass}>
                          <TaskTextarea
                            value={task.link}
                            onChange={e => onLinkChange(task.id, e.target.value)}
                            placeholder="Введите текст задачи..."
                            disabled={isTaskInteractionDisabled || isSaving || isActionLoading}
                            className={isTaskInteractionDisabled ? styles.disabledLikeEdit : ''}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.taskHeader}>
                          <div className={styles.taskLabelWithIcon}>
                            {TASK_ICONS[task.id] && (
                              <img
                                src={TASK_ICONS[task.id]}
                                alt={task.label}
                                className={styles.taskIcon}
                              />
                            )}
                            <h4 className={styles.taskLabel}>
                              {task.label}
                            </h4>
                          </div>

                          {hasLink && (
                            <div className={styles.linkContainer}>
                              <ActionButton
                                onClick={e => handleLinkClick(originalLink, e)}
                                variant="base"
                                icon={ExternalLink}
                              >
                                Открыть
                              </ActionButton>
                            </div>
                          )}
                        </div>

                        <div className={rowClass}>
                          <div className={styles.taskInputCol}>
                            <input
                              type="text"
                              value={task.link}
                              onChange={e => onLinkChange(task.id, e.target.value)}
                              placeholder="Вставьте ссылку..."
                              className={`${styles.inputLink} ${isTaskInteractionDisabled ? styles.disabledLikeEdit : ''}`}
                              disabled={isTaskInteractionDisabled || isSaving || isActionLoading}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className={styles.addCommentField}>
                  <AutoResizeTextarea
                    value={task.newCommentText}
                    onChange={e => onNewCommentChange(task.id, e.target.value)}
                    placeholder="Добавить комментарий..."
                    disabled={isCommentInteractionDisabled || isSaving || isActionLoading || isAdding}
                    className={isCommentInteractionDisabled ? styles.disabledLikeEdit : ''}
                  />

                  {!isCommentInteractionDisabled && task.newCommentText.trim() && (
                    <div className={styles.addCommentButtonWrapper}>
                      <ActionButton
                        onClick={() => handleAddCommentClick(task.id)}
                        disabled={isSaving || isActionLoading || isAdding}
                        variant="fit"
                      >
                        {isAdding && addingCommentFor === task.id ? 'Отправка...' : 'Отправить'}
                      </ActionButton>
                    </div>
                  )}
                </div>

                {task.comments.length > 0 && (
                  <div className={styles.commentsSection}>
                    {task.comments.map(comment => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onStatusChange={onCommentStatusChange}
                        onDelete={onDeleteComment}
                        canDelete={!isEditing && canDeleteComment(comment)}
                        canChangeCommentStatus={!isEditing && userCanChangeCommentStatus}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>Нет задач для этого поста</p>
          </div>
        )}
      </div>
    </div>
  );
};