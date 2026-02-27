export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assignee_id: number | null;
  due_date: string | null;
  created_by: number;
  created_at: string;
  update_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignee_id?: number;
  due_date?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignee_id?: number;
}
