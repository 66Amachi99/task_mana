'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
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
  isUploading?: boolean;
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
  isUploading = false,
}: FileUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showUploadArea = !readOnly && !isUploading && (multiple || (existingFiles.length === 0 && pendingFiles.length === 0));

  const handleFiles = (fileList: FileList | null) => {
    if (readOnly || isUploading || !fileList || fileList.length === 0 || !onFilesSelected) return;

    if (!multiple && (existingFiles.length + pendingFiles.length > 0)) {
      alert('Можно загрузить только один файл');
      return;
    }

    const filesArray = Array.from(fileList);
    onFilesSelected(taskId, filesArray);
  };

  const handleRemovePending = (fileName: string) => {
    if (readOnly || isUploading || !onRemovePendingFile) return;
    onRemovePendingFile(taskId, fileName);
  };

  const handleClearAll = () => {
    if (readOnly || isUploading || !onFilesCleared) return;
    onFilesCleared(taskId);
  };

  // Горизонтальная прокрутка с интеллектуальным возвратом к вертикальной
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const atLeftEdge = scrollLeft <= 0;
      const atRightEdge = scrollLeft + clientWidth >= scrollWidth;

      // Если пытаемся прокрутить влево, но уже у левого края, или вправо, но у правого края – не перехватываем
      if ((e.deltaY < 0 && atLeftEdge) || (e.deltaY > 0 && atRightEdge)) {
        return; // разрешаем вертикальную прокрутку страницы
      }

      e.preventDefault();
      e.stopPropagation();
      scrollRef.current.scrollBy({
        left: e.deltaY * 3,
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
      onDragOver={(e) => { if (!readOnly && !isUploading) { e.preventDefault(); setIsDragOver(true); } }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!readOnly && !isUploading) {
          handleFiles(e.dataTransfer.files);
        }
      }}
    >
      <div 
        className={styles.scrollWrapper} 
        ref={scrollRef} 
        onWheel={handleWheel}
      >
        {isUploading ? (
          <div className={styles.loadingOverlay}>
            <Loader2 className={styles.spinner} size={40} />
            <span>Загрузка...</span>
          </div>
        ) : (
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

            {/* Блок загрузки */}
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
        )}
      </div>
    </div>
  );
};