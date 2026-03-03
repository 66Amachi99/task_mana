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
  created_at: Date;
}

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
  
  post_date: Date | null;
  post_deadline: Date;
  
  user?: User | null;
  approved_by?: User | null;
  tags?: Tag[];
}

export interface Task {
  task_id: number;
  title: string;
  description: string | null;
  created_by_id: number;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  priority: string;
  is_completed: boolean;
  
  created_by?: User;
  assignees?: TaskAssignee[];
  tags?: Tag[];
}

export interface TaskAssignee {
  task_assignee_id: number;
  task_id: number;
  user_id: number;
  user?: User;
  task?: Task;
}

export interface PostsResponse {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export interface ApiError {
  error: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  message?: string;
  data?: T;
}