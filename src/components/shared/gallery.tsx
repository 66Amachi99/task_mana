'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGalleryStore } from '@/store/useGalleryStore';
import { FileUploader } from './file_uploader';

interface GalleryProps {
  folderPath: string | null;
  canEdit: boolean;
  multiple?: boolean;
  taskId: number;
  onFilesSelected?: (taskId: number, files: File[]) => void;
  onDelete?: (taskId: number, filePath: string) => Promise<void>;
  uploading?: boolean;
  pendingFiles?: File[];
}

export const Gallery = ({
  folderPath,
  canEdit,
  multiple = true,
  taskId,
  onFilesSelected,
  onDelete,
  uploading = false,
  pendingFiles = [],
}: GalleryProps) => {
  const cachedFiles = useGalleryStore(
    useShallow((state) => (folderPath ? state.cache[folderPath] || [] : []))
  );
  const setImagesToCache = useGalleryStore((state) => state.setImagesToCache);

  useEffect(() => {
    if (!folderPath || cachedFiles.length > 0) return;

    const loadFiles = async () => {
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
        console.error(`Ошибка загрузки файлов для ${folderPath}:`, error);
      }
    };
    loadFiles();
  }, [folderPath, cachedFiles.length, setImagesToCache]);

  const handleDelete = useCallback((filePath: string) => {
    if (onDelete) {
      return onDelete(taskId, filePath);
    }
    return Promise.resolve();
  }, [onDelete, taskId]);

  return (
    <FileUploader
      existingFiles={cachedFiles}
      pendingFiles={pendingFiles}
      onFilesSelected={onFilesSelected}
      onDeleteFile={handleDelete}
      readOnly={!canEdit}
      multiple={multiple}
      isUploading={uploading}
      postId={0}
      taskId={taskId}
      taskName=""
      currentPath={null}
      onFilesCleared={undefined}
      onRemovePendingFile={undefined}
    />
  );
};