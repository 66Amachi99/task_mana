'use client';

import { useRef, useEffect, useState } from 'react';
import { Lock, ExternalLink, Circle, CheckCircle, MessageSquare } from 'lucide-react';
import { TASK_CONFIG, COMMENT_STATUS, TaskWithComments, CommentData } from './post_details_window';
import { useUser } from '../../hooks/use-roles';

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

// Маленький textarea для комментариев (как был)
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
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
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
      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden min-h-[80px]"
      rows={2}
    />
  );
};

const CommentItem = ({ comment, onStatusChange, userCanEdit }: {
  comment: CommentData;
  onStatusChange: (commentId: number, newStatus: string) => void;
  userCanEdit: boolean;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case COMMENT_STATUS.RED: return 'bg-red-50 border-red-200';
      case COMMENT_STATUS.YELLOW: return 'bg-yellow-50 border-yellow-200';
      case COMMENT_STATUS.GREEN: return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
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
    <div className={`mt-2 p-3 rounded-lg border ${getStatusColor(comment.status)}`}>
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-1">{getStatusIcon(comment.status)}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.text}</p>
          <p className="text-xs text-gray-500 mt-1">{formatCommentDate(comment.created_at)}</p>
        </div>
        {canChangeStatus() && (
          <button
            onClick={handleStatusClick}
            disabled={isUpdating}
            className="shrink-0 px-2 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
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
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm md:text-lg font-medium text-gray-700">Задачи</h3>
        <span className="text-xs md:text-sm text-gray-500">{tasks.length} {pluralizeTasks(tasks.length)}</span>
      </div>
      <div className="space-y-4 max-h-[40vh] md:max-h-none overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map(task => {
            const originalLink = (post[task.linkKey] as string) || '';
            const hasLink = originalLink.trim() !== '';
            const userCanEdit = canEditPostTask(task.role);
            const userCanAddComment = canAddComment ? canAddComment(task.role) : userCanEdit;

            return (
              <div key={task.id} className="border rounded-lg p-4">
                {/* Родительский flex-контейнер для строки задачи с динамическим выравниванием */}
                <div className={`flex flex-col sm:flex-row gap-3 mb-3 ${task.role === 'text' ? 'sm:items-start' : 'sm:items-center'}`}>
                  <div className="sm:w-1/4">
                    <h4 className="font-medium text-gray-800 text-base flex items-center gap-1">
                      {task.label}
                      {!userCanEdit && <Lock className="w-4 h-4 text-gray-400" />}
                    </h4>
                  </div>
                  <div className="sm:w-3/4">
                    {userCanEdit ? (
                      // Если задача с ролью 'text' – используем большой TaskTextarea, иначе – обычный input
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isSaving || isActionLoading}
                        />
                      )
                    ) : (
                      <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-base text-gray-500 truncate">
                        {task.link || 'Нет доступа к редактированию'}
                      </div>
                    )}
                  </div>
                </div>
                {/* Блок со ссылкой показываем только для задач, не являющихся текстовыми */}
                {hasLink && task.role !== 'text' && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-gray-500 shrink-0">Ссылка:</span>
                        <p className="text-sm text-blue-600 truncate" title={originalLink}>{originalLink}</p>
                      </div>
                      <button
                        onClick={e => handleLinkClick(originalLink, e)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium shrink-0 ml-2 cursor-pointer"
                        title="Открыть в новой вкладке"
                      >
                        <ExternalLink className="w-4 h-4" /> Открыть
                      </button>
                    </div>
                  </div>
                )}
                {task.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
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
                  <div className="mt-3 pt-3 border-t border-dashed">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-2 shrink-0" />
                      <div className="flex-1">
                        {/* Для комментариев оставляем маленький AutoResizeTextarea */}
                        <AutoResizeTextarea
                          value={task.newCommentText}
                          onChange={e => onNewCommentChange(task.id, e.target.value)}
                          placeholder="Добавить комментарий..."
                          disabled={isSaving || isActionLoading || isAdding}
                        />
                        {task.newCommentText.trim() && (
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleAddCommentClick(task.id)}
                              disabled={isSaving || isActionLoading || isAdding}
                              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium disabled:opacity-50"
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
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <p className="text-gray-500">Нет задач для этого поста</p>
          </div>
        )}
      </div>
    </div>
  );
};