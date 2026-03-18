'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Lock, ExternalLink, Circle, CheckCircle, MessageSquare, Trash2, 
  Copy, Download 
} from 'lucide-react';
import { TASK_CONFIG, COMMENT_STATUS, TaskWithComments, CommentData } from './post_details_window';
import { useUser } from '../../hooks/use-roles';
import { FileUploader } from './file_uploader';
import { Gallery } from './gallery';
import styles from '../styles/PostDetailsRightPanel.module.css';

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
  onFilesSelected: (taskId: number, files: File[]) => void;
  onFilesCleared: (taskId: number) => void;
  onRemovePendingFile: (taskId: number, fileName: string) => void;
  onDeleteFile: (taskId: number, folderPath: string, filePath: string) => Promise<void>;
  pendingFiles: Record<number, File[]>;
  uploadingTasks: Record<number, boolean>;
  isSaving: boolean;
  isActionLoading: boolean;
}

const fileSupportTaskIds = [5, 6, 7]; // cover_photo, photo_cards, mini_gallery

const AutoResizeTextarea = ({ value, onChange, placeholder, disabled, className }: {
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

const CommentItem = ({ comment, onStatusChange, onDelete, userCanEdit }: {
  comment: CommentData;
  onStatusChange: (commentId: number, newStatus: string) => void;
  onDelete: (commentId: number) => Promise<void>;
  userCanEdit: boolean;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusClass = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.RED: return styles.commentRed;
      case COMMENT_STATUS.YELLOW: return styles.commentYellow;
      case COMMENT_STATUS.GREEN: return styles.commentGreen;
      default: return styles.commentGray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.RED: return <Circle className="w-3 h-3 text-red-500 fill-red-500" />;
      case COMMENT_STATUS.YELLOW: return <Circle className="w-3 h-3 text-yellow-500 fill-yellow-500" />;
      case COMMENT_STATUS.GREEN: return <CheckCircle className="w-3 h-3 text-green-500" />;
      default: return <Circle className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const canChangeStatus = () => (comment.status === COMMENT_STATUS.RED || comment.status === COMMENT_STATUS.YELLOW) && userCanEdit;

  const handleStatusClick = async () => {
    if (!canChangeStatus()) return;
    setIsUpdating(true);
    const newStatus = comment.status === COMMENT_STATUS.RED ? COMMENT_STATUS.YELLOW : COMMENT_STATUS.GREEN;
    try {
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
        <div className={styles.commentIcon}>{getStatusIcon(comment.status)}</div>
        <div className={styles.commentTextWrapper}>
          <p className={styles.commentText}>{comment.text}</p>
          <p className={styles.commentDate}>{formatCommentDate(comment.created_at)}</p>
        </div>
        <div className={styles.commentActions}>
          {canChangeStatus() && (
            <button
              onClick={handleStatusClick}
              disabled={isUpdating}
              className={styles.commentStatusButton}
              title={comment.status === COMMENT_STATUS.RED ? "Отметить как выполненное" : "Подтвердить"}
            >
              {isUpdating ? '...' : (comment.status === COMMENT_STATUS.RED ? "✓ Выполнено" : "✓ Подтвердить")}
            </button>
          )}
          {userCanEdit && (
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className={styles.commentDeleteButton}
              title="Удалить комментарий"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : 'https://' + trimmed;
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
  uploadingTasks,
  isSaving,
  isActionLoading
}: PostDetailsRightPanelProps) => {
  const { user, canAddComment } = useUser();
  const [addingCommentFor, setAddingCommentFor] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!url) return;
    try { window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer'); } catch { window.open(url, '_blank', 'noopener,noreferrer'); }
  };

  const handleAddCommentClick = async (taskId: number) => {
    setAddingCommentFor(taskId);
    setIsAdding(true);
    try { await onAddComment(taskId); } finally { setIsAdding(false); setAddingCommentFor(null); }
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
                    canEdit={userCanEdit}
                    multiple={task.id !== 5}
                    taskId={task.id}
                    taskLabel={task.label}
                    onFilesSelected={onFilesSelected}
                    onDelete={(taskId, filePath) => onDeleteFile(taskId, folderPath!, filePath)}
                    onRemovePendingFile={onRemovePendingFile}
                    uploading={uploadingTasks[task.id]}
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
                            <button
                              onClick={() => navigator.clipboard.writeText(task.link)}
                              className={styles.copyButton}
                              title="Копировать текст"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Скопировать</span>
                            </button>
                          )}
                        </div>
                        <div className={rowClass}>
                          <div className={styles.taskInputCol}>
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
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.taskHeader}>
                          <h4 className={styles.taskLabel}>
                            {task.label}
                            {!userCanEdit && <Lock className={styles.lockIcon} />}
                          </h4>
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

                        {hasLink && (
                          <div className={styles.linkBlock}>
                            <div className={styles.linkContainer}>
                              <div className={styles.linkInfo}>
                                <span className={styles.linkLabel}>Ссылка:</span>
                                <p className={styles.linkUrl} title={originalLink}>{originalLink}</p>
                              </div>
                              <button
                                onClick={e => handleLinkClick(originalLink, e)}
                                className={styles.linkButton}
                                title="Открыть в новой вкладке"
                              >
                                <ExternalLink className="w-4 h-4" /> Открыть
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {userCanAddComment && (
                  <div className={styles.addCommentSection}>
                    <div className={styles.addCommentRow}>
                      <MessageSquare className={styles.commentIconGray} />
                      <div className={styles.addCommentField}>
                        <AutoResizeTextarea
                          value={task.newCommentText}
                          onChange={e => onNewCommentChange(task.id, e.target.value)}
                          placeholder="Добавить комментарий..."
                          disabled={isSaving || isActionLoading || isAdding}
                        />
                        {task.newCommentText.trim() && (
                          <div className={styles.addCommentButtonWrapper}>
                            <button
                              onClick={() => handleAddCommentClick(task.id)}
                              disabled={isSaving || isActionLoading || isAdding}
                              className={styles.addCommentButton}
                            >
                              {isAdding && addingCommentFor === task.id ? 'Добавление...' : 'Добавить комментарий'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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
                        userCanEdit={userCanEdit}
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