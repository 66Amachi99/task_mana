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
  created_by_id: number;
  created_by?: {
    user_login: string;
  };
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  priority: number;
  task_status: string;
  completed_task: string | null;
  created_at: Date;
  updated_at: Date;
  assignees: TaskAssignee[];
  tags: TaskTag[];
}

export interface TaskWithRelations extends Task {
  created_by?: {
    user_login: string;
  };
  assignees: Array<{
    user_id: number;
    user_login: string;
  }>;
  tags: TaskTag[];
}

export interface TasksResponse {
  tasks: TaskWithRelations[];
  currentPage: number;
  totalPages: number;
  totalTasks: number;
}