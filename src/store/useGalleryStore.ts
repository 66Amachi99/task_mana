import { create } from 'zustand';

export interface ImageItem {
  fileName: string;
  path: string;
  href: string;
  created?: string;
  modified?: string;
}

type ImagesOrUpdater = ImageItem[] | ((prev: ImageItem[]) => ImageItem[]);

interface GalleryState {
  cache: Record<string, ImageItem[]>;
  setImagesToCache: (folderPath: string, images: ImagesOrUpdater) => void;
  removeImageFromCache: (folderPath: string, imagePath: string) => void;
  renameCacheKey: (oldPath: string, newPath: string) => void;
  clearCache: () => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  cache: {},
  setImagesToCache: (folderPath, images) =>
    set((state) => {
      const currentImages = state.cache[folderPath] || [];
      const nextImages = typeof images === 'function' ? images(currentImages) : images;
      return {
        cache: { ...state.cache, [folderPath]: nextImages },
      };
    }),
  removeImageFromCache: (folderPath, imagePath) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [folderPath]: state.cache[folderPath]?.filter((img) => img.path !== imagePath) || [],
      },
    })),
  renameCacheKey: (oldPath, newPath) =>
    set((state) => {
      if (!state.cache[oldPath]) return state;
      const { [oldPath]: oldEntry, ...restCache } = state.cache;
      const updatedImages = oldEntry.map((img) => ({
        ...img,
        path: img.path.replace(oldPath, newPath),
      }));
      return {
        cache: {
          ...restCache,
          [newPath]: updatedImages,
        },
      };
    }),
  clearCache: () => set({ cache: {} }),
}));