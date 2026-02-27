import { Task } from './task.model';
import { User } from './user.model';

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
}

export interface ProjectDetail extends Project {
  members: User[];
  tasks: Task[];
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}
