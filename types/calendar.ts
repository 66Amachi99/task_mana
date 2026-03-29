import type { Tag, UserPreview, Comment, CalendarPost } from './index';

// Re-export CalendarPost for convenience
export type { CalendarPost } from './index';

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
  tags: Tag[];
  created_by?: UserPreview;
  type: 'task';
  [key: string]: unknown;
}

export type CalendarItem = CalendarPost | CalendarTask;

export interface DayItems {
  date: string;
  posts: CalendarPost[];
  tasks: CalendarTask[];
}

export interface DayStats {
  total: number;
  completed: number;
  postsTotal: number;
  postsCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
}

export interface MonthStats {
  postsTotal: number;
  tasksTotal: number;
}