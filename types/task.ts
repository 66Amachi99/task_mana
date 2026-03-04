export interface TaskAssignee {
  user_id: number;
  user_login: string;
}

export interface TaskTag {
  tag_id: number;
  name: string;
  color: string;
}

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
  assignees: TaskAssignee[];
  tags: TaskTag[];
  created_by?: {
    user_login: string;
  };
  type?: 'task'; // Опционально, для различения с постами
  [key: string]: unknown; // Сигнатура индекса
}