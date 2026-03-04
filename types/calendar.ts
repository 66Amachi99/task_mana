import { Task } from './task';

export interface CalendarPost {
  post_id: number;
  post_title: string;
  post_description: string;
  post_status: string;
  is_published: boolean;
  post_deadline: Date;
  post_date: Date | null;
  
  post_needs_mini_video_smm: boolean;
  post_needs_video: boolean;
  post_needs_text: boolean;
  post_needs_photogallery: boolean;
  post_needs_cover_photo: boolean;
  post_needs_photo_cards: boolean;
  post_needs_mini_gallery: boolean;
  
  post_done_link_mini_video_smm?: string | null;
  post_done_link_video?: string | null;
  post_done_link_text?: string | null;
  post_done_link_photogallery?: string | null;
  post_done_link_cover_photo?: string | null;
  post_done_link_photo_cards?: string | null;
  post_done_link_mini_gallery?: string | null;
  
  tags?: Array<{ tag_id: number; name: string; color: string }>;
  comments?: Array<any>;
  
  responsible_person_id: number | null;
  user?: { user_login: string } | null;
  approved_by?: { user_login: string } | null;
  
  tz_link?: string | null;
  feedback_comment?: string | null;
  
  type: 'post';
  [key: string]: unknown;
}

export interface CalendarTask {
  task_id: number;
  title: string;
  description: string | null;
  task_status: string;
  end_time: string;
  start_time: string;
  all_day: boolean;
  priority: number;
  completed_task: string | null;
  created_at: string;
  assignees: Array<{ user_id: number; user_login: string }>;
  tags: Array<{ tag_id: number; name: string; color: string }>;
  created_by?: { user_login: string };
  type: 'task';
  [key: string]: unknown;
}

export type CalendarItem = CalendarPost | CalendarTask;

export interface DayItems {
  date: string;
  posts: CalendarPost[];
  tasks: CalendarTask[];
}

// Добавляем интерфейс для статистики дня
export interface DayStats {
  total: number;
  completed: number;
  postsTotal: number;
  postsCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
}

// Добавляем интерфейс для статистики месяца
export interface MonthStats {
  postsTotal: number;
  tasksTotal: number;
}