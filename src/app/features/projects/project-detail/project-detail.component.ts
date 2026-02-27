import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectDetail } from '../../../models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskStatus, UpdateTaskRequest } from '../../../models/task.model';

@Component({
  selector: 'app-project-detail.component',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent, DatePipe, RouterLink],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  project = signal<ProjectDetail | null>(null);
  isLoading = signal(true);
  isCreating = signal(false);
  showTaskForm = signal(false);
  errorMessage = signal('');

  taskForm: FormGroup;
  projectId!: number;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private fb: FormBuilder,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
    });
  }

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  loadProject() {
    this.isLoading.set(true);
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load project');
        this.isLoading.set(false);
      },
    });
  }

  createTask() {
    if (this.taskForm.invalid) return;

    this.isCreating.set(true);
    this.projectService.createTask(this.projectId, this.taskForm.value).subscribe({
      next: (res) => {
        this.project.update((p) =>
          p
            ? {
                ...p,
                tasks: [res.data, ...p.tasks],
              }
            : p,
        );

        this.taskForm.reset();
        this.showTaskForm.set(false);
        this.isCreating.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to create Task');
        this.isCreating.set(false);
      },
    });
  }

  updateTaskStatus(task: Task, status: TaskStatus) {
    const req: UpdateTaskRequest = { status };
    this.projectService.updateTask(task.id, req).subscribe({
      next: (res) => {
        this.project.update((p) =>
          p ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? res.data : t)) } : p,
        );
      },
      error: () => {
        this.errorMessage.set('Failed to update task');
      },
    });
  }

  deleteTask(taskId: number) {
    if (!confirm('Delete this task?')) return;

    this.projectService.deleteTask(taskId).subscribe({
      next: (res) => {
        this.project.update((p) =>
          p
            ? {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
              }
            : p,
        );
      },
      error: () => this.errorMessage.set('Failed to delete task'),
    });
  }

  // helper
  statusClass(status: TaskStatus): string {
    const classes: Record<TaskStatus, string> = {
      todo: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-yellow-100 text-yellow-700',
      done: 'bg-green-100 text-green-700',
    };
    return classes[status];
  }

  statusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    };
    return labels[status];
  }
}
