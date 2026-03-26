'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Lock, ExternalLink, Trash2, Copy
} from 'lucide-react';
import { COMMENT_STATUS, TaskWithComments, CommentData } from '../post-details-window/post-details-window';
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

const AutoResizeTextarea = ({ value, onChange, placeholder, disabled }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
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
      className={styles.commentTextarea}
      rows={1}
    />
  );
};

const TaskTextarea = ({ value, onChange, placeholder, disabled }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
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
      className={styles.taskTextarea}
      rows={1}
    />
  );
};

const CommentItem = ({ comment, onStatusChange, onDelete, canDelete }: {
  comment: CommentData;
  onStatusChange: (commentId: number, newStatus: string) => void;
  onDelete: (commentId: number) => Promise<void>;
  canDelete: boolean;
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

  const canChangeStatus = comment.status === COMMENT_STATUS.NEW || comment.status === COMMENT_STATUS.COMPLETED;

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
            >
              {isUpdating ? '...' : (comment.status === COMMENT_STATUS.NEW ? '✓ Выполнено' : '✓ Подтвердить')}
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
  const { canAddComment, canDeleteComment } = useUser();
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
            const supportsFiles = fileSupportTaskIds.includes(task.id);
            const rowClass = task.role === 'text' ? styles.taskRowTop : styles.taskRowCenter;

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
                    canEdit={userCanEdit && !isEditing}
                    multiple={task.id !== 5}
                    taskId={task.id}
                    taskLabel={task.label}
                    onFilesSelected={onFilesSelected}
                    onDelete={(taskId, filePath) => onDeleteFile(taskId, folderPath!, filePath)}
                    onRemovePendingFile={onRemovePendingFile}
                    uploadingFileNames={uploadingFilesByTask[task.id] || []}
                    pendingFiles={pendingFiles[task.id] || []}
                  />
                ) : (
                  <>
                    {task.role === 'text' ? (
                      <>
                        <div className={styles.taskHeader}>
                          <h4 className={styles.taskLabel}>
                            {task.label}
                            {!userCanEdit && <Lock className={styles.lockIcon} />}
                          </h4>

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
                          {userCanEdit ? (
                            <TaskTextarea
                              value={task.link}
                              onChange={e => onLinkChange(task.id, e.target.value)}
                              placeholder="Введите текст задачи..."
                              disabled={isSaving || isActionLoading}
                            />
                          ) : (
                            <div className={styles.viewOnlyField}>
                              {task.link || 'Нет доступа к редактированию'}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.taskHeader}>
                          <h4 className={styles.taskLabel}>
                            {task.label}
                            {!userCanEdit && <Lock className={styles.lockIcon} />}
                          </h4>

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
                            {userCanEdit ? (
                              <input
                                type="text"
                                value={task.link}
                                onChange={e => onLinkChange(task.id, e.target.value)}
                                placeholder="Вставьте ссылку..."
                                className={styles.inputLink}
                                disabled={isSaving || isActionLoading}
                              />
                            ) : (
                              <div className={styles.viewOnlyField}>
                                {task.link || 'Нет доступа к редактированию'}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {userCanAddComment && (
                  <div className={styles.addCommentField}>
                    <AutoResizeTextarea
                      value={task.newCommentText}
                      onChange={e => onNewCommentChange(task.id, e.target.value)}
                      placeholder="Добавить комментарий..."
                      disabled={isSaving || isActionLoading || isAdding}
                    />

                    {task.newCommentText.trim() && (
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
                )}

                {task.comments.length > 0 && (
                  <div className={styles.commentsSection}>
                    {task.comments.map(comment => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onStatusChange={onCommentStatusChange}
                        onDelete={onDeleteComment}
                        canDelete={canDeleteComment(comment)}
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