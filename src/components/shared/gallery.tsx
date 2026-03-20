'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Download, Lock } from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';
import { FileUploader } from './file_uploader';
import styles from '../styles/PostDetailsRightPanel.module.css';

interface GalleryProps {
  folderPath: string | null;
  canEdit: boolean;
  multiple?: boolean;
  taskId: number;
  taskLabel: string;
  onFilesSelected?: (taskId: number, files: File[]) => void;
  onDelete?: (taskId: number, filePath: string) => Promise<void>;
  onRemovePendingFile?: (taskId: number, fileName: string) => void;
  uploading?: boolean;
  pendingFiles?: File[];
}

export const Gallery = ({
  folderPath,
  canEdit,
  multiple = true,
  taskId,
  taskLabel,
  onFilesSelected,
  onDelete,
  onRemovePendingFile,
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

  const handleDownloadAll = useCallback(async () => {
    if (cachedFiles.length === 0) return;

    for (const file of cachedFiles) {
      if (file.href) {
        const a = document.createElement('a');
        a.href = file.href;
        a.download = file.fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }, [cachedFiles]);

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.taskHeader}>
        <h4 className={styles.taskLabel}>
          {taskLabel}
          {!canEdit && <Lock className={styles.lockIcon} />}
        </h4>
        {cachedFiles.length > 0 && (
          <button
            onClick={handleDownloadAll}
            className={styles.downloadButton}
            title="Скачать все файлы"
          >
            <Download className="w-4 h-4" />
            <span>Скачать</span>
          </button>
        )}
      </div>
      <FileUploader
        existingFiles={cachedFiles}
        pendingFiles={pendingFiles}
        onFilesSelected={onFilesSelected}
        onDeleteFile={handleDelete}
        onRemovePendingFile={onRemovePendingFile}
        readOnly={!canEdit}
        multiple={multiple}
        isUploading={uploading}
        postId={0}
        taskId={taskId}
        taskName=""
        currentPath={null}
        onFilesCleared={undefined}
      />
    </div>
  );
};