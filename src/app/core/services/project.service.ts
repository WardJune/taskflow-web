import { Injectable } from '@angular/core';
import { environment } from '../../../environtments/environments';
import { HttpClient } from '@angular/common/http';
import { CreateProjectRequest, Project, ProjectDetail } from '../../models/project.model';
import { CreateTaskRequest, Task, UpdateTaskRequest } from '../../models/task.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyProjects() {
    return this.http.get<ApiResponse<Project[]>>(`${this.apiUrl}/projects`);
  }

  getProjectById(id: number) {
    return this.http.get<ApiResponse<ProjectDetail>>(`${this.apiUrl}/projects/${id}`);
  }

  createProject(req: CreateProjectRequest) {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/projects`, req);
  }

  addMember(projectId: number, userId: number) {
    return this.http.post<ApiResponse<Project>>(`${this.apiUrl}/projects/${projectId}/members`, {
      userId,
    });
  }

  createTask(projectId: number, req: CreateTaskRequest) {
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}/projects/${projectId}/tasks`, req);
  }

  updateTask(taskId: number, req: UpdateTaskRequest) {
    return this.http.patch<ApiResponse<Task>>(`${this.apiUrl}/tasks/${taskId}`, req);
  }

  deleteTask(taskId: number) {
    return this.http.delete<ApiResponse<Task>>(`${this.apiUrl}/tasks/${taskId}`);
  }
}
