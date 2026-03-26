'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { ImageItem } from '@/store/useGalleryStore';
import styles from './FileUploader.module.css';

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
  onDeleteFile?: (filePath: string) => Promise<void>;
  multiple?: boolean;
  existingFiles?: ImageItem[];
  pendingFiles?: File[];
  readOnly?: boolean;
  uploadingFileNames?: string[];
}

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  'pcx','dcx','wmf','emf','wpg','bpg','eprn','prm','ppm','pgm','pbm','pix','pct','pic','dib','psd','tiff','rpng','jif','vst','tga','bmp','jpg','apng','jpeg','heic','png','eps','webp','svgz','gif','svg','heif','prn','icns','xpm','abrn','tif','blk','avif',
]);

const ACCEPT_ATTR = Array.from(ALLOWED_IMAGE_EXTENSIONS)
  .map(ext => `.${ext}`)
  .join(',');

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

function isAllowedImageFile(file: File): boolean {
  const extension = getFileExtension(file.name);
  return ALLOWED_IMAGE_EXTENSIONS.has(extension);
}

function validateFiles(files: File[]) {
  const validFiles: File[] = [];
  const invalidFiles: File[] = [];

  for (const file of files) {
    if (isAllowedImageFile(file)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  }

  return { validFiles, invalidFiles };
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
  uploadingFileNames = [],
}: FileUploaderProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [deletingPaths, setDeletingPaths] = useState<Set<string>>(new Set());
  
  // Для drag-scroll
  const [isPointerDown, setIsPointerDown] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasUploadingFiles = uploadingFileNames.length > 0;
  const showUploadArea = !readOnly && (multiple || (existingFiles.length === 0 && pendingFiles.length === 0));

  const pendingPreviews = useMemo(() => {
    return pendingFiles.map(file => ({
      file,
      url: isAllowedImageFile(file) ? URL.createObjectURL(file) : null,
      key: `pending-${file.name}-${file.lastModified}`,
    }));
  }, [pendingFiles]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [pendingPreviews]);

  const isFileUploading = useCallback(
    (fileName: string) => uploadingFileNames.includes(fileName),
    [uploadingFileNames]
  );

  const showInvalidFilesAlert = (invalidFiles: File[]) => {
    if (invalidFiles.length === 0) return;
    const names = invalidFiles.map(file => file.name).join(', ');
    alert(`Допускается только загрузка изображений.\n\nОтклонены файлы: ${names}`);
  };

  const processFiles = (files: File[]) => {
    if (readOnly || hasUploadingFiles || files.length === 0 || !onFilesSelected) return;

    const { validFiles, invalidFiles } = validateFiles(files);

    if (invalidFiles.length > 0) {
      showInvalidFilesAlert(invalidFiles);
    }

    if (validFiles.length === 0) return;

    if (!multiple && (existingFiles.length + pendingFiles.length > 0 || validFiles.length > 1)) {
      alert('Можно загрузить только один файл');
      return;
    }

    onFilesSelected(taskId, multiple ? validFiles : [validFiles[0]]);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    processFiles(Array.from(fileList));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePending = (fileName: string) => {
    if (readOnly || hasUploadingFiles || !onRemovePendingFile) return;
    onRemovePendingFile(taskId, fileName);
  };

  const handleClearAll = () => {
    if (readOnly || hasUploadingFiles || !onFilesCleared) return;
    onFilesCleared(taskId);
  };

  // ✅ Возвращаем простой обработчик колеса мыши без ошибок
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const atLeftEdge = scrollLeft <= 0;
      const atRightEdge = scrollLeft + clientWidth >= scrollWidth;

      if ((e.deltaY < 0 && atLeftEdge) || (e.deltaY > 0 && atRightEdge)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      // Используем обычный scrollLeft вместо scrollBy для большей стабильности
      scrollRef.current.scrollLeft += e.deltaY * 2;
    }
  }, []);

  const handleImageLoad = (key: string) => {
    setLoadedImages(prev => ({ ...prev, [key]: true }));
  };

  const handleDeleteClick = async (filePath: string) => {
    if (!onDeleteFile) return;
    setDeletingPaths(prev => new Set(prev).add(filePath));
    try {
      await onDeleteFile(filePath);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    } finally {
      setDeletingPaths(prev => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    }
  };

  // Простая логика для drag-scroll (свайп мышкой)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current || e.button !== 0) return;
    
    // Если жмем на кнопку или ссылку — не начинаем драг
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
    
    const startX = e.pageX;
    const scrollLeft = scrollRef.current.scrollLeft;
    
    const handleMouseMove = (ev: MouseEvent) => {
      if (!scrollRef.current) return;
      const x = ev.pageX;
      const walk = (x - startX) * 1.5; // Скорость прокрутки
      scrollRef.current.scrollLeft = scrollLeft - walk;
    };
    
    const handleMouseUp = () => {
      if (scrollRef.current) {
        scrollRef.current.style.cursor = '';
        scrollRef.current.style.userSelect = '';
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`${styles.container} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={(e) => {
        if (!readOnly && !hasUploadingFiles) {
          e.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!readOnly && !hasUploadingFiles) {
          processFiles(Array.from(e.dataTransfer.files));
        }
      }}
    >
      {/* ✅ Добавил onWheel обратно и убрал сложную логику с слушателями */}
      <div
        className={styles.scrollWrapper}
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div className={styles.imagesRow}>
          {existingFiles.map((file) => {
            const isLoaded = loadedImages[file.path];
            const isDeleting = deletingPaths.has(file.path);

            return (
              <div
                key={file.path}
                className={`${styles.imageCard} ${isDeleting ? styles.imageCardDeleting : ''}`}
              >
                {!isLoaded && !isDeleting && <div className={styles.imageSkeleton} />}

                {file.href && (
                  <img
                    src={file.href}
                    alt={file.fileName}
                    className={`${styles.image} ${isLoaded ? styles.imageLoaded : styles.imageLoading}`}
                    onLoad={() => handleImageLoad(file.path)}
                    onError={() => handleImageLoad(file.path)}
                    draggable={false}
                  />
                )}

                {!file.href && <div className={styles.placeholder}>Нет превью</div>}

                {!readOnly && onDeleteFile && !isDeleting && !hasUploadingFiles && (
                  <button
                    onClick={() => handleDeleteClick(file.path)}
                    className={styles.deleteButton}
                    title="Удалить"
                  >
                    <X size={16} />
                    <span className={styles.deleteText}>Удалить</span>
                  </button>
                )}
              </div>
            );
          })}

          {!readOnly &&
            pendingPreviews.map(({ file, url, key }) => {
              const isLoaded = loadedImages[key];
              const isDeleting = deletingPaths.has(key);
              const isUploadingFile = isFileUploading(file.name);

              return (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className={`${styles.imageCard} ${isDeleting ? styles.imageCardDeleting : ''}`}
                >
                  {!isLoaded && !isDeleting && <div className={styles.imageSkeleton} />}

                  {url && (
                    <>
                      <img
                        src={url}
                        alt={file.name}
                        className={`${styles.image} ${
                          isUploadingFile
                            ? styles.imageUploading
                            : isLoaded
                            ? styles.imageLoaded
                            : styles.imageLoading
                        }`}
                        onLoad={() => handleImageLoad(key)}
                        onError={() => handleImageLoad(key)}
                        draggable={false}
                      />

                      {isUploadingFile && (
                        <div className={styles.imageOverlay}>
                          <Loader2 className={styles.spinner} size={28} />
                        </div>
                      )}
                    </>
                  )}

                  {!url && <div className={styles.placeholder}>Нет превью</div>}

                  {!isDeleting && !hasUploadingFiles && (
                    <button
                      onClick={() => handleRemovePending(file.name)}
                      className={styles.deleteButton}
                      title="Удалить из списка"
                    >
                      <X size={16} />
                      <span className={styles.deleteText}>Удалить</span>
                    </button>
                  )}
                </div>
              );
            })}

          {showUploadArea && (
            <div className={styles.uploadCard}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
                accept={ACCEPT_ATTR}
                multiple={multiple}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={styles.uploadButton}
                disabled={hasUploadingFiles}
              >
                <Upload size={24} />
                <span>{hasUploadingFiles ? 'Загрузка...' : 'Загрузить'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};