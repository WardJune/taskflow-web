import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectDetail } from '../../../models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskStatus, UpdateTaskRequest } from '../../../models/task.model';
import { User } from '../../../models/user.model';
import { isNull, toFinite } from 'lodash';

@Component({
  selector: 'app-project-detail.component',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent, DatePipe, RouterLink],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private fb = inject(FormBuilder);

  project = signal<ProjectDetail | null>(null);
  isLoading = signal(true);
  isCreating = signal(false);
  isAddingMembers = signal(false);
  isUpdating = signal(false);
  showTaskForm = signal(false);
  showMemberForm = signal(false);
  editingTask = signal<Task | null>(null);
  deletingTask = signal<number | null>(null);
  errorMessage = signal('');

  users = signal<User[]>([]);

  projectId!: number;
  taskForm: FormGroup;
  updateForm: FormGroup;

  memberForm = this.fb.nonNullable.group({
    user_ids: [[0], Validators.required],
  });

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      assignee_id: [null],
      due_date: [null],
    });
    this.updateForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      status: ['', Validators.required],
      assignee_id: [0],
      due_date: [''],
    });
  }

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadAvailableUsers();
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

  getMemberName(userId: number | null): string {
    if (!userId) return 'Unassigned';
    const member = this.project()?.members.find((o) => o.id === userId);

    return member?.name ?? 'Unknown';
  }

  openEditTask(task: Task) {
    this.editingTask.set(task);
    this.updateForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      assignee_id: task.assignee_id,
      due_date: task.due_date ? task.due_date.substring(0, 10) : null,
    });
  }

  closeEditTask() {
    this.editingTask.set(null);
    this.updateForm.reset();
  }

  openDeleteTask(id: number) {
    this.deletingTask.set(id);
  }

  closeDeleteTask() {
    this.deletingTask.set(null);
  }

  createTask() {
    if (this.taskForm.invalid) return;

    this.isCreating.set(true);

    const formValue = this.taskForm.value;
    if (!isNull(this.taskForm.value?.due_date)) {
      formValue.due_date = new Date(this.taskForm.value.due_date);
    }
    if (!isNull(this.taskForm.value?.assignee_id)) {
      formValue.assignee_id = toFinite(this.taskForm.value.assignee_id);
    }

    this.projectService.createTask(this.projectId, formValue).subscribe({
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

  updateTask() {
    if (this.updateForm.invalid || !this.editingTask()) return;

    this.isUpdating.set(true);

    const formValue = this.updateForm.value;
    if (!isNull(this.updateForm.value?.due_date)) {
      formValue.due_date = new Date(this.updateForm.value.due_date);
    }
    if (!isNull(this.updateForm.value?.assignee_id)) {
      formValue.assignee_id = toFinite(this.updateForm.value.assignee_id);
    }

    this.projectService.updateTask(this.editingTask()!.id, formValue).subscribe({
      next: (res) => {
        this.project.update((p) =>
          p
            ? {
                ...p,
                tasks: p.tasks.map((t) => (t.id === res.data.id ? res.data : t)),
              }
            : p,
        );
        this.closeEditTask();
        this.isUpdating.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to update task');
        this.isUpdating.set(false);
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

  deleteTask() {
    if (isNull(this.deletingTask())) return;

    const taskId = this.deletingTask()!;

    this.projectService.deleteTask(taskId).subscribe({
      next: () => {
        this.project.update((p) =>
          p
            ? {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
              }
            : p,
        );

        this.closeDeleteTask();
        this.deletingTask.set(null);
      },
      error: () => this.errorMessage.set('Failed to delete task'),
    });
  }

  loadAvailableUsers() {
    this.projectService.getAvailableUserProject(this.projectId).subscribe({
      next: (res) => {
        this.users.set(res.data);
      },
      error: () => {
        this.errorMessage.set('Failed to load available users');
      },
    });
  }

  addMembers() {
    if (this.memberForm.invalid || this.isAddingMembers()) return;

    this.isAddingMembers.set(true);
    const usersIds = this.memberForm.value.user_ids;
    const ids = Array.isArray(usersIds) ? usersIds : [];

    ids.forEach((userId, index) => {
      this.projectService.addMember(this.projectId, userId).subscribe({
        next: () => {
          if (index === ids.length - 1) {
            this.loadProject();
            this.loadAvailableUsers();
            this.memberForm.reset();
            this.showMemberForm.set(false);
            this.isAddingMembers.set(false);
          }
        },
        error: () => {
          this.errorMessage.set('Failed to add members');
          this.isAddingMembers.set(false);
        },
      });
    });
  }

  // helper

  private cleanPayload(value: any) {
    return Object.fromEntries(Object.entries(value).filter(([_, v]) => v !== null && ''));
  }

  isPastDue(task: Task): boolean {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  }

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
