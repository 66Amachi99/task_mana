'use client';

import { useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Download } from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';
import { FileUploader } from '../file-uploader/file-uploader';
import styles from './Gallery.module.css';

interface GalleryProps {
  folderPath: string | null;
  canEdit: boolean;
  multiple?: boolean;
  taskId: number;
  taskLabel: string;
  taskIcon?: string;
  onFilesSelected?: (taskId: number, files: File[]) => void | Promise<void>;
  onDelete?: (taskId: number, filePath: string) => Promise<void>;
  onRemovePendingFile?: (taskId: number, fileName: string) => void;
  uploadingFileNames?: string[];
  pendingFiles?: File[];
  forceDisabled?: boolean;
}

export const Gallery = ({
  folderPath,
  canEdit,
  multiple = true,
  taskId,
  taskLabel,
  taskIcon,
  onFilesSelected,
  onDelete,
  onRemovePendingFile,
  uploadingFileNames = [],
  pendingFiles = [],
  forceDisabled = false,
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
      if (file.path) {
        try {
          // Получаем временную ссылку на скачивание через API
          const res = await fetch(`/api/disk/download?path=${encodeURIComponent(file.path)}`);
          const data = await res.json();
          
          if (data.downloadUrl) {
            // Открываем ссылку в новом окне - Яндекс Диск отдаст файл напрямую
            window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
            // Небольшая задержка между скачиваниями
            await new Promise(resolve => setTimeout(resolve, 300));
          } else if (data.error) {
            console.error(`Ошибка скачивания ${file.fileName}:`, data.error);
          }
        } catch (error) {
          console.error(`Ошибка скачивания ${file.fileName}:`, error);
        }
      }
    }
  }, [cachedFiles]);

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.taskHeader}>
        <div className={styles.taskLabelWithIcon}>
          {taskIcon && (
            <img src={taskIcon} alt={taskLabel} className={styles.taskIcon} />
          )}
          <h4 className={styles.taskLabel}>
            {taskLabel}
          </h4>
        </div>

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
        readOnly={!canEdit || forceDisabled}
        multiple={multiple}
        uploadingFileNames={uploadingFileNames}
        postId={0}
        taskId={taskId}
        taskName=""
        currentPath={null}
        onFilesCleared={undefined}
      />
    </div>
  );
};