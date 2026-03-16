'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import styles from '../styles/FileUploader.module.css';

export interface PendingFile {
  file: File;
  preview?: string;
}

interface FileUploaderProps {
  postId: number;
  taskId: number;
  taskName: string;
  currentPath: string | null;
  onFilesSelected?: (taskId: number, files: File[]) => void;
  onFilesCleared?: (taskId: number) => void;
  onRemovePendingFile?: (taskId: number, fileName: string) => void;
  onDeleteFile?: (taskId: number, filePath: string) => Promise<void>;
  multiple?: boolean;
  existingFiles?: Array<{ fileName: string; path: string; sizes?: Array<{ url: string; name: string }> }>;
  pendingFiles?: File[];
  readOnly?: boolean;
}

export const FileUploader = ({
  postId,
  taskId,
  taskName,
  currentPath,
  onFilesSelected,
  onFilesCleared,
  onRemovePendingFile,
  onDeleteFile,
  multiple = true,
  existingFiles = [],
  pendingFiles = [],
  readOnly = false,
}: FileUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showUploadArea = !readOnly;

  const handleFiles = (fileList: FileList | null) => {
    if (readOnly || !fileList || fileList.length === 0 || !onFilesSelected) return;
    const filesArray = Array.from(fileList);
    onFilesSelected(taskId, filesArray);
  };

  const handleRemovePending = (fileName: string) => {
    if (readOnly || !onRemovePendingFile) return;
    onRemovePendingFile(taskId, fileName);
  };

  const handleClearAll = () => {
    if (readOnly || !onFilesCleared) return;
    onFilesCleared(taskId);
  };

  // Горизонтальная прокрутка колесиком мыши (быстрая и плавная)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Увеличиваем множитель для более быстрой прокрутки
      scrollRef.current.scrollBy({
        left: e.deltaY * 2, // множитель 3 для увеличения скорости
        behavior: 'smooth'
      });
    }
  }, []);

  // Очистка object URLs при размонтировании
  useEffect(() => {
    const urls: string[] = [];
    pendingFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        urls.push(URL.createObjectURL(file));
      }
    });
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [pendingFiles]);

  return (
    <div
      className={`${styles.container} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={(e) => { if (!readOnly) { e.preventDefault(); setIsDragOver(true); } }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { if (!readOnly) { e.preventDefault(); setIsDragOver(false); handleFiles(e.dataTransfer.files); } }}
    >
      <div 
        className={styles.scrollWrapper} 
        ref={scrollRef} 
        onWheel={handleWheel}
      >
        <div className={styles.imagesRow}>
          {/* Загруженные файлы */}
          {existingFiles.map((file) => (
            <div key={file.path} className={styles.imageCard}>
              {file.sizes && file.sizes[0] ? (
                <img src={file.sizes[0].url} alt={file.fileName} className={styles.image} />
              ) : (
                <div className={styles.placeholder}>Нет превью</div>
              )}
              {!readOnly && onDeleteFile && (
                <button
                  onClick={() => onDeleteFile(taskId, file.path)}
                  className={styles.deleteButton}
                  title="Удалить"
                >
                  <X size={16} />
                  <span className={styles.deleteText}>Удалить</span>
                </button>
              )}
            </div>
          ))}

          {/* Ожидающие загрузки файлы */}
          {!readOnly && pendingFiles.map((file) => (
            <div key={file.name} className={styles.imageCard}>
              {file.type.startsWith('image/') && (
                <img src={URL.createObjectURL(file)} alt={file.name} className={styles.image} />
              )}
              <button
                onClick={() => handleRemovePending(file.name)}
                className={styles.deleteButton}
                title="Удалить из списка"
              >
                <X size={16} />
                <span className={styles.deleteText}>Удалить</span>
              </button>
            </div>
          ))}

          {/* Блок загрузки (всегда справа, если есть права) */}
          {showUploadArea && (
            <div className={styles.uploadCard}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
                accept="image/*"
                multiple={multiple}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={styles.uploadButton}
              >
                <Upload size={24} />
                <span>Загрузить</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};