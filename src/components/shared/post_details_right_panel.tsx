'use client';

import { useRef, useEffect, useState } from 'react';
import { Lock, ExternalLink, Circle, CheckCircle, MessageSquare } from 'lucide-react';
import { TASK_CONFIG, COMMENT_STATUS, TaskWithComments, CommentData } from './post_details_window';
import { useUser } from '../../hooks/use-roles';
import styles from '../styles/PostDetailsRightPanel.module.css';

interface PostData {
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
  isSaving: boolean;
  isActionLoading: boolean;
}

// Маленький textarea для комментариев
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

// Большой textarea для текстовой задачи
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

const CommentItem = ({ comment, onStatusChange, userCanEdit }: {
  comment: CommentData;
  onStatusChange: (commentId: number, newStatus: string) => void;
  userCanEdit: boolean;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

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
      const response = await fetch('/api/posts/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, status: newStatus }),
      });
      if (response.ok) onStatusChange(comment.id, newStatus);
    } catch (error) { console.error('Ошибка:', error); } finally { setIsUpdating(false); }
  };

  return (
    <div className={getStatusClass(comment.status)}>
      <div className={styles.commentContent}>
        <div className={styles.commentIcon}>{getStatusIcon(comment.status)}</div>
        <div className={styles.commentTextWrapper}>
          <p className={styles.commentText}>{comment.text}</p>
          <p className={styles.commentDate}>{formatCommentDate(comment.created_at)}</p>
        </div>
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
      </div>
    </div>
  );
};

const pluralizeTasks = (count: number): string => {
  if (count === 1) return 'задача';
  if (count >= 2 && count <= 4) return 'задачи';
  return 'задач';
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

            const rowClass = task.role === 'text' ? styles.taskRowTop : styles.taskRowCenter;

            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={rowClass}>
                  <div className={styles.taskLabelCol}>
                    <h4 className={styles.taskLabel}>
                      {task.label}
                      {!userCanEdit && <Lock className={styles.lockIcon} />}
                    </h4>
                  </div>
                  <div className={styles.taskInputCol}>
                    {userCanEdit ? (
                      task.role === 'text' ? (
                        <TaskTextarea
                          value={task.link}
                          onChange={e => onLinkChange(task.id, e.target.value)}
                          placeholder="Введите текст задачи..."
                          disabled={isSaving || isActionLoading}
                        />
                      ) : (
                        <input
                          type="text"
                          value={task.link}
                          onChange={e => onLinkChange(task.id, e.target.value)}
                          placeholder="Вставьте ссылку..."
                          className={styles.inputLink}
                          disabled={isSaving || isActionLoading}
                        />
                      )
                    ) : (
                      <div className={styles.viewOnlyField}>
                        {task.link || 'Нет доступа к редактированию'}
                      </div>
                    )}
                  </div>
                </div>

                {hasLink && task.role !== 'text' && (
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

                {task.comments.length > 0 && (
                  <div className={styles.commentsSection}>
                    {task.comments.map(comment => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onStatusChange={onCommentStatusChange}
                        userCanEdit={userCanEdit}
                      />
                    ))}
                  </div>
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