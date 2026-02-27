import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../core/services/project.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ReactiveFormsModule, NavbarComponent, DatePipe],
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  projects = signal<Project[]>([]);
  isLoading = signal(true);
  isCreating = signal(false);
  showForm = signal(false);
  errorMessage = signal('');

  createForm: FormGroup;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.group({
      name: ['', Validators.required, Validators.minLength(3)],
      description: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadsProjects();
  }

  loadsProjects() {
    this.isLoading.set(true);
    this.projectService.getMyProjects().subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load projects');
        this.isLoading.set(false);
      },
    });
  }

  createProject() {
    if (this.createForm.invalid) return;

    this.isCreating.set(true);
    this.projectService.createProject(this.createForm.value).subscribe({
      next: (res) => {
        this.projects.update((projects) => [res.data, ...projects]);
        this.createForm.reset();
        this.showForm.set(false);
        this.isCreating.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to create project');
        this.isCreating.set(false);
      },
    });
  }
}
