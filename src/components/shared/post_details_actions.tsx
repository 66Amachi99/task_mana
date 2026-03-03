'use client';

import { CheckCircle, Globe, Trash2 } from 'lucide-react';

interface PostData {
  is_published: boolean;
}

interface PostDetailsActionsProps {
  canEditPost: boolean;
  canShowApprove: boolean;
  canShowPublish: boolean;
  canDelete: boolean;
  canManageSocial: boolean;
  post: PostData;
  hasChanges: boolean;
  hasEditableTasks: boolean;
  isSaving: boolean;
  isActionLoading: boolean;
  onEdit: () => void;
  onApprove: () => void;
  onPublishToggle: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export const PostDetailsActions = ({
  canEditPost,
  canShowApprove,
  canShowPublish,
  canDelete,
  canManageSocial,
  post,
  hasChanges,
  hasEditableTasks,
  isSaving,
  isActionLoading,
  onEdit,
  onApprove,
  onPublishToggle,
  onDelete,
  onSave
}: PostDetailsActionsProps) => {
  return (
    <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        {canEditPost && (
          <button
            onClick={onEdit}
            disabled={isActionLoading}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Изменить
          </button>
        )}

        {canShowApprove && (
          <button
            onClick={onApprove}
            disabled={isActionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            title="Согласовать пост"
          >
            <CheckCircle className="w-4 h-4" />
            Согласовать
          </button>
        )}

        {canShowPublish && (
          <button
            onClick={onPublishToggle}
            disabled={isActionLoading}
            className={`px-4 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
              post.is_published ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            {post.is_published ? 'Снять с публикации' : 'Опубликовать'}
          </button>
        )}

        {canDelete && (
          <button
            onClick={onDelete}
            disabled={isActionLoading}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 ml-2"
            title="Удалить пост"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        )}
      </div>

      {(hasEditableTasks || (canManageSocial && post.is_published)) && hasChanges && (
        <button
          onClick={onSave}
          disabled={isSaving || isActionLoading}
          className={`px-6 py-2 text-white rounded-md text-sm font-medium flex items-center gap-2 ${
            isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Сохранение...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Сохранить изменения
            </>
          )}
        </button>
      )}
    </div>
  );
};