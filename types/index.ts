// ============================================================
// BASE ENTITY TYPES
// ============================================================

export interface User {
  user_id: number;
  user_login: string;
  admin_role: boolean;
  SMM_role: boolean;
  designer_role: boolean;
  coordinator_role: boolean;
  photographer_role: boolean;
}

export interface Tag {
  tag_id: number;
  name: string;
  color: string;
}

export interface TaskAssignee {
  user_id: number;
  user_login: string;
}

export interface UserPreview {
  user_login: string;
}

// ============================================================
// TASK TYPES
// ============================================================

export interface Task {
  task_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  priority: number;
  task_status: string;
  completed_task: string | null;
  created_at: string;
  created_by_id?: number;
  assignees: TaskAssignee[];
  tags: Tag[];
  created_by?: UserPreview;
}

export interface TaskWithRelations extends Task {
  created_by?: UserPreview;
  assignees: TaskAssignee[];
  tags: Tag[];
}

// Variant for calendar with type discriminator
export interface CalendarTask extends TaskWithRelations {
  type: 'task';
}

export interface TasksResponse {
  tasks: TaskWithRelations[];
  currentPage: number;
  totalPages: number;
  totalTasks: number;
}

// ============================================================
// POST TYPES
// ============================================================

export interface Post {
  post_id: number;
  post_title: string;
  post_description: string | null;
  post_status: string;
  tz_link: string | null;
  is_published: boolean;
  feedback_comment: string | null;

  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_photogallery: boolean;
  post_needs_mini_gallery: boolean;
  post_needs_text: boolean;

  post_done_link_mini_video_smm: string | null;
  post_done_link_video: string | null;
  post_done_link_cover_photo: string | null;
  post_done_link_photo_cards: string | null;
  post_done_link_photogallery: string | null;
  post_done_link_mini_gallery: string | null;
  post_done_link_text: string | null;

  responsible_person_id: number | null;
  approved_by_id: number | null;

  post_date: string | null;
  post_deadline: string;

  user?: UserPreview | null;
  approved_by?: UserPreview | null;
  tags?: Tag[];
}

export interface PostWithRelations extends Post {
  telegram_published?: string | null;
  vkontakte_published?: string | null;
  MAX_published?: string | null;
  comments?: Comment[];
}

// Variant for calendar/display with Date types
export interface CalendarPost extends Omit<PostWithRelations, 'post_date' | 'post_deadline' | 'comments'> {
  post_date: Date | null;
  post_deadline: Date;
  comments?: Comment[];
  tags?: Tag[];
  user?: UserPreview | null;
  approved_by?: UserPreview | null;
  type: 'post';
  [key: string]: unknown;
}

export interface PostsResponse {
  posts: PostWithRelations[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

// ============================================================
// COMMENT TYPES
// ============================================================

export interface Comment {
  id: number;
  text: string;
  status: string;
  created_at: string;
  task_type_id?: number;
  created_by_id: number;
  created_by?: {
    user_id: number;
    user_login: string;
  } | null;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiError {
  error: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface TaskFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  priority: number;
  task_status: string;
  assignees: User[];
  tags: Tag[];
}

export interface PostFormData {
  post_title: string;
  post_description: string;
  tz_link: string;
  post_status: string;
  responsible_person_id: string;
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_photogallery: boolean;
  post_needs_mini_gallery: boolean;
  post_needs_text: boolean;
}

// ============================================================
// CALENDAR TYPES (re-export from calendar.ts)
// ============================================================

export type { CalendarItem } from './calendar';
