// ============================================================
// TASK CONFIGURATION - Maps post tasks to their properties
// ============================================================

export const TASK_CONFIG = [
  {
    id: 1,
    name: 'mini_video_smm',
    label: 'Мини-видео',
    needsKey: 'post_needs_mini_video_smm',
    linkKey: 'post_done_link_mini_video_smm',
    role: 'smm',
  },
  {
    id: 2,
    name: 'video',
    label: 'Видео',
    needsKey: 'post_needs_video',
    linkKey: 'post_done_link_video',
    role: 'photographer',
  },
  {
    id: 3,
    name: 'text',
    label: 'Текст',
    needsKey: 'post_needs_text',
    linkKey: 'post_done_link_text',
    role: 'text',
  },
  {
    id: 4,
    name: 'photogallery',
    label: 'Фотогалерея',
    needsKey: 'post_needs_photogallery',
    linkKey: 'post_done_link_photogallery',
    role: 'photographer',
  },
  {
    id: 5,
    name: 'cover_photo',
    label: 'Обложка',
    needsKey: 'post_needs_cover_photo',
    linkKey: 'post_done_link_cover_photo',
    role: 'designer',
  },
  {
    id: 6,
    name: 'photo_cards',
    label: 'Фотокарточки',
    needsKey: 'post_needs_photo_cards',
    linkKey: 'post_done_link_photo_cards',
    role: 'designer',
  },
  {
    id: 7,
    name: 'mini_gallery',
    label: 'Мини-фотогалерея',
    needsKey: 'post_needs_mini_gallery',
    linkKey: 'post_done_link_mini_gallery',
    role: 'smm',
  },
] as const;

export const FILE_SUPPORT_TASK_IDS = [5, 6, 7] as const;
export type FileSupportTaskId = typeof FILE_SUPPORT_TASK_IDS[number];

export const isFileSupportTask = (id: number): id is FileSupportTaskId => {
  return (FILE_SUPPORT_TASK_IDS as readonly number[]).includes(id);
};

// ============================================================
// SOCIAL CONFIGURATION - Social media publishing links
// ============================================================

export const SOCIAL_CONFIG = [
  {
    key: 'telegram',
    label: 'Telegram',
    icon: '/icons/telegram.svg',
    placeholder: 'https://t.me/...',
    publishedKey: 'telegram_published',
  },
  {
    key: 'vkontakte',
    label: 'VK',
    icon: '/icons/vk.svg',
    placeholder: 'https://vk.com/...',
    publishedKey: 'vkontakte_published',
  },
  {
    key: 'max',
    label: 'MAX',
    icon: '/icons/max.svg',
    placeholder: 'https://max.ru/...',
    publishedKey: 'MAX_published',
  },
] as const;

export type SocialKey = typeof SOCIAL_CONFIG[number]['key'];
export type SocialLinks = Record<SocialKey, string>;

// ============================================================
// COMMENT STATUS
// ============================================================

export const COMMENT_STATUS = {
  NEW: 'new',
  COMPLETED: 'completed',
  CONFIRMED: 'confirmed',
} as const;

export type CommentStatus = (typeof COMMENT_STATUS)[keyof typeof COMMENT_STATUS];

// ============================================================
// POST STATUS
// ============================================================

export const POST_STATUS = {
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершен',
} as const;

// ============================================================
// TASK STATUS
// ============================================================

export const TASK_STATUS = {
  ASSIGNED: 'Поставлена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнена',
} as const;

// ============================================================
// PRIORITY LEVELS
// ============================================================

export const PRIORITY_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
} as const;

export const PRIORITY_LABELS: Record<number, string> = {
  [PRIORITY_LEVELS.NONE]: 'Не важно',
  [PRIORITY_LEVELS.LOW]: 'Низкий',
  [PRIORITY_LEVELS.MEDIUM]: 'Средний',
  [PRIORITY_LEVELS.HIGH]: 'Высокий',
};

// ============================================================
// ROLES
// ============================================================

export const ROLES = {
  SMM: 'smm',
  PHOTOGRAPHER: 'photographer',
  DESIGNER: 'designer',
  TEXT: 'text',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ============================================================
// POST TASK ITEMS - For quick toggle buttons
// ============================================================

export const POST_TASK_ITEMS = [
  { id: 'post_needs_mini_video_smm', label: 'Мини-видео' },
  { id: 'post_needs_video', label: 'Видео' },
  { id: 'post_needs_cover_photo', label: 'Обложка' },
  { id: 'post_needs_photo_cards', label: 'Фотокарточки' },
  { id: 'post_needs_photogallery', label: 'Фотогалерея' },
  { id: 'post_needs_mini_gallery', label: 'Мини-фотогалерея' },
] as const;
